using Heteroboxd.Data;
using Heteroboxd.Models;
using Heteroboxd.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface ICelebrityRepository
    {
        Task<Celebrity?> GetByIdAsync(int Id);
        Task<(List<Film> Films, int TotalCount)> GetCreditsAsync(int CelebrityId, int Page, int PageSize, Role Filter, string Sort, bool Desc, string? FilterValue);
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

        public async Task<(List<Film> Films, int TotalCount)> GetCreditsAsync(int CelebrityId, int Page, int PageSize, Role Filter, string Sort, bool Desc, string? FilterValue)
        {
            //filtering
            var FilmIds = await _context.CelebrityCredits
                .Where(cc => cc.CelebrityId == CelebrityId && cc.Role == Filter)
                .Select(cc => cc.FilmId)
                .ToListAsync();

            var CreditsQuery = _context.Films
                .Where(f => FilmIds.Contains(f.Id))
                .AsQueryable();

            //sorting
            switch (Sort.ToLower())
            {
                case "popularity":
                    CreditsQuery = Desc ? CreditsQuery.OrderByDescending(f => f.WatchCount) : CreditsQuery.OrderBy(f => f.WatchCount);
                    break;
                case "length":
                    CreditsQuery = Desc ? CreditsQuery.OrderByDescending(f => f.Length) : CreditsQuery.OrderBy(f => f.Length);
                    break;
                case "release date":
                    CreditsQuery = Desc ? CreditsQuery.OrderByDescending(f => f.ReleaseYear) : CreditsQuery.OrderBy(f => f.ReleaseYear);
                    break;
                case "average rating":
                    CreditsQuery = Desc ? CreditsQuery.OrderByDescending(f => _context.Reviews.Where(r => r.FilmId == f.Id).Select(r => (double?)r.Rating).Average() ?? 0).ThenByDescending(f => f.WatchCount) : CreditsQuery.OrderBy(f => _context.Reviews.Where(r => r.FilmId == f.Id).Select(r => (double?)r.Rating).Average() ?? 0).ThenByDescending(f => f.WatchCount);
                    break;
                default:
                    //error handling
                    CreditsQuery = Desc ? CreditsQuery.OrderByDescending(f => f.ReleaseYear) : CreditsQuery.OrderBy(f => f.ReleaseYear);
                    break;
            }

            var TotalCount = await CreditsQuery.CountAsync();
            var Films = await CreditsQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();
            return (Films, TotalCount);
        }

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
