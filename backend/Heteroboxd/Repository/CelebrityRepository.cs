using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface ICelebrityRepository
    {
        Task<Celebrity?> GetByIdAsync(int Id);
        Task<List<Celebrity>> GetByFilmAsync(int FilmId);
        Task<List<Celebrity>> SearchAsync(string Name);
    }

    public class CelebrityRepository : ICelebrityRepository
    {
        private readonly HeteroboxdContext _context;

        public CelebrityRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<Celebrity?> GetByIdAsync(int Id) =>
            await _context.Celebrities
                .Include(c => c.Credits)
                .FirstOrDefaultAsync(c => c.Id == Id);

        public async Task<List<Celebrity>> GetByFilmAsync(int FilmId) =>
            await _context.Celebrities
                .Include(c => c.Credits)
                .Where(c => c.Credits.Any(cc => cc.FilmId == FilmId))
                .ToListAsync();

        public async Task<List<Celebrity>> SearchAsync(string Name)
        {
            var query = _context.Celebrities.AsQueryable();

            if (!string.IsNullOrEmpty(Name))
            {
                query = query.Where(c =>
                    EF.Functions.Like(c.Name.ToLower() ?? "", $"%{Name}%")
                );
            }

            return await query
                .ToListAsync();
        }

    }
}
