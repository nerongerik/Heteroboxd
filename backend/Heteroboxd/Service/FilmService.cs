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
        Task<List<FilmInfoResponse>> GetUsersWatchedFilms(string UserId);
        Task<List<FilmInfoResponse>> SearchFilms(FilmSearchRequest Search);
        Task<FilmInfoResponse?> UpdateFilm(UpdateFilmRequest FilmRequest);
        Task UpdateFilmFavoriteCountEfCore7Async(string FilmId, string FavoriteChange);
        Task LogicalDeleteFilm(string FilmId);
    }

    public class FilmService : IFilmService
    {
        private readonly IFilmRepository _repo;

        public FilmService(IFilmRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<FilmInfoResponse>> GetAllFilms()
        {
            var AllFilms = await _repo.GetAllAsync();
            return AllFilms.Select(film => new FilmInfoResponse(film)).ToList();
        }

        public Task<List<FilmInfoResponse>> GetTrendingFilms()
        {
            //not only is this method unimplemented, but I am also not quite certain if it will ever be needed, or if the weekly tMDB trending call will send to frontend directly
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
            return YearsFilms.Select(film => new FilmInfoResponse(film)).ToList();
        }

        public async Task<List<FilmInfoResponse>> GetFilmsByCelebrity(string CelebrityId)
        {
            var CelebritiesFilms = await _repo.GetByCelebrityAsync(Guid.Parse(CelebrityId));
            return CelebritiesFilms.Select(film => new FilmInfoResponse(film)).ToList();
        }

        public async Task<List<FilmInfoResponse>> GetUsersWatchedFilms(string UserId)
        {
            var UsersFilms = await _repo.GetByUserAsync(Guid.Parse(UserId));
            return UsersFilms.Select(film => new FilmInfoResponse(film)).ToList();
        }

        public async Task<List<FilmInfoResponse>> SearchFilms(FilmSearchRequest Search)
        {
            var SearchResults = await _repo.SearchAsync(Search.Title, Search.OriginalTitle, Search.Director, Search.Cast);
            return SearchResults.Select(film => new FilmInfoResponse(film)).ToList();
        }

        public async Task<FilmInfoResponse?> UpdateFilm(UpdateFilmRequest FilmRequest)
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
            return new FilmInfoResponse(Film);
        }

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
            if (!Guid.TryParse(FilmId, out var Id)) throw new ArgumentException(nameof(FilmId));
            if (!int.TryParse(FavoriteChange, out var Delta)) throw new ArgumentException(nameof(FavoriteChange));
            await _repo.UpdateFilmFavoriteCountEfCore7Async(Id, Delta);
        }
    }
}
