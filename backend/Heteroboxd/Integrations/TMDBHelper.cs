using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Integrations
{
    public interface ITMDBHelper
    {
        Task ParseResponse(TMDBInfoResponse Response);
        Task ParseCollection(string CollectionUrl);
        Task<Film> ParseFilm(TMDBInfoResponse Response, bool OfCollection = false);
        Task<List<CelebrityCredit>> ParseCreditsResponse(Credits? Credits, Guid FilmId);
        Task<Celebrity> ParseCelebrity(TMDBCelebrityResponse CelebrityResponse);
        string FormUrls(string? Path, int Type = 0);
        string GenerateSlug(string Title, int ReleaseYear);
    }

    public class TMDBHelper : ITMDBHelper
    {
        //private readonly ITMDBClient _tmdbClient;
        private readonly ILogger<TMDBHelper> _logger;
        private readonly IConfiguration _configuration;
        private readonly IFilmRepository _filmRepository;
        private readonly ICelebrityRepository _celebrityRepository;

        public TMDBHelper(/*ITMDBClient tmdbClient,*/ ILogger<TMDBHelper> logger, IConfiguration configuration, IFilmRepository filmRepository, ICelebrityRepository celebrityRepository)
        {
            //_tmdbClient = tmdbClient;
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

        public async Task<List<CelebrityCredit>> ParseCreditsResponse(Credits? Credits, Guid FilmId)
        {
            //for a LIMITED AMOUNT of cast and crew members (only those whose roles correspond to our Role enum),
            //send calls to TMDB to get details about each celebrity, ParseCelebrity() those,
            //and finally, form CelebrityCredit for each one. return the list of these objects.
            throw new NotImplementedException();
        }

        public async Task<Celebrity> ParseCelebrity(TMDBCelebrityResponse CelebrityResponse)
        {
            string Name = CelebrityResponse.Name ?? "NOMEN NESCIO";
            string? Description = CelebrityResponse.Biography;
            string? PictureUrl = FormUrls(CelebrityResponse.ProfilePath);

            _logger.LogInformation($"Parsing celebrity: {CelebrityResponse.Name}");
            Celebrity Celebrity = new Celebrity(Name, Description, PictureUrl);

            _celebrityRepository.Create(Celebrity);
            await _celebrityRepository.SaveChangesAsync();
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
                0 => $"{ImageUrl}{Path}",                     // image (poster/backdrop)
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
    }
}
