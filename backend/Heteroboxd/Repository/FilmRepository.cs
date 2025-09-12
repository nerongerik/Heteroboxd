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
 PLEASE NOTE: IF YOU FIND THAT SEARCH MALFUNCTIONS, IT WILL MOST LIKELY BE DUE TO CASE SENSITIVITY
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
        Task<List<Film>> GetAllAsync();
        Task<Film?> GetByIdAsync(Guid Id);
        Task<List<Film>> GetByYearAsync(int Year);
        Task<List<Film>> GetByCelebrityAsync(Guid CelebrityId);
        Task<List<Film>> GetByUserAsync(Guid UserId);
        Task<List<Film>> SearchAsync(string? Title, string? OriginalTitle, string? Director, ICollection<string>? Cast);
        void Update(Film Film);
        Task<int> UpdateFilmFavoriteCountEfCore7Async(Guid FilmId, int Delta);
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

        public async Task<List<Film>> GetAllAsync() =>
            await _context.Films
            .Include(f => f.CastAndCrew)
                .ThenInclude(cc => cc.Celebrity)
            .Include(f => f.WatchedBy)
                .ThenInclude(w => w.User)
            .Where(f => !f.Deleted)
            .ToListAsync();

        public async Task<Film?> GetByIdAsync(Guid Id) =>
            await _context.Films
                .Include(f => f.CastAndCrew)
                    .ThenInclude(cc => cc.Celebrity)
                .Include(f => f.WatchedBy)
                    .ThenInclude(w => w.User)
                .FirstOrDefaultAsync(f => f.Id == Id && !f.Deleted);

        public async Task<List<Film>> GetByYearAsync(int Year) =>
            await _context.Films
            .Include(f => f.CastAndCrew)
                .ThenInclude(cc => cc.Celebrity)
            .Include(f => f.WatchedBy)
                .ThenInclude(w => w.User)
            .Where(f => f.ReleaseYear == Year && !f.Deleted)
            .ToListAsync();

        public async Task<List<Film>> GetByCelebrityAsync(Guid CelebrityId) =>
            await _context.Films
                .Include(f => f.CastAndCrew)
                    .ThenInclude(cc => cc.Celebrity)
                .Include(f => f.WatchedBy)
                    .ThenInclude(w => w.User)
                .Where(f => f.CastAndCrew.Any(c => c.Celebrity.Id == CelebrityId) && !f.Deleted)
                .ToListAsync();

        public async Task<List<Film>> GetByUserAsync(Guid UserId) =>
            await _context.Films
                .Include(f => f.CastAndCrew)
                    .ThenInclude(cc => cc.Celebrity)
                .Include(f => f.WatchedBy)
                    .ThenInclude(w => w.User)
                .Where(f => f.WatchedBy.Any(w => w.User.Id == UserId) && !f.Deleted)
                .ToListAsync();

        public async Task<List<Film>> SearchAsync(string? Title, string? OriginalTitle, string? Director, ICollection<string>? Cast)
        {
            //the service layer will provide Cast in all lowercase to make the search for the actors specifically easier
            var query = _context.Films.AsQueryable();

            if (!string.IsNullOrEmpty(Title))
                query = query
                    .Where(f => EF.Functions.Like(f.Title, $"%{Title}%"));
            if (!string.IsNullOrEmpty(OriginalTitle))
                query = query
                    .Where(f => f.OriginalTitle != null && EF.Functions.Like(f.OriginalTitle, $"%{OriginalTitle}%"));
            if (!string.IsNullOrEmpty(Director))
                query = query
                    .Where(f => f.CastAndCrew.Any(c => c.Role == Role.Director && EF.Functions.Like(c.Celebrity.Name, $"%{Director}%")));
            if (Cast != null && Cast.Any())
                query = query.Where(f => f.CastAndCrew.Any(c => c.Role == Role.Actor && Cast.Any(name => EF.Functions.Like(c.Celebrity.Name, $"%{name}%"))));

            return await query
                .Include(f => f.CastAndCrew)
                    .ThenInclude(cc => cc.Celebrity)
                .Include(f => f.WatchedBy)
                    .ThenInclude(w => w.User)
                .Where(f => !f.Deleted)
                .ToListAsync();
        }

        public void Update(Film Film)
        {
            _context.Films
                .Update(Film);
        }

        public async Task<int> UpdateFilmFavoriteCountEfCore7Async(Guid FilmId, int Delta)
        {
            var Rows = await _context.Films
                .Where(f => f.Id == FilmId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    f => f.FavoriteCount,
                    f => f.FavoriteCount + Delta
                ));
            if (Rows == 0) throw new KeyNotFoundException();
            var Film = await _context.Films
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == FilmId);
            return Film!.FavoriteCount;
        }

        public void Delete(Film Film) //used in big, weekly (or monthly) purge jobs, consider cascades and side effects later
        {
            _context.Films.Remove(Film);
        }

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
