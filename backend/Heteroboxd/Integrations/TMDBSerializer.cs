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
        Task<(Film Film, List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseResponseInMemory(TMDBInfoResponse Response, List<Celebrity> ExistingCelebs);
        Task ParseCollection(int TmdbId, Film Film);
        Task<Film> ParseFilm(TMDBInfoResponse Response);
        Task<(Film Film, List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseFilmInMemory(TMDBInfoResponse Response, List<Celebrity> ExistingCelebs);
        Task ParseCreditsResponse(Credits? Credits, int FilmId);
        Task<(List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseCreditsResponseInMemory(Credits? Credits, int FilmId, List<Celebrity> ExistingCelebs);
        Celebrity ParseCelebrity(TMDBCelebrityResponse CelebrityResponse);
        string FormUrls(string? Path);
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

        public async Task<(Film Film, List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseResponseInMemory(TMDBInfoResponse Response, List<Celebrity> ExistingCelebs)
        {
            if (Response.id == null) throw new ArgumentException("tMDB mustn't be null!");
            var (Film, Celebrities, Credits) = await ParseFilmInMemory(Response, ExistingCelebs);
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
            string Tagline = Response.tagline ?? "";
            string Synopsis = Response.overview ?? "[no overview available for this feature]";
            string? PosterUrl = FormUrls(Response.poster_path);
            string? BackdropUrl = FormUrls(Response.backdrop_path);
            int Length = Response.runtime ?? 0;
            int.TryParse((Response.release_date ?? "").AsSpan(0, Math.Min((Response.release_date ?? "").Length, 4)), out int ReleaseYear);
            int TmdbId = Response.id ?? throw new Exception("TMDB response missing ID");

            Film Film = new Film(TmdbId, Title, OriginalTitle, Tagline, Synopsis, PosterUrl, BackdropUrl, Length, ReleaseYear);
            foreach (var Genre in Response.genres ?? new List<Genre>())
            {
                Film.Genres.Add(Genre.name!);
            }
            foreach (ProductionCountry pc in Response.production_countries ?? new List<ProductionCountry>())
            {
                Film.Country.Add(pc.iso_3166_1 ?? "XX");
            }

            await ParseCreditsResponse(Response.credits, Film.Id);

            return Film;
        }

        public async Task<(Film Film, List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseFilmInMemory(TMDBInfoResponse Response, List<Celebrity> ExistingCelebs)
        {
            string Title = Response.title ?? Response.original_title!;
            string? OriginalTitle = Response.title == null ? null : Response.original_title;
            string Tagline = Response.tagline ?? "";
            string Synopsis = Response.overview ?? "[no overview available for this feature]";
            string? PosterUrl = FormUrls(Response.poster_path);
            string? BackdropUrl = FormUrls(Response.backdrop_path);
            int Length = Response.runtime ?? 0;
            int.TryParse((Response.release_date ?? "").AsSpan(0, Math.Min((Response.release_date ?? "").Length, 4)), out int ReleaseYear);
            int TmdbId = Response.id ?? throw new Exception("TMDB response missing ID");

            Film Film = new Film(TmdbId, Title, OriginalTitle, Tagline, Synopsis, PosterUrl, BackdropUrl, Length, ReleaseYear);
            foreach (var Genre in Response.genres ?? new List<Genre>())
            {
                Film.Genres.Add(Genre.name!);
            }
            foreach (ProductionCountry pc in Response.production_countries ?? new List<ProductionCountry>())
            {
                Film.Country.Add(pc.iso_3166_1 ?? "XX");
            }

            var (Celebrities, Credits) = await ParseCreditsResponseInMemory(Response.credits, Film.Id, ExistingCelebs);

            return (Film, Celebrities, Credits);
        }

        public async Task ParseCreditsResponse(Credits? Credits, int FilmId)
        {
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

                CelebrityCredit Credit = new CelebrityCredit(Celebrity.Id, Celebrity.Name, Celebrity.PictureUrl, FilmId, Role.Actor, Actor.character ?? "Unnamed Role", Actor.order ?? 50);
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
                CelebrityCredit Credit = new CelebrityCredit(Celebrity.Id, Celebrity.Name, Celebrity.PictureUrl, FilmId, CrewRole, null, null);
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

        public async Task<(List<Celebrity> Celebrities, List<CelebrityCredit> Credits)> ParseCreditsResponseInMemory(Credits? Credits, int FilmId, List<Celebrity> ExistingCelebs)
        {
            if (Credits == null) return (new List<Celebrity>(), new List<CelebrityCredit>());

            List<Celebrity> Celebrities = new List<Celebrity>();
            List<CelebrityCredit> CelebrityCredits = new List<CelebrityCredit>();
            var ExistingCelebsById = ExistingCelebs.ToDictionary(c => c.Id);
            var FetchedThisRun = new HashSet<int>();

            //cast
            foreach (CastMember Actor in Credits.cast ?? new List<CastMember>())
            {
                if (Actor?.id == null) continue;
                if (ExistingCelebsById.TryGetValue(Actor.id.Value, out Celebrity? AlreadyFetched))
                {
                    CelebrityCredits.Add(new CelebrityCredit(AlreadyFetched.Id, AlreadyFetched.Name, AlreadyFetched.PictureUrl, FilmId, Role.Actor, Actor.character ?? "Unnamed Role", Actor.order ?? 50));
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

                Celebrity Celebrity = ParseCelebrity(Response);
                CelebrityCredit Credit = new CelebrityCredit(Celebrity.Id, Celebrity.Name, Celebrity.PictureUrl, FilmId, Role.Actor, Actor.character ?? "Unnamed Role", Actor.order ?? 50);
                if (FetchedThisRun.Add(Celebrity.Id)) Celebrities.Add(Celebrity);
                CelebrityCredits.Add(Credit);
            }
            //crew
            foreach (CrewMember Crewer in Credits.crew ?? new List<CrewMember>())
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
                    CelebrityCredits.Add(new CelebrityCredit(AlreadyFetched.Id, AlreadyFetched.Name, AlreadyFetched.PictureUrl, FilmId, AdditionalRole, null, null));
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

                Celebrity Celebrity = ParseCelebrity(Response);
                CelebrityCredit Credit = new CelebrityCredit(Celebrity.Id, Celebrity.Name, Celebrity.PictureUrl, FilmId, CrewRole, null, null);
                if (FetchedThisRun.Add(Celebrity.Id)) Celebrities.Add(Celebrity);
                CelebrityCredits.Add(Credit);
            }
            return (Celebrities, CelebrityCredits);
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
