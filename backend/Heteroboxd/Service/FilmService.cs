using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface  IFilmService
    {
        Task<FilmInfoResponse?> GetFilm(int FilmId);
        Task<List<Trending>> GetTrending();
        Task<PagedResponse<FilmInfoResponse>> ExploreFilms(int Page, int PageSize);
        Task<PagedResponse<FilmInfoResponse>> PopularFilms(int Page, int PageSize);
        Task<PagedResponse<FilmInfoResponse>> GetFilmsByYear(int Year, int Page, int PageSize);
        Task<PagedResponse<FilmInfoResponse>> GetFilmsByGenre(string Genre, int Page, int PageSize);
        Task<PagedResponse<FilmInfoResponse>> GetUsersWatchedFilms(string UserId, int Page, int PageSize);
        Task<Dictionary<double, int>> GetFilmRatings(int FilmId);
        Task<List<FilmInfoResponse>> SearchFilms(string Search);
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

        public async Task<List<Trending>> GetTrending() =>
            await _repo.GetTrendingAsync();

        public async Task<FilmInfoResponse?> GetFilm(int FilmId)
        {
            var Film = await _repo.GetByIdAsync(FilmId);
            if (Film == null)
            {
                _logger.LogError($"Found no film with TmdbID: {FilmId}");
                throw new KeyNotFoundException();
            }
            return new FilmInfoResponse(Film, true);
        }

        public async Task<PagedResponse<FilmInfoResponse>> ExploreFilms(int Page, int PageSize)
        {
            var (Films, TotalCount) = await _repo.ExploreAsync(Page, PageSize);
            return new PagedResponse<FilmInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = Films.Select(f => new FilmInfoResponse(f)).ToList()
            };
        }

        public async Task<PagedResponse<FilmInfoResponse>> PopularFilms(int Page, int PageSize)
        {
            var (Films, TotalCount) = await _repo.PopularAsync(Page, PageSize);
            return new PagedResponse<FilmInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = Films.Select(f => new FilmInfoResponse(f)).ToList()
            };
        }

        public async Task<PagedResponse<FilmInfoResponse>> GetFilmsByYear(int Year, int Page, int PageSize)
        {
            var (Films, TotalCount) = await _repo.GetByYearAsync(Year, Page, PageSize);

            return new PagedResponse<FilmInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = Films.Select(f => new FilmInfoResponse(f)).ToList()
            };
        }

        public async Task<PagedResponse<FilmInfoResponse>> GetFilmsByGenre(string Genre, int Page, int PageSize)
        {
            var (Films, TotalCount) = await _repo.GetByGenreAsync(Genre, Page, PageSize);

            return new PagedResponse<FilmInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = Films.Select(f => new FilmInfoResponse(f)).ToList()
            };
        }

        public async Task<PagedResponse<FilmInfoResponse>> GetUsersWatchedFilms(string UserId, int Page, int PageSize)
        {
            if (!Guid.TryParse(UserId, out var Id))
            {
                _logger.LogError($"GUID failed to parse {UserId}; malformed.");
                throw new ArgumentException();
            }

            var (Films, TotalCount) = await _repo.GetByUserAsync(Id, Page, PageSize);

            return new PagedResponse<FilmInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = Films.Select(f => new FilmInfoResponse(f)).ToList()
            };
        }

        public async Task<Dictionary<double, int>> GetFilmRatings(int FilmId)
        {
            var Ratings = await _repo.GetRatingsAsync(FilmId);
            return Ratings;
        }

        public async Task<List<FilmInfoResponse>> SearchFilms(string Search)
        {
            var SearchResults = await _repo.SearchAsync(Search.ToLower());
            return SearchResults.Select(f => new FilmInfoResponse(f, true)).ToList();
        }
    }
}
