using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;
using Heteroboxd.Models.Enums;

/*
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 NOTE: IF YOU FIND THAT SEARCH MALFUNCTIONS, IT WILL MOST LIKELY BE DUE TO CASE SENSITIVITY
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 *
*/

namespace Heteroboxd.Repository
{
    public interface IFilmRepository
    {
        Task<List<Film>> GetAllAsync(CancellationToken CancellationToken = default);
        Task<Film?> GetByIdAsync(Guid Id);
        Task<List<Film>> GetByYearAsync(int Year);
        Task<List<Film>> GetByCelebrityAsync(Guid CelebrityId);
        Task<List<Film>> GetByUserAsync(Guid UserId);
        Task<List<Film>> SearchAsync(string? Title, string? OriginalTitle);
        void Update(Film Film);
        Task UpdateFilmFavoriteCountEfCore7Async(Guid FilmId, int Delta);
        void Delete(Film Film);
        Task SaveChangesAsync();
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

        public async Task<Film?> GetByIdAsync(Guid Id) =>
            await _context.Films
                .Include(f => f.WatchedBy)
                .FirstOrDefaultAsync(f => f.Id == Id && !f.Deleted);

        public async Task<List<Film>> GetByYearAsync(int Year) =>
            await _context.Films
            .Where(f => f.ReleaseYear == Year && !f.Deleted)
            .ToListAsync();

        public async Task<List<Film>> GetByCelebrityAsync(Guid CelebrityId) =>
            await _context.Films
                .Include(f => f.CastAndCrew) //if there is trouble getting roles, try .ThenInclude(c => c.Role)
                .Include(f => f.WatchedBy)
                .Where(f => f.CastAndCrew.Any(c => c.CelebrityId == CelebrityId) && !f.Deleted)
                .ToListAsync();

        public async Task<List<Film>> GetByUserAsync(Guid UserId) =>
            await _context.Films
                .Include(f => f.WatchedBy)
                .Where(f => f.WatchedBy.Any(w => w.UserId == UserId) && !f.Deleted)
                .ToListAsync();

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

        public void Update(Film Film)
        {
            _context.Films
                .Update(Film);
        }

        public async Task UpdateFilmFavoriteCountEfCore7Async(Guid FilmId, int Delta) //increments/decrements favorite count
        {
            var Rows = await _context.Films
                .Where(f => f.Id == FilmId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    f => f.FavoriteCount,
                    f => f.FavoriteCount + Delta
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public void Delete(Film Film) //used in big, weekly (or monthly) purge jobs, consider cascades and side effects later
        {
            _context.Films.Remove(Film);
        }

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
