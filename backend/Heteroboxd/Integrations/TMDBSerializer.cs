using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Models.Enums;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Heteroboxd.Integrations
{
    public interface ITMDBSerializer
    {
        Task ParseResponse(TMDBInfoResponse Response);
        Task ParseCollection(int TmdbId, Film Film);
        Task<Film> ParseFilm(TMDBInfoResponse Response);
        Task ParseCreditsResponse(Credits? Credits, int FilmId);
        Celebrity ParseCelebrity(TMDBCelebrityResponse CelebrityResponse);
        string FormUrls(string? Path);
        string GenerateSlug(string Title, int ReleaseYear);
        Task Serialize<T>(T Object, string Path);
    }

    public class TMDBSerializer : ITMDBSerializer
    {
        private readonly ITMDBClient _tmdbClient;
        private readonly IConfiguration _configuration;

        public TMDBSerializer(ITMDBClient tmdbClient, IConfiguration configuration)
        {
            _tmdbClient = tmdbClient;
            _configuration = configuration;
        }

        public async Task ParseResponse(TMDBInfoResponse Response)
        {
            if (Response.id == null) throw new ArgumentException("tMDB mustn't be null!");
            Film Film = await ParseFilm(Response);
            if (Response.belongs_to_collection != null && Response.belongs_to_collection.id != null)
            {
                await ParseCollection(Response.belongs_to_collection.id.Value, Film);
            }

            try
            {
                await Serialize<Film>(Film, Path.Combine(_configuration["TMDB:FilmSerialPath"]!, $"{Film.Id}.json"));
            }
            catch
            {
                throw new IOException($"FAILED TO SERIALIZE {Film.Id}.json");
            }
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

            foreach (CollectionPart Part in CollectionResponse.parts
                                                              .Where(p => p.id != null && !string.IsNullOrEmpty(p.release_date))
                                                              .OrderBy(p => p.release_date))
            {
                Film.Collection[Part.id!.Value] = FormUrls(Part.poster_path);
            }
        }

        public async Task<Film> ParseFilm(TMDBInfoResponse Response)
        {
            string Title = Response.title ?? Response.original_title!;
            string? OriginalTitle = Response.title == null ? null : Response.original_title;
            string Country = Response.production_countries != null && Response.production_countries.Count > 0 ? Response.production_countries[0].name! : "UNKNOWN";
            string Tagline = Response.tagline ?? "";
            string Synopsis = Response.overview ?? "[no overview available for this feature]";
            string? PosterUrl = FormUrls(Response.poster_path);
            string? BackdropUrl = FormUrls(Response.backdrop_path);
            int Length = Response.runtime ?? 0;
            int.TryParse(Response.release_date?.Substring(0, 4), out int ReleaseYear);
            string Slug = GenerateSlug(Title, ReleaseYear);
            int TmdbId = Response.id ?? throw new Exception("TMDB response missing ID");

            Film Film = new Film(TmdbId, Title, OriginalTitle, Country, Tagline, Synopsis, PosterUrl, BackdropUrl, Length, ReleaseYear, Slug);
            foreach (var Genre in Response.genres ?? new List<Genre>())
            {
                Film.Genres.Add(Genre.name!);
            }

            await ParseCreditsResponse(Response.credits, Film.Id);

            return Film;
        }

        public async Task ParseCreditsResponse(Credits? Credits, int FilmId)
        {
            List<CelebrityCredit> CelebrityCredits = new List<CelebrityCredit>();

            if (Credits == null) return;

            //cast
            foreach (CastMember Actor in Credits.cast ?? new List<CastMember>())
            {
                if (Actor == null || Actor.id == null) continue;

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

                Celebrity Celebrity = ParseCelebrity(Response);
                try
                {
                    await Serialize<Celebrity>(Celebrity, Path.Combine(_configuration["TMDB:CelebSerialPath"]!, $"{Celebrity.Id}.json"));
                }
                catch
                {
                    throw new IOException($"FAILED TO SERIALIZE {Celebrity.Id}.json");
                }

                CelebrityCredit Credit = new CelebrityCredit(Celebrity.Id, Celebrity.Name, Celebrity.PictureUrl, FilmId, Role.Actor, Actor.character ?? "Unnamed Role");
                try
                {
                    await Serialize<CelebrityCredit>(Credit, Path.Combine(_configuration["TMDB:CreditSerialPath"]!, $"{Credit.Id}.json"));
                }
                catch
                {
                    throw new IOException($"FAILED TO SERIALIZE Credit for {Celebrity.Id} in Film {FilmId}");
                }
            }
            //crew
            foreach (CrewMember Crewer in Credits.crew ?? new List<CrewMember>())
            {
                if (Crewer?.id == null) continue;

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

                Celebrity Celebrity = ParseCelebrity(Response);
                try
                {
                    await Serialize<Celebrity>(Celebrity, Path.Combine(_configuration["TMDB:CelebSerialPath"]!, $"{Celebrity.Id}.json"));
                }
                catch
                {
                    throw new IOException($"FAILED TO SERIALIZE {Celebrity.Id}.json");
                }
                CelebrityCredit Credit = new CelebrityCredit(Celebrity.Id, Celebrity.Name, Celebrity.PictureUrl, FilmId, CrewRole, null);
                try
                {
                    await Serialize<CelebrityCredit>(Credit, Path.Combine(_configuration["TMDB:CreditSerialPath"]!, $"{Credit.Id}.json"));
                }
                catch
                {
                    throw new IOException($"FAILED TO SERIALIZE Credit for {Celebrity.Id} in Film {FilmId}");
                }
            }
        }

        public Celebrity ParseCelebrity(TMDBCelebrityResponse CelebrityResponse)
        {
            string Name = CelebrityResponse.name ?? "NOMEN NESCIO";
            string? Description = CelebrityResponse.biography;
            string? PictureUrl = FormUrls(CelebrityResponse.profile_path);
            int TmdbId = CelebrityResponse.id ?? throw new Exception("TMDB celebrity response missing ID");

            Celebrity Celebrity = new Celebrity(TmdbId, Name, Description, PictureUrl);

            return Celebrity;
        }

        public string FormUrls(string? Path)
        {
            if (string.IsNullOrEmpty(Path))
                return "";

            return $"{_configuration["TMDB:ImageUrl"]!}{Path}";
        }

        public string GenerateSlug(string Title, int ReleaseYear)
        {
            return $"{Title.ToLower().Replace(' ', '-').Replace("'", "").Replace("\"", "").Replace("/", "").Replace(":", "")}-{ReleaseYear}";
        }

        public async Task Serialize<T>(T Object, string Path)
        {
            var Options = new JsonSerializerOptions
            {
                WriteIndented = true,
                DefaultIgnoreCondition = JsonIgnoreCondition.Never,
            };
            string JsonString = JsonSerializer.Serialize(Object, Options);
            if (File.Exists(Path))
            {
                File.Delete(Path);
            }
            await File.WriteAllTextAsync(Path, JsonString);
        }
    }
}
