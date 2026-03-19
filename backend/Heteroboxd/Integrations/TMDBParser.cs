using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Models.Enums;
using System.Collections.Concurrent;

namespace Heteroboxd.Integrations
{
    public interface ITMDBParser
    {
        Task<(Film Film, List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseResponse(TMDBInfoResponse Response, List<Celebrity> ExistingCelebs, bool Parallel = false);
        Task ParseCollection(int TmdbId, Film Film);
        Task<(Film Film, List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseFilm(TMDBInfoResponse Response, List<Celebrity> ExistingCelebs, bool Parallel);
        Task<(List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseCreditsSequential(Credits? Credits, int FilmId, List<Celebrity> ExistingCelebs);
        Task<(List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseCreditsParallel(Credits? Credits, int FilmId, List<Celebrity> ExistingCelebs);
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

        public async Task<(Film Film, List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseResponse(TMDBInfoResponse Response, List<Celebrity> ExistingCelebs, bool Parallel = false)
        {
            if (Response.id == null) throw new ArgumentException("tMDB mustn't be null!");
            var (Film, Celebrities, Credits) = await ParseFilm(Response, ExistingCelebs, Parallel);
            if (Response.belongs_to_collection != null && Response.belongs_to_collection.id != null)
            {
                await ParseCollection(Response.belongs_to_collection.id.Value, Film);
            }
            return (Film, Celebrities, Credits);
        }

        public async Task ParseCollection(int TmdbId, Film Film)
        {
            //fetch from TMDB with 3 retries
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
                    await Task.Delay(1000 * Attempt); //exponential backoff to avoid rate limits
                    continue;
                }
            }
            if (CollectionResponse == null || CollectionResponse.parts == null) return;

            foreach (var Part in CollectionResponse.parts.Where(p => p.id != null && !string.IsNullOrEmpty(p.release_date)).OrderBy(p => p.release_date))
            {
                Film.Collection[Part.id!.Value] = FormUrls(Part.poster_path);
            }
        }

        public async Task<(Film Film, List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseFilm(TMDBInfoResponse Response, List<Celebrity> ExistingCelebs, bool Parallel)
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
                Film.Country.Add(pc.iso_3166_1 == null ? "XX" : pc.iso_3166_1 == "XK" ? "RS" : pc.iso_3166_1);
            }

            if (Parallel)
            {
                var (Celebrities, Credits) = await ParseCreditsParallel(Response.credits, Film.Id, ExistingCelebs);
                return (Film, Celebrities, Credits);
            }
            else
            {
                var (Celebrities, Credits) = await ParseCreditsSequential(Response.credits, Film.Id, ExistingCelebs);
                return (Film, Celebrities, Credits);
            }
        }

        public async Task<(List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseCreditsSequential(Credits? Credits, int FilmId, List<Celebrity> ExistingCelebs)
        {
            if (Credits == null) return (new (), new ());

            var Celebrities = new List<Celebrity>();
            var CelebrityCredits = new List<CelebrityCredit>();
            var ExistingCelebsById = ExistingCelebs.ToDictionary(c => c.Id);
            var FetchedThisRun = new HashSet<int>();

            //cast
            foreach (var Actor in Credits.cast ?? new List<CastMember>())
            {
                if (Actor?.id == null) continue;
                if (ExistingCelebsById.TryGetValue(Actor.id.Value, out Celebrity? AlreadyFetched))
                {
                    CelebrityCredits.Add(new CelebrityCredit(AlreadyFetched.Id, FilmId, Role.Actor, Actor.character ?? "N/A", Actor.order ?? 50));
                    continue;
                }
                //fetch from TMDB with 3 retries
                int Attempt = 0;
                bool Success = false;
                TMDBCelebrityResponse Response = null!;
                while (Attempt < 3 && !Success)
                {
                    Attempt++;
                    try
                    {
                        Response = await _tmdbClient.CelebrityDetailsCall(Actor.id);
                        Success = true;
                    }
                    catch
                    {
                        await Task.Delay(1000 * Attempt); //exponential backoff to avoid rate limits
                        continue;
                    }
                }
                if (Response == null) continue;

                var Celebrity = ParseCelebrity(Response);
                var Credit = new CelebrityCredit(Celebrity.Id, FilmId, Role.Actor, Actor.character ?? "N/A", Actor.order ?? 50);
                if (FetchedThisRun.Add(Celebrity.Id)) Celebrities.Add(Celebrity);
                CelebrityCredits.Add(Credit);
            }
            //crew
            foreach (var Crewer in Credits.crew ?? new List<CrewMember>())
            {
                if (Crewer?.id == null) continue;
                if (ExistingCelebsById.TryGetValue(Crewer.id.Value, out Celebrity? AlreadyFetched))
                {
                    Role AdditionalRole = Crewer.job?.ToLower() switch
                    {
                        "director" => Role.Director,
                        "producer" => Role.Producer,
                        "screenplay" => Role.Writer,
                        "writer" => Role.Writer,
                        "story" => Role.Writer,
                        "original music composer" => Role.Composer,
                        _ => throw new InvalidOperationException($"Unexpected job type: {Crewer.job}")
                    };
                    CelebrityCredits.Add(new CelebrityCredit(AlreadyFetched.Id, FilmId, AdditionalRole, null, null));
                    continue;
                }
                //fetch from TMDB with 3 retries
                int Attempt = 0;
                bool Success = false;
                TMDBCelebrityResponse Response = null!;
                while (Attempt < 3 && !Success)
                {
                    Attempt++;
                    try
                    {
                        Response = await _tmdbClient.CelebrityDetailsCall(Crewer.id);
                        Success = true;
                    }
                    catch
                    {
                        await Task.Delay(1000 * Attempt); //exponential backoff to avoid rate limits
                        continue;
                    }
                }
                if (Response == null) continue;

                Role CrewRole = Crewer.job?.ToLower() switch
                {
                    "director" => Role.Director,
                    "producer" => Role.Producer,
                    "screenplay" => Role.Writer,
                    "writer" => Role.Writer,
                    "story" => Role.Writer,
                    "original music composer" => Role.Composer,
                    _ => throw new InvalidOperationException($"Unexpected job type: {Crewer.job}")
                };

                var Celebrity = ParseCelebrity(Response);
                var Credit = new CelebrityCredit(Celebrity.Id, FilmId, CrewRole, null, null);
                if (FetchedThisRun.Add(Celebrity.Id)) Celebrities.Add(Celebrity);
                CelebrityCredits.Add(Credit);
            }
            CelebrityCredits = CelebrityCredits.GroupBy(c => (c.CelebrityId, c.FilmId, c.Role)).Select(g => g.First()).ToList(); //dedupe
            return (Celebrities, CelebrityCredits);
        }

        public async Task<(List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseCreditsParallel(Credits? Credits, int FilmId, List<Celebrity> ExistingCelebs)
        {
            if (Credits == null) return (new(), new());

            var ExistingCelebsById = ExistingCelebs.ToDictionary(c => c.Id);
            var FetchedThisRun = new ConcurrentDictionary<int, Celebrity>();
            var CelebrityCredits = new ConcurrentBag<CelebrityCredit>();

            async Task ProcessMember(int Id, Func<Celebrity, CelebrityCredit> CreditFactory)
            {
                if (ExistingCelebsById.TryGetValue(Id, out var Existing))
                {
                    CelebrityCredits.Add(CreditFactory(Existing));
                    return;
                }

                var Response = await FetchCelebrityWithRetry(Id);
                if (Response == null) return;
                var Celeb = ParseCelebrity(Response);
                FetchedThisRun.TryAdd(Celeb.Id, Celeb);
                CelebrityCredits.Add(CreditFactory(Celeb));
            }

            var Tasks = new List<Task>();

            foreach (var Actor in Credits.cast ?? [])
            {
                if (Actor?.id == null) continue;
                var a = Actor;
                Tasks.Add(ProcessMember(a.id.Value, celeb => new CelebrityCredit(celeb.Id, FilmId, Role.Actor, a.character ?? "N/A", a.order ?? 50)));
            }

            foreach (var Crewer in Credits.crew ?? [])
            {
                if (Crewer?.id == null) continue;
                var cr = Crewer;
                var Job = MapCrewRole(cr.job);
                if (Job == null) continue;
                Tasks.Add(ProcessMember(cr.id.Value, celeb => new CelebrityCredit(celeb.Id, FilmId, Job.Value, null, null)));
            }

            await Task.WhenAll(Tasks);
            return (FetchedThisRun.Values.ToList(), CelebrityCredits.ToList());
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
