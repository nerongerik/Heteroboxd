using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Service
{
    public interface  IFilmService
    {
        Task<List<FilmInfoResponse>> GetAllFilms();
        Task<FilmInfoResponse?> GetFilm(string FilmId);
        Task<List<FilmInfoResponse>> GetFilmsByYear(int Year);
        Task<List<FilmInfoResponse>> GetFilmsByCelebrity(string CelebrityId);
        Task<PagedFilmInfoResponse> GetUsersWatchedFilms(string UserId, int Page, int PageSize);
        Task<List<FilmInfoResponse>> SearchFilms(FilmSearchRequest Search);
        //Task UpdateFilm(UpdateFilmRequest FilmRequest);
        Task UpdateFilmFavoriteCountEfCore7Async(string FilmId, string FavoriteChange);
        Task LogicalDeleteFilm(string FilmId);
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

        public async Task<FilmInfoResponse?> GetFilm(string FilmId)
        {
            var Film = await _repo.GetByIdAsync(Guid.Parse(FilmId));
            return Film == null ? null : new FilmInfoResponse(Film);
        }

        public async Task<List<FilmInfoResponse>> GetFilmsByYear(int Year)
        {
            var YearsFilms = await _repo.GetByYearAsync(Year);
            return YearsFilms.Select(f => new FilmInfoResponse(f, false)).ToList();
        }

        public async Task<List<FilmInfoResponse>> GetFilmsByCelebrity(string CelebrityId)
        {
            var CelebritiesFilms = await _repo.GetByCelebrityAsync(Guid.Parse(CelebrityId));
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

        /*public async Task UpdateFilm(UpdateFilmRequest FilmRequest)
        {
            var Film = await _repo.GetByIdAsync(Guid.Parse(FilmRequest.FilmId));
            if (Film == null) throw new KeyNotFoundException();
            if (FilmRequest.Title != null)
            {
                Film.Title = FilmRequest.Title;
                Film.TitleLocked = true;
            }
            if (FilmRequest.Synopsis != null)
            {
                Film.Synopsis = FilmRequest.Synopsis;
                Film.SynopsisLocked = true;
            }
            if (FilmRequest.PosterUrl != null)
            {
                Film.PosterUrl = FilmRequest.PosterUrl;
                Film.PosterUrlLocked = true;
            }
            if (FilmRequest.BackdropUrl != null)
            {
                Film.BackdropUrl = FilmRequest.BackdropUrl;
                Film.BackdropUrlLocked = true;
            }
            _repo.Update(Film);
            await _repo.SaveChangesAsync();
        }*/

        public async Task LogicalDeleteFilm(string FilmId)
        {
            var Film = await _repo.GetByIdAsync(Guid.Parse(FilmId));
            if (Film == null) throw new KeyNotFoundException();
            Film.Deleted = true;
            _repo.Update(Film);
            await _repo.SaveChangesAsync();
        }

        public async Task UpdateFilmFavoriteCountEfCore7Async(string FilmId, string FavoriteChange)
        {
            if (!Guid.TryParse(FilmId, out var Id)) throw new ArgumentException();
            if (!int.TryParse(FavoriteChange, out var Delta)) throw new ArgumentException();
            await _repo.UpdateFilmFavoriteCountEfCore7Async(Id, Delta);
        }
    }
}
