using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface  IFilmService
    {
        Task<FilmInfoResponse?> GetFilm(int FilmId);
        Task<FilmInfoResponse?> GetFilmBySlug(string Slug, int? FilmId);
        Task<PagedFilmInfoResponse> GetFilmsByYear(int Year, int Page, int PageSize);
        Task<PagedFilmInfoResponse> GetFilmsByGenre(string Genre, int Page, int PageSize);
        Task<PagedFilmInfoResponse> GetFilmsByCelebrity(int CelebrityId, int Page, int PageSize);
        Task<PagedFilmInfoResponse> GetUsersWatchedFilms(string UserId, int Page, int PageSize);
        Task<List<FilmInfoResponse>> SearchFilms(string Search);
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

        public async Task<FilmInfoResponse?> GetFilmBySlug(string Slug, int? FilmId)
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
                if (FilmId != null)
                {
                    return new FilmInfoResponse(Films.FirstOrDefault(f => f.Id == FilmId)!, true, true);
                }
                return new FilmInfoResponse(Films.OrderBy(f => f.FavoriteCount).First(), true, true);
            }
            else
            {
                return new FilmInfoResponse(Films[0], true, true);
            }
        }

        public async Task<PagedFilmInfoResponse> GetFilmsByYear(int Year, int Page, int PageSize)
        {
            var (Films, TotalCount) = await _repo.GetByYearAsync(Year, Page, PageSize);

            return new PagedFilmInfoResponse
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Films = Films.Select(f => new FilmInfoResponse(f, false, false)).ToList()
            };
        }

        public async Task<PagedFilmInfoResponse> GetFilmsByGenre(string Genre, int Page, int PageSize)
        {
            var (Films, TotalCount) = await _repo.GetByGenreAsync(Genre, Page, PageSize);

            return new PagedFilmInfoResponse
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Films = Films.Select(f => new FilmInfoResponse(f, false, false)).ToList()
            };
        }

        public async Task<PagedFilmInfoResponse> GetFilmsByCelebrity(int CelebrityId, int Page, int PageSize)
        {
            var (Films, TotalCount) = await _repo.GetByCelebrityAsync(CelebrityId, Page, PageSize);

            return new PagedFilmInfoResponse
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Films = Films.Select(f => new FilmInfoResponse(f, false, false)).ToList()
            };
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
                Films = Films.Select(f => new FilmInfoResponse(f, false, false)).ToList()
            };
        }

        public async Task<List<FilmInfoResponse>> SearchFilms(string Search)
        {
            var SearchResults = await _repo.SearchAsync(Search.ToLower());
            return SearchResults.Select(f => new FilmInfoResponse(f, true, true)).ToList();
        }

        public async Task UpdateFilmFavoriteCountEfCore7Async(int FilmId, string FavoriteChange)
        {
            if (!int.TryParse(FavoriteChange, out var Delta)) throw new ArgumentException();
            await _repo.UpdateFilmFavoriteCountEfCore7Async(FilmId, Delta);
        }
    }
}
