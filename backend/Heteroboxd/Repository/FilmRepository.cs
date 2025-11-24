using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface IFilmRepository
    {
        Task<List<Film>> GetAllAsync(CancellationToken CancellationToken = default);
        Task<Film?> LightweightFetcher(int FilmId);
        Task<Film?> GetByIdAsync(int Id);
        Task<List<Film>> GetBySlugAsync(string Slug);
        Task<(List<Film> Films, int TotalCount)> GetByYearAsync(int Year, int Page, int PageSize);
        Task<(List<Film> Films, int TotalCount)> GetByGenreAsync(string Genre, int Page, int PageSize);
        Task<(List<Film> Films, int TotalCount)> GetByCelebrityAsync(int CelebrityId, int Page, int PageSize);
        Task<(List<Film> Films, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize);
        Task<List<Film>> SearchAsync(string? Title, string? OriginalTitle);
        Task UpdateFilmFavoriteCountEfCore7Async(int FilmId, int Delta);
    }
    public class FilmRepository : IFilmRepository
    {
        public readonly HeteroboxdContext _context;

        public FilmRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<List<Film>> GetAllAsync(CancellationToken CancellationToken = default) =>
            await _context.Films
            .Where(f => !f.Deleted)
            .ToListAsync(CancellationToken);

        public async Task<Film?> LightweightFetcher(int FilmId) =>
            await _context.Films
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == FilmId && !f.Deleted);

        public async Task<Film?> GetByIdAsync(int Id) =>
            await _context.Films
                .AsSplitQuery()
                .Include(f => f.CastAndCrew)
                .Include(f => f.WatchedBy)
                .Include(f => f.Reviews)
                .FirstOrDefaultAsync(f => f.Id == Id && !f.Deleted);

        public async Task<List<Film>> GetBySlugAsync(string Slug) =>
            await _context.Films
                .AsSplitQuery()
                .Include(f => f.CastAndCrew)
                .Include(f => f.WatchedBy)
                .Include(f => f.Reviews)
                .Where(f => f.Slug == Slug && !f.Deleted)
                .ToListAsync();

        public async Task<(List<Film> Films, int TotalCount)> GetByYearAsync(int Year, int Page, int PageSize)
        {
            var YearQuery = _context.Films
                .Where(f => f.ReleaseYear == Year && !f.Deleted)
                .OrderByDescending(f => f.FavoriteCount);

            var TotalCount = await YearQuery.CountAsync();

            var Films = await YearQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            return (Films, TotalCount);
        }

        public async Task<(List<Film> Films, int TotalCount)> GetByGenreAsync(string Genre, int Page, int PageSize)
        {
            var GenreQuery = _context.Films
                .Where(f => f.Genres.Contains(Genre) && !f.Deleted)
                .OrderByDescending(f => f.FavoriteCount);

            var TotalCount = await GenreQuery.CountAsync();

            var Films = await GenreQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            return (Films, TotalCount);
        }

        public async Task<(List<Film> Films, int TotalCount)> GetByCelebrityAsync(int CelebrityId, int Page, int PageSize)
        {
            var CelebQuery = _context.Films
                .Include(f => f.CastAndCrew)
                .Where(f => f.CastAndCrew.Any(c => c.CelebrityId == CelebrityId) && !f.Deleted)
                .OrderByDescending(f => f.FavoriteCount);

            var TotalCount = await CelebQuery.CountAsync();

            var Films = await CelebQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            return (Films, TotalCount);
        }

        public async Task<(List<Film> Films, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize)
        {
            var UwQuery = _context.UserWatchedFilms
                .Where(uw => uw.UserId == UserId && uw.TimesWatched != 0)
                .OrderByDescending(uw => uw.DateWatched);

            var TotalCount = await UwQuery.CountAsync();

            var PagedFilmIds = await UwQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(uw => uw.FilmId)
                .ToListAsync();

            var Films = await _context.Films
                .Where(f => PagedFilmIds.Contains(f.Id) && !f.Deleted)
                .ToListAsync();

            var FilmsById = Films.ToDictionary(f => f.Id);
            var OrderedFilms = PagedFilmIds.Select(id => FilmsById[id]).ToList();

            return (OrderedFilms, TotalCount);

        }

        public async Task<List<Film>> SearchAsync(string? Title, string? OriginalTitle)
        {
            var query = _context.Films.AsQueryable();

            if (!string.IsNullOrEmpty(Title))
                query = query
                    .Where(f => EF.Functions.Like(f.Title, $"%{Title}%"));
            if (!string.IsNullOrEmpty(OriginalTitle))
                query = query
                    .Where(f => f.OriginalTitle != null && EF.Functions.Like(f.OriginalTitle, $"%{OriginalTitle}%"));

            return await query
                .Where(f => !f.Deleted)
                .ToListAsync();
        }

        public async Task UpdateFilmFavoriteCountEfCore7Async(int FilmId, int Delta) //increments/decrements favorite count
        {
            var Rows = await _context.Films
                .Where(f => f.Id == FilmId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    f => f.FavoriteCount,
                    f => f.FavoriteCount + Delta
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }
    }
}
