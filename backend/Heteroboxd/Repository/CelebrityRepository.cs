using Heteroboxd.Data;
using Heteroboxd.Models;
using Heteroboxd.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface ICelebrityRepository
    {
        Task<Celebrity?> GetByIdAsync(int Id);
        Task<List<Celebrity>> SearchAsync(string Search);
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

        public async Task<List<Celebrity>> SearchAsync(string Search)
        {
            var Query = _context.Celebrities.AsQueryable();

            if (!string.IsNullOrEmpty(Search))
            {
                Query = Query.Where(c =>
                    EF.Functions.TrigramsSimilarity(c.Name, Search) > 0.3f);
            }

            return await Query
                .OrderByDescending(c => EF.Functions.TrigramsSimilarity(c.Name, Search))
                .ToListAsync();
        }

    }
}
