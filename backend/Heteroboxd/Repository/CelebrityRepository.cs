using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel;

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
    public interface ICelebrityRepository
    {
        Task<List<Celebrity>> GetAllAsync(CancellationToken CancellationToken = default);
        Task<Celebrity?> GetById(Guid Id);
        Task<List<Celebrity>> GetByFilm(Guid FilmId);
        Task<List<Celebrity>> SearchAsync(string Name); //add arguments as needed
        void Update(Celebrity Celebrity);
        void Delete(Celebrity Celebrity);
        Task SaveChangesAsync();
    }

    public class CelebrityRepository : ICelebrityRepository
    {
        private readonly HeteroboxdContext _context;

        public CelebrityRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<List<Celebrity>> GetAllAsync(CancellationToken CancellationToken = default) =>
            await _context.Celebrities
                .Where(c => !c.Deleted)
                .ToListAsync(CancellationToken);

        public async Task<Celebrity?> GetById(Guid Id) =>
            await _context.Celebrities
                .Include(c => c.Credits)
                .FirstOrDefaultAsync(c => c.Id == Id && !c.Deleted);

        public async Task<List<Celebrity>> GetByFilm(Guid FilmId) =>
            await _context.Celebrities
                .Include(c => c.Credits)
                .Where(c => !c.Deleted && c.Credits.Any(cc => cc.FilmId == FilmId))
                .ToListAsync();

        public async Task<List<Celebrity>> SearchAsync(string Name)
        {
            var query = _context.Celebrities.AsQueryable();
            if (!string.IsNullOrEmpty(Name))
                query = query
                    .Where(u => EF.Functions.Like(u.Name, $"%{Name}%"));
            return await query
                .Where(u => !u.Deleted)
                .ToListAsync();
        }

        public void Update(Celebrity Celebrity)
        {
            _context.Celebrities
                .Update(Celebrity);
        }

        public void Delete(Celebrity Celebrity)
        {
            _context.Celebrities
                .Remove(Celebrity);
        }

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
