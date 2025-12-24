using Heteroboxd.Data;
using Heteroboxd.Models;
using Heteroboxd.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface IFilmRepository
    {
        Task<Film?> LightweightFetcher(int FilmId);
        Task<Film?> GetByIdAsync(int Id);
        Task<List<Film>> GetByIdsAsync(IReadOnlyCollection<int> Ids);
        Task<(List<Film> Films, int TotalCount)> GetByYearAsync(int Year, int Page, int PageSize);
        Task<(List<Film> Films, int TotalCount)> GetByGenreAsync(string Genre, int Page, int PageSize);
        Task<(List<Film> Films, int TotalCount)> GetByCelebrityAsync(int CelebrityId, int Page, int PageSize);
        Task<(List<Film> Films, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize);
        Task<Dictionary<double, int>> GetRatingsAsync(int FilmId);
        Task<List<Film>> SearchAsync(string Title);
        Task UpdateFilmFavoriteCountEfCore7Async(int FilmId, int Delta);
    }

    public class FilmRepository : IFilmRepository
    {
        public readonly HeteroboxdContext _context;

        public FilmRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<Film?> LightweightFetcher(int FilmId) =>
            await _context.Films
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == FilmId);

        public async Task<Film?> GetByIdAsync(int Id) =>
            await _context.Films
                .AsSplitQuery()
                .Include(f => f.CastAndCrew)
                .Include(f => f.WatchedBy)
                .Include(f => f.Reviews)
                .FirstOrDefaultAsync(f => f.Id == Id);

        public async Task<List<Film>> GetByIdsAsync(IReadOnlyCollection<int> Ids)
        {
            if (Ids.Count == 0) return new();

            return await _context.Films
                .Where(f => Ids.Contains(f.Id))
                .ToListAsync();
        }

        public async Task<(List<Film> Films, int TotalCount)> GetByYearAsync(int Year, int Page, int PageSize)
        {
            var YearQuery = _context.Films
                .Where(f => f.ReleaseYear == Year)
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
                .Where(f => f.Genres.Contains(Genre))
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
                .Where(f => f.CastAndCrew.Any(c => c.CelebrityId == CelebrityId))
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
                .Where(uw => uw.UserId == UserId)
                .OrderByDescending(uw => uw.DateWatched);

            var TotalCount = await UwQuery.CountAsync();

            var PagedFilmIds = await UwQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(uw => uw.FilmId)
                .ToListAsync();

            var Films = await _context.Films
                .Where(f => PagedFilmIds.Contains(f.Id))
                .ToListAsync();

            var FilmsById = Films.ToDictionary(f => f.Id);
            var OrderedFilms = PagedFilmIds.Select(id => FilmsById[id]).ToList();

            return (OrderedFilms, TotalCount);
        }

        public async Task<Dictionary<double, int>> GetRatingsAsync(int FilmId) =>
            await _context.Reviews
                .Where(r => r.FilmId == FilmId)
                .GroupBy(r => r.Rating)
                .Select(g => new { Rating = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Rating, x => x.Count);

        public async Task<List<Film>> SearchAsync(string Search)
        {
            var Query = _context.Films.AsQueryable();

            if (!string.IsNullOrEmpty(Search))
            {
                Query = Query.Where(f =>
                    EF.Functions.Like(f.Title.ToLower(), $"%{Search}%") ||
                    (f.OriginalTitle != null && EF.Functions.Like(f.OriginalTitle.ToLower(), $"%{Search}%"))
                );
            }

            return await Query
                .Include(f => f.WatchedBy)
                .Include(f => f.CastAndCrew.Where(cc => cc.Role == Role.Director))
                .OrderByDescending(f => f.WatchedBy.Count).ThenByDescending(f => f.FavoriteCount).ThenByDescending(f => f.ReleaseYear)
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
