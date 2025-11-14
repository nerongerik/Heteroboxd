using Heteroboxd.Migrations;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Models.Enums;
using Heteroboxd.Repository;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Integrations
{
    public interface ITMDBHelper
    {
        Task ParseResponse(TMDBInfoResponse Response);
        Task ParseCollection(string CollectionUrl);
        Task<Film> ParseFilm(TMDBInfoResponse Response, bool OfCollection = false);
        Task<List<CelebrityCredit>> ParseCreditsResponse(Credits? Credits, Guid FilmId);
        Celebrity ParseCelebrity(TMDBCelebrityResponse CelebrityResponse);
        string FormUrls(string? Path, int Type = 0);
        string GenerateSlug(string Title, int ReleaseYear);
        Role? MapJobToRole(string? job);
        Task _celebrity_repository_save_changes_safe();
    }

    public class TMDBHelper : ITMDBHelper
    {
        private readonly ITMDBClient _tmdbClient;
        private readonly ILogger<TMDBHelper> _logger;
        private readonly IConfiguration _configuration;
        private readonly IFilmRepository _filmRepository;
        private readonly ICelebrityRepository _celebrityRepository;

        public TMDBHelper(ITMDBClient tmdbClient, ILogger<TMDBHelper> logger, IConfiguration configuration, IFilmRepository filmRepository, ICelebrityRepository celebrityRepository)
        {
            _tmdbClient = tmdbClient;
            _logger = logger;
            _configuration = configuration;
            _filmRepository = filmRepository;
            _celebrityRepository = celebrityRepository;
        }

        public async Task ParseResponse(TMDBInfoResponse Response)
        {
            if (Response.BelongsToCollection != null)
            {
                _logger.LogInformation($"Parsing collection of TmdbId: {Response.BelongsToCollection.Id}");
                /*
                instead of parsing the film from our response, we need to make another call to TMDB to get the full collection details;
                then, we FindByTmdbIdsAsync() in our DB and send additional calls to TMDB to get and parse films that aren't in there;
                finally, we need to create the Collection entry itself, linking to all the films we just processed as [Guid1, Guid2, ..., GuidN]
                */
                await ParseCollection(FormUrls(Response.BelongsToCollection.Id.ToString(), 1));
                _logger.LogInformation($"Parsed collection of TmdbId: {Response.BelongsToCollection.Id}");
            }
            else
            {
                _logger.LogInformation($"Parsing standalone film of TmdbId: {Response.Id}");
                var Film = await ParseFilm(Response);
                _logger.LogInformation($"Parsed film: {Film.Title} ({Film.ReleaseYear})");
            }
        }

        public async Task ParseCollection(string CollectionUrl)
        {
            throw new NotImplementedException();
        }

        public async Task<Film> ParseFilm(TMDBInfoResponse Response, bool OfCollection = false)
        {
            string Title = Response.Title ?? Response.OriginalTitle!;
            string? OriginalTitle = Response.Title == null ? null : Response.OriginalTitle;
            string Tagline = Response.Tagline ?? "";
            string Synopsis = Response.Overview ?? "[no overview available for this feature]";
            string? PosterUrl = FormUrls(Response.PosterPath);
            string? BackdropUrl = FormUrls(Response.BackdropPath);
            int Length = Response.Runtime ?? 0;
            int ReleaseYear = Response.ReleaseDate != null && Response.ReleaseDate.Length >= 4 ? int.Parse(Response.ReleaseDate.Substring(0, 4)) : 0;
            string Slug = GenerateSlug(Title, ReleaseYear);
            int TmdbId = Response.Id ?? throw new Exception("TMDB response missing ID");

            Film Film = new Film(Title, OriginalTitle, Tagline, Synopsis, PosterUrl, BackdropUrl, Length, ReleaseYear, Slug, TmdbId);

            //further processing to add genres, castAndCrew
            foreach (var Genre in Response.Genres ?? [])
            {
                Film.Genres.Add(Genre.Name!);
            }
            var ParsedCredits = await ParseCreditsResponse(Response.Credits, Film.Id);
            Film.CastAndCrew = ParsedCredits;

            if (!OfCollection)
            {
                _filmRepository.Create(Film);
                await _filmRepository.SaveChangesAsync();
            }
            //else, the collection parser will handle that
            return Film;
        }

        /*
        this function is primitive and depricated -> use the thread-safe, db-efficient version below

        public async Task<List<CelebrityCredit>> ParseCreditsResponse(Credits? Credits, Guid FilmId)
        {
            if (Credits == null) return new List<CelebrityCredit>();

            List<CelebrityCredit> CelebrityCredits = new List<CelebrityCredit>();

            //actors
            var ExistingActors = await _celebrityRepository.GetByTmdbIdsAsync((Credits.Cast ?? []).Select(c => c.Id).ToList());
            foreach (CastMember Actor in Credits.Cast ?? [])
            {
                if (Actor == null || Actor.Id == null) continue;
                if (ExistingActors.Any(e => e.TmdbId == Actor.Id))
                {
                    Guid CelebrityId = ExistingActors.First(e => e.TmdbId == Actor.Id).Id;
                    string Character = Actor.Character ?? "Unnamed Role";
                    CelebrityCredit Credit = new CelebrityCredit(CelebrityId, FilmId, Role.Actor, Character);

                    var Celebrity = await _celebrityRepository.GetById(CelebrityId);
                    Celebrity!.Credits.Add(Credit);
                    _celebrityRepository.Update(Celebrity);
                    await _celebrityRepository.SaveChangesAsync();

                    CelebrityCredits.Add(Credit);
                }
                else
                {
                    var Response = await _tmdbClient.CelebrityDetailsCall(Actor.Id);
                    Celebrity ParsedResponse = ParseCelebrity(Response);

                    string Character = Actor.Character ?? "Unnamed Role";
                    CelebrityCredit Credit = new CelebrityCredit(ParsedResponse.Id, FilmId, Role.Actor, Character);

                    ParsedResponse.Credits.Add(Credit);

                    _celebrityRepository.Create(ParsedResponse);
                    await _celebrityRepository.SaveChangesAsync();

                    CelebrityCredits.Add(Credit);
                }
            }

            //crew
            var ExistingCrew = await _celebrityRepository.GetByTmdbIdsAsync((Credits.Crew ?? []).Select(c => c.Id).ToList());
            foreach (CrewMember Crewer in Credits.Crew ?? [])
            {
                if (Crewer == null || Crewer.Id == null) continue;
                Role CrewRole;
                switch (Crewer.Job?.ToLower())
                {
                    case "director":
                        CrewRole = Role.Director;
                        break;
                    case "producer":
                        CrewRole = Role.Producer;
                        break;
                    case "screenplay":
                    case "writer":
                    case "story":
                        CrewRole = Role.Writer;
                        break;
                    case "original music composer":
                        CrewRole = Role.Composer;
                        break;
                    default:
                        continue;
                }

                if (ExistingCrew.Any(e => e.TmdbId == Crewer.Id))
                {
                    Guid CelebrityId = ExistingCrew.First(e => e.TmdbId == Crewer.Id).Id;
                    CelebrityCredit Credit = new CelebrityCredit(CelebrityId, FilmId, CrewRole, null);

                    var Celebrity = await _celebrityRepository.GetById(CelebrityId);
                    Celebrity!.Credits.Add(Credit);
                    _celebrityRepository.Update(Celebrity);
                    await _celebrityRepository.SaveChangesAsync();

                    CelebrityCredits.Add(Credit);
                }
                else
                {
                    var Response = await _tmdbClient.CelebrityDetailsCall(Crewer.Id);
                    Celebrity ParsedResponse = ParseCelebrity(Response);
                    CelebrityCredit Credit = new CelebrityCredit(ParsedResponse.Id, FilmId, CrewRole, null);

                    ParsedResponse.Credits.Add(Credit);

                    _celebrityRepository.Create(ParsedResponse);
                    await _celebrityRepository.SaveChangesAsync();

                    CelebrityCredits.Add(Credit);
                }
            }

            return CelebrityCredits;
        }
        */

        public async Task<List<CelebrityCredit>> ParseCreditsResponse(Credits? Credits, Guid FilmId)
        {
            if (Credits == null) return new List<CelebrityCredit>();

            //1) Gather TMDB ids
            var CastIds = (Credits.Cast ?? Enumerable.Empty<CastMember>())
                          .Where(c => c?.Id != null)
                          .Select(c => c!.Id!.Value)
                          .Distinct()
                          .ToList();

            //only keep crew that maps to our enum
            var CrewFiltered = (Credits.Crew ?? Enumerable.Empty<CrewMember>())
                               .Where(c => c?.Id != null && MapJobToRole(c!.Job) != null)
                               .ToList();

            var CrewIds = CrewFiltered.Select(c => c!.Id!.Value).Distinct().ToList();

            var AllNeededIds = CastIds.Concat(CrewIds).Distinct().ToList();
            if (!AllNeededIds.Any()) return new List<CelebrityCredit>();

            //2) Find existing celebrities in DB in batch
            var ExistingCelebrities = (await _celebrityRepository.GetByTmdbIdsAsync(AllNeededIds))
                                      .ToDictionary(c => c.TmdbId, c => c);

            // --- 3) Determine which TMDB ids are missing and fetch details in parallel (bounded) ---
            var MissingIds = AllNeededIds.Except(ExistingCelebrities.Keys).ToList();
            var NewlyCreatedCelebrities = new List<Celebrity>();

            if (MissingIds.Any())
            {
                // Bound concurrency to avoid saturating threadpool/HTTP connections and DB
                const int MaxConcurrency = 8;
                using var Sem = new SemaphoreSlim(MaxConcurrency);

                var FetchTasks = MissingIds.Select(async TmdbId =>
                {
                    await Sem.WaitAsync();
                    try
                    {
                        //celebrity details call
                        var CelebResponse = await _tmdbClient.CelebrityDetailsCall(TmdbId);

                        //parse into model
                        var CelebEntity = ParseCelebrity(CelebResponse);

                        //mark for insert
                        lock (NewlyCreatedCelebrities) //list shared over tasks
                        {
                            NewlyCreatedCelebrities.Add(CelebEntity);
                        }
                    }
                    finally
                    {
                        Sem.Release();
                    }
                }).ToList();

                await Task.WhenAll(FetchTasks);

                //save to repo in batch
                foreach (var NewCeleb in NewlyCreatedCelebrities)
                {
                    _celebrityRepository.Create(NewCeleb);
                }

                try
                {
                    await _celebrityRepository.SaveChangesAsync();
                    // after success, merge newly created into the existing dictionary
                    foreach (var New in NewlyCreatedCelebrities)
                    {
                        ExistingCelebrities[New.TmdbId] = New;
                    }
                }
                catch (DbUpdateException DbEx)
                {
                    //likely a race: another process inserted some celebrities with the same TmdbId.
                    //recover by re-querying the DB for those TMDB ids and merging, dropping duplicates.
                    _logger.LogWarning(DbEx, "DbUpdateException while inserting new celebrities. Attempting to resolve by requerying existing records.");

                    //re-fetch the set of AllNeededIds so we have authoritative IDs
                    var Reloaded = await _celebrityRepository.GetByTmdbIdsAsync(AllNeededIds);
                    ExistingCelebrities = Reloaded.ToDictionary(c => c.TmdbId, c => c);
                }
            }

            //4) Build CelebrityCredit objects for cast and crew using authoritative mapping
            var ResultCredits = new List<CelebrityCredit>();

            //handle cast => Role.Actor
            foreach (var CastMember in Credits.Cast ?? Enumerable.Empty<CastMember>())
            {
                if (CastMember == null || CastMember.Id == null) continue;
                var TmdbId = CastMember.Id.Value;
                if (!ExistingCelebrities.TryGetValue(TmdbId, out var Celeb)) continue; //defensive

                var Character = string.IsNullOrWhiteSpace(CastMember.Character) ? "Unnamed Role" : CastMember.Character!;
                var Credit = new CelebrityCredit(Celeb.Id, FilmId, Role.Actor, Character);
                ResultCredits.Add(Credit);
                Celeb.Credits.Add(Credit);
            }

            //handle crew (only mapped roles)
            foreach (var CrewMember in CrewFiltered)
            {
                if (CrewMember == null || CrewMember.Id == null) continue;
                var TmdbId = CrewMember.Id.Value;
                if (!ExistingCelebrities.TryGetValue(TmdbId, out var Celeb)) continue;

                var MappedRole = MapJobToRole(CrewMember.Job)!.Value;
                var Credit = new CelebrityCredit(Celeb.Id, FilmId, MappedRole, null);
                ResultCredits.Add(Credit);

                if (Celeb.Credits == null) Celeb.Credits = new List<CelebrityCredit>();
                Celeb.Credits.Add(Credit);
            }

            //5) Persist any changes to celebrities (we added Credit objects into navigation collections)
            try
            {
                await _celebrity_repository_save_changes_safe();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Unable to save celebrity-credit navigation changes after parsing credits. Credits will still be returned for Film.");
            }

            return ResultCredits;
        }


        public Celebrity ParseCelebrity(TMDBCelebrityResponse CelebrityResponse)
        {
            string Name = CelebrityResponse.Name ?? "NOMEN NESCIO";
            string? Description = CelebrityResponse.Biography;
            string? PictureUrl = FormUrls(CelebrityResponse.ProfilePath);
            int TmdbId = CelebrityResponse.Id ?? throw new Exception("TMDB celebrity response missing ID");
            _logger.LogInformation($"Parsing celebrity: {CelebrityResponse.Name}");
            Celebrity Celebrity = new Celebrity(Name, Description, PictureUrl, TmdbId);

            return Celebrity;
        }

        public string FormUrls(string? Path, int Type = 0)
        {
            if (string.IsNullOrEmpty(Path))
                return string.Empty;

            string BaseUrl = _configuration["TMDB:BaseUrl"] ?? "https://api.themoviedb.org/3";
            string ImageUrl = _configuration["TMDB:ImageUrl"] ?? "https://image.tmdb.org/t/p/original";

            return Type switch
            {
                0 => $"{ImageUrl}/{Path}",                     // image (poster/backdrop)
                1 => $"{BaseUrl}/collection/{Path}",          // collection endpoint
                2 => $"{BaseUrl}/person/{Path}",              // celebrity endpoint
                _ => Path
            };
        }

        public string GenerateSlug(string Title, int ReleaseYear)
        {
            _logger.LogInformation($"Generating slug for: {Title} ({ReleaseYear})");
            return $"{Title.ToLower().Replace(' ', '-').Replace("'", "").Replace("\"", "")}-{ReleaseYear}";
        }

        public Role? MapJobToRole(string? job)
        {
            if (string.IsNullOrWhiteSpace(job)) return null;
            var j = job!.ToLowerInvariant();

            if (j.Contains("director")) return Role.Director;
            if (j.Contains("producer")) return Role.Producer;
            if (j.Contains("screenplay") || j.Contains("writer") || j.Contains("story")) return Role.Writer;
            if (j.Contains("composer") || j.Contains("music")) return Role.Composer;

            return null;
        }

        public async Task _celebrity_repository_save_changes_safe()
        {
            try
            {
                await _celebrityRepository.SaveChangesAsync();
            }
            catch (DbUpdateException dbEx)
            {
                // Handle unique constraint races gracefully - re-query authoritative state
                _logger.LogWarning(dbEx, "DbUpdateException while saving celebrity navigation changes.");
                // Optional: re-load affected celebrities to sync in-memory graph if needed.
            }
        }
    }
}
