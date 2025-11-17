using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface  IFilmService
    {
        Task<List<FilmInfoResponse>> GetAllFilms();
        Task<FilmInfoResponse?> GetFilm(int FilmId);
        Task<FilmInfoResponse?> GetFilmBySlug(string Slug);
        Task<List<FilmInfoResponse>> GetFilmsByYear(int Year);
        Task<List<FilmInfoResponse>> GetFilmsByCelebrity(int CelebrityId);
        Task<PagedFilmInfoResponse> GetUsersWatchedFilms(string UserId, int Page, int PageSize);
        Task<List<FilmInfoResponse>> SearchFilms(FilmSearchRequest Search);
        Task UpdateFilmFavoriteCountEfCore7Async(int FilmId, string FavoriteChange);
    }

    public class FilmService : IFilmService
    {
        private readonly IFilmRepository _repo;
        private readonly ILogger<FilmService> _logger;

        public FilmService(IFilmRepository repo, ILogger<FilmService> logger)
        {
            _repo = repo;
            _logger = logger;
        }

        public async Task<List<FilmInfoResponse>> GetAllFilms()
        {
            var AllFilms = await _repo.GetAllAsync();
            return AllFilms.Select(f => new FilmInfoResponse(f, false)).ToList();
        }

        public Task<List<FilmInfoResponse>> GetTrendingFilms()
        {
            throw new NotImplementedException();
        }

        public async Task<FilmInfoResponse?> GetFilm(int FilmId)
        {
            var Film = await _repo.GetByIdAsync(FilmId);
            if (Film == null)
            {
                _logger.LogError($"Found no film with TmdbID: {FilmId}");
                throw new KeyNotFoundException();
            }
            return new FilmInfoResponse(Film, true, true);
        }

        public async Task<FilmInfoResponse?> GetFilmBySlug(string Slug)
        {
            var Films = await _repo.GetBySlugAsync(Slug);
            if (Films.Count == 0)
            {
                _logger.LogError($"Found no film with Slug: {Slug}");
                throw new KeyNotFoundException();
            }
            else if (Films.Count > 1)
            {
                _logger.LogWarning($"Conflicting slugs: multiple films with {Slug} exist in database!");
                return new FilmInfoResponse(Films.OrderBy(f => f.FavoriteCount).First(), true, true);
            }
            else
            {
                return new FilmInfoResponse(Films[0], true, true);
            }
        }

        public async Task<List<FilmInfoResponse>> GetFilmsByYear(int Year)
        {
            var YearsFilms = await _repo.GetByYearAsync(Year);
            return YearsFilms.Select(f => new FilmInfoResponse(f, false)).ToList();
        }

        public async Task<List<FilmInfoResponse>> GetFilmsByCelebrity(int CelebrityId)
        {
            var CelebritiesFilms = await _repo.GetByCelebrityAsync(CelebrityId);
            return CelebritiesFilms.Select(f => new FilmInfoResponse(f)).ToList();
        }

        public async Task<PagedFilmInfoResponse> GetUsersWatchedFilms(string UserId, int Page, int PageSize)
        {
            if (!Guid.TryParse(UserId, out var Id))
            {
                _logger.LogError($"GUID failed to parse {UserId}; malformed.");
                throw new ArgumentException();
            }

            var (Films, TotalCount) = await _repo.GetByUserAsync(Id, Page, PageSize);

            return new PagedFilmInfoResponse
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Films = Films.Select(f => new FilmInfoResponse(f, false)).ToList()
            };
        }

        public async Task<List<FilmInfoResponse>> SearchFilms(FilmSearchRequest Search)
        {
            var SearchResults = await _repo.SearchAsync(Search.Title, Search.OriginalTitle);
            return SearchResults.Select(f => new FilmInfoResponse(f, false)).ToList();
        }

        public async Task UpdateFilmFavoriteCountEfCore7Async(int FilmId, string FavoriteChange)
        {
            if (!int.TryParse(FavoriteChange, out var Delta)) throw new ArgumentException();
            await _repo.UpdateFilmFavoriteCountEfCore7Async(FilmId, Delta);
        }
    }
}
