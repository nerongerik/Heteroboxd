using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface  IFilmService
    {
        Task<FilmInfoResponse?> GetFilm(int FilmId);
        Task<List<TrendingInfoResponse>> GetTrending(string? LastSync);
        Task<PagedResponse<FilmInfoResponse>> GetFilms(string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<PagedResponse<FilmInfoResponse>> GetUsersWatchedFilms(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<Dictionary<double, int>> GetFilmRatings(int FilmId);
        Task<PagedResponse<FilmInfoResponse>> SearchFilms(string Search, int Page, int PageSize);
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

        public async Task<List<TrendingInfoResponse>> GetTrending(string? LastSync)
        {
            var Trending = await _repo.GetTrendingAsync();
            if (!Trending.Any()) return new List<TrendingInfoResponse>();

            if (LastSync != null)
            {
                if (!DateTime.TryParse(LastSync, out DateTime LastSyncDate)) throw new ArgumentException();
                if (Trending.Max(c => c.LastSync) <= LastSyncDate) throw new ArgumentException();
            }

            return Trending
                .Select(t => new TrendingInfoResponse { FilmId = t.FilmId, Title = t.Title, FilmPosterUrl = t.PosterUrl, Rank = t.Rank, LastSync = t.LastSync.ToString("dd/MM/yyyy HH:mm") })
                .ToList();
        }

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

        public async Task<PagedResponse<FilmInfoResponse>> GetFilms(string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null)
            {
                var (Films, TotalCount, _, _) = await _repo.GetFilmsAsync(null, Page, PageSize, Filter, Sort, Desc, FilterValue);
                return new PagedResponse<FilmInfoResponse>
                {
                    TotalCount = TotalCount,
                    Page = Page,
                    PageSize = PageSize,
                    Items = Films.Select(f => new FilmInfoResponse(f)).ToList()
                };
            }
            else
            {
                var (Films, TotalCount, Seen, SeenCount) = await _repo.GetFilmsAsync(Guid.Parse(UserId), Page, PageSize, Filter, Sort, Desc, FilterValue);
                return new PagedResponse<FilmInfoResponse>
                {
                    TotalCount = TotalCount,
                    Page = Page,
                    PageSize = PageSize,
                    Items = Films.Select(f => new FilmInfoResponse(f)).ToList(),
                    Seen = Seen!.Select(uwf => uwf.FilmId).ToList(),
                    SeenCount = SeenCount!.Value
                };
            }
        }

        public async Task<PagedResponse<FilmInfoResponse>> GetUsersWatchedFilms(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (!Guid.TryParse(UserId, out var Id))
            {
                _logger.LogError($"GUID failed to parse {UserId}; malformed.");
                throw new ArgumentException();
            }

            var (Films, TotalCount) = await _repo.GetByUserAsync(Id, Page, PageSize, Filter, Sort, Desc, FilterValue);
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

        public async Task<PagedResponse<FilmInfoResponse>> SearchFilms(string Search, int Page, int PageSize)
        {
            var (Results, TotalCount) = await _repo.SearchAsync(Search.ToLower(), Page, PageSize);
            return new PagedResponse<FilmInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = Results.Select(f => new FilmInfoResponse(f, true)).ToList()
            };
        }
    }
}
