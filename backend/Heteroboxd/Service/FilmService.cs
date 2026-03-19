using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface IFilmService
    {
        Task<FilmInfoResponse?> GetFilm(int FilmId);
        Task<List<TrendingInfoResponse>> GetTrending(string? LastSync);
        Task<PagedResponse<FilmInfoResponse?>> GetFilms(string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<PagedResponse<FilmInfoResponse?>> ShuffleFilms(string? UserId, int PageSize); 
        Task<PagedResponse<FilmInfoResponse?>> GetFilmsByUser(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
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
            var Response = await _repo.GetByIdAsync(FilmId);
            if (Response == null) throw new KeyNotFoundException();
            return new FilmInfoResponse(Response.Item, Response.Joined);
        }

        public async Task<PagedResponse<FilmInfoResponse?>> GetFilms(string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null)
            {
                var (Films, TotalCount, _, _) = await _repo.GetAllAsync(null, Page, PageSize, Filter, Sort, Desc, FilterValue);
                return new PagedResponse<FilmInfoResponse?>
                {
                    TotalCount = TotalCount,
                    Page = Page,
                    PageSize = PageSize,
                    Items = PageUtils.AddPadding(Films.Select(f => (FilmInfoResponse?) new FilmInfoResponse(f)).ToList())
                };
            }
            else
            {
                var (Films, TotalCount, Seen, SeenCount) = await _repo.GetAllAsync(Guid.Parse(UserId), Page, PageSize, Filter, Sort, Desc, FilterValue);
                return new PagedResponse<FilmInfoResponse?>
                {
                    TotalCount = TotalCount,
                    Page = Page,
                    PageSize = PageSize,
                    Items = PageUtils.AddPadding(Films.Select(f => (FilmInfoResponse?) new FilmInfoResponse(f)).ToList()),
                    Seen = Seen!.Select(uwf => uwf.FilmId).ToList(),
                    SeenCount = SeenCount!.Value
                };
            }
        }

        public async Task<PagedResponse<FilmInfoResponse?>> ShuffleFilms(string? UserId, int PageSize)
        {
            if (UserId == null)
            {
                var (Films, _, _) = await _repo.ShuffleAsync(null, PageSize);
                return new PagedResponse<FilmInfoResponse?>
                {
                    TotalCount = 0, //no pagination
                    Page = 1,
                    PageSize = PageSize,
                    Items = PageUtils.AddPadding(Films.Select(f => (FilmInfoResponse?)new FilmInfoResponse(f)).ToList())
                };
            }
            else
            {
                var (Films, Seen, SeenCount) = await _repo.ShuffleAsync(Guid.Parse(UserId), PageSize);
                return new PagedResponse<FilmInfoResponse?>
                {
                    TotalCount = 0, //no pagination
                    Page = 1,
                    PageSize = PageSize,
                    Items = PageUtils.AddPadding(Films.Select(f => (FilmInfoResponse?)new FilmInfoResponse(f)).ToList()),
                    Seen = Seen!.Select(uwf => uwf.FilmId).ToList(),
                    SeenCount = SeenCount!.Value
                };
            }
        }

        public async Task<PagedResponse<FilmInfoResponse?>> GetFilmsByUser(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var (Films, TotalCount) = await _repo.GetByUserAsync(Guid.Parse(UserId), Page, PageSize, Filter, Sort, Desc, FilterValue);
            return new PagedResponse<FilmInfoResponse?>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = PageUtils.AddPadding(Films.Select(f => (FilmInfoResponse?) new FilmInfoResponse(f)).ToList())
            };
        }

        public async Task<Dictionary<double, int>> GetFilmRatings(int FilmId) => 
            await _repo.GetRatingsAsync(FilmId);

        public async Task<PagedResponse<FilmInfoResponse>> SearchFilms(string Search, int Page, int PageSize)
        {
            var (Response, TotalCount) = await _repo.SearchAsync(Search.ToLower(), Page, PageSize);
            return new PagedResponse<FilmInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = Response.Select(x => new FilmInfoResponse(x.Item, x.Joined)).ToList()
            };
        }
    }
}
