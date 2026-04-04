using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Models.DTO;
using Heteroboxd.Shared.Models.Enums;
using Microsoft.Extensions.Configuration;
using System.Collections.Concurrent;

namespace Heteroboxd.Shared.Integrations
{
    public interface ITMDBParser
    {
        Task<(Film Film, List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseResponse(TMDBInfoResponse Response, ConcurrentDictionary<int, byte> ThreadsafeCelebs);
        Task ParseCollection(int TmdbId, Film Film);
        Task<(Film Film, List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseFilm(TMDBInfoResponse Response, ConcurrentDictionary<int, byte> ThreadsafeCelebs);
        Task<(List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseCredits(Credits? Credits, int FilmId, ConcurrentDictionary<int, byte> ThreadsafeCelebs);
        Celebrity ParseCelebrity(TMDBCelebrityResponse CelebrityResponse);
    }

    public class TMDBParser : ITMDBParser
    {
        private readonly ITMDBClient _tmdbClient;
        private readonly IConfiguration _configuration;

        public TMDBParser(ITMDBClient tmdbClient, IConfiguration configuration)
        {
            _tmdbClient = tmdbClient;
            _configuration = configuration;
        }

        public async Task<(Film Film, List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseResponse(TMDBInfoResponse Response, ConcurrentDictionary<int, byte> ThreadsafeCelebs)
        {
            if (Response.id == null) throw new ArgumentException("tMDB mustn't be null!");
            var (Film, Celebrities, Credits) = await ParseFilm(Response, ThreadsafeCelebs);
            if (Response.belongs_to_collection != null && Response.belongs_to_collection.id != null)
            {
                await ParseCollection(Response.belongs_to_collection.id.Value, Film);
            }
            return (Film, Celebrities, Credits);
        }

        public async Task ParseCollection(int TmdbId, Film Film)
        {
            int Attempt = 0;
            bool Success = false;
            TMDBCollectionResponse CollectionResponse = null!;
            while (Attempt < 3 && !Success)
            {
                Attempt++;
                try
                {
                    CollectionResponse = await _tmdbClient.CollectionDetailsCall(TmdbId);
                    Success = true;
                }
                catch
                {
                    await Task.Delay(1000 * Attempt);
                    continue;
                }
            }
            if (CollectionResponse == null || CollectionResponse.parts == null) return;

            foreach (var Part in CollectionResponse.parts.Where(p => p.id != null && !string.IsNullOrEmpty(p.release_date)).OrderBy(p => p.release_date))
            {
                Film.Collection[Part.id!.Value] = FormUrls(Part.poster_path);
            }
        }

        public async Task<(Film Film, List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseFilm(TMDBInfoResponse Response, ConcurrentDictionary<int, byte> ThreadsafeCelebs)
        {
            int TmdbId = Response.id ?? throw new Exception("TMDB response missing ID");
            string Title = Response.title ?? Response.original_title!;
            string? OriginalTitle = Title == Response.original_title ? null : Response.original_title;
            string Tagline = Response.tagline ?? "";
            string Synopsis = Response.overview ?? "[no overview available for this feature]";
            string PosterUrl = FormUrls(Response.poster_path);
            string? BackdropUrl = FormUrls(Response.backdrop_path);
            int Length = Response.runtime ?? 0;
            DateTime ReleaseDate = DateTime.TryParse(Response.release_date, out DateTime ParsedDate)
                ? DateTime.SpecifyKind(ParsedDate, DateTimeKind.Utc)
                : DateTime.SpecifyKind(DateTime.MinValue.AddYears(1898), DateTimeKind.Utc);

            var Film = new Film(TmdbId, Title, OriginalTitle, Tagline, Synopsis, PosterUrl, BackdropUrl, Length, ReleaseDate);
            foreach (var Genre in Response.genres ?? new List<Genre>())
            {
                Film.Genres.Add(Genre.name!);
            }
            foreach (var pc in Response.production_countries ?? new List<ProductionCountry>())
            {
                var ParsedCode = "";
                switch (pc.iso_3166_1)
                {
                    case null:
                        ParsedCode = "XX";
                        break;
                    case "XK":
                    case "YU":
                    case "CS":
                        ParsedCode = "RS";
                        break;
                    case "AN":
                        ParsedCode = "NL";
                        break;
                    case "BU":
                        ParsedCode = "MM";
                        break;
                    case "SU":
                        ParsedCode = "RU";
                        break;
                    case "TP":
                        ParsedCode = "TL";
                        break;
                    case "XC":
                        ParsedCode = "CZ";
                        break;
                    case "XG":
                        ParsedCode = "DE";
                        break;
                    case "XI":
                        ParsedCode = "IE";
                        break;
                    case "ZR":
                        ParsedCode = "CD";
                        break;
                    default:
                        ParsedCode = pc.iso_3166_1;
                        break;
                }
                Film.Country.Add(ParsedCode);
            }

            var (Celebrities, Credits) = await ParseCredits(Response.credits, Film.Id, ThreadsafeCelebs);
            return (Film, Celebrities, Credits);
        }

        public async Task<(List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseCredits(Credits? Credits, int FilmId, ConcurrentDictionary<int, byte> ThreadsafeCelebs)
        {
            if (Credits == null) return (new(), new());

            var NewCelebrities = new ConcurrentDictionary<int, Celebrity>();
            var CelebrityCredits = new ConcurrentBag<CelebrityCredit>();

            async Task ProcessMember(int Id, Func<CelebrityCredit> CreditFactory)
            {
                if (ThreadsafeCelebs.ContainsKey(Id))
                {
                    CelebrityCredits.Add(CreditFactory());
                    return;
                }
                var Response = await FetchCelebrityWithRetry(Id);
                if (Response == null) return;
                var Celeb = ParseCelebrity(Response);
                if (ThreadsafeCelebs.TryAdd(Celeb.Id, 0)) NewCelebrities.TryAdd(Celeb.Id, Celeb);
                CelebrityCredits.Add(CreditFactory());
            }

            var Tasks = new List<Task>();

            foreach (var Actor in Credits.cast ?? [])
            {
                if (Actor?.id == null) continue;
                var a = Actor;
                Tasks.Add(ProcessMember(a.id.Value, () => new CelebrityCredit(a.id.Value, FilmId, Role.Actor, a.character ?? "N/A", a.order ?? 50)));
            }

            foreach (var Crewer in Credits.crew ?? [])
            {
                if (Crewer?.id == null) continue;
                var cr = Crewer;
                var Job = MapCrewRole(cr.job);
                if (Job == null) continue;
                Tasks.Add(ProcessMember(cr.id.Value, () => new CelebrityCredit(cr.id.Value, FilmId, Job.Value, null, null)));
            }

            await Task.WhenAll(Tasks);
            return (NewCelebrities.Values.ToList(), CelebrityCredits.ToList());
        }

        public Celebrity ParseCelebrity(TMDBCelebrityResponse CelebrityResponse)
        {
            int TmdbId = CelebrityResponse.id ?? throw new Exception("TMDB celebrity response missing ID");
            string Name = CelebrityResponse.name ?? "N/A";
            string? Description = CelebrityResponse.biography;
            string? PictureUrl = FormUrls(CelebrityResponse.profile_path);

            var Celebrity = new Celebrity(TmdbId, Name, Description, PictureUrl);

            return Celebrity;
        }

        private string FormUrls(string? Path)
        {
            if (string.IsNullOrEmpty(Path))
                return "";

            return $"{_configuration["TMDB:ImageUrl"]!}{Path}";
        }

        private async Task<TMDBCelebrityResponse?> FetchCelebrityWithRetry(int id)
        {
            for (int Attempt = 1; Attempt <= 3; Attempt++)
            {
                try { return await _tmdbClient.CelebrityDetailsCall(id); }
                catch { await Task.Delay(1000 * Attempt); }
            }
            return null;
        }

        private Role? MapCrewRole(string? Job) => Job?.ToLower() switch
        {
            "director" => Role.Director,
            "producer" => Role.Producer,
            "screenplay" or "writer" or "story" => Role.Writer,
            "original music composer" => Role.Composer,
            _ => null
        };
    }
}
