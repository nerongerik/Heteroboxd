using Heteroboxd.Data;
using Heteroboxd.Models;
using Heteroboxd.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface ICelebrityRepository
    {
        Task<Celebrity?> GetByIdAsync(int Id);
        Task<(List<Film> Films, int TotalCount, List<UserWatchedFilm>? Seen, int? SeenCount)> GetCreditsAsync(int CelebrityId, Guid? UserId, int Page, int PageSize, Role Filter, string Sort, bool Desc, string? FilterValue);
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

        public async Task<(List<Film> Films, int TotalCount, List<UserWatchedFilm>? Seen, int? SeenCount)> GetCreditsAsync(int CelebrityId, Guid? UserId, int Page, int PageSize, Role Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null)
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
                return (Films, TotalCount, null, null);
            }
            else
            {
                //filtering
                var FilmIds = await _context.CelebrityCredits
                    .Where(cc => cc.CelebrityId == CelebrityId && cc.Role == Filter)
                    .Select(cc => cc.FilmId)
                    .ToListAsync();

                var CreditsQuery = _context.Films
                    .Where(f => FilmIds.Contains(f.Id))
                    .GroupJoin(_context.UserWatchedFilms.Where(uwf => uwf.UserId == UserId),
                        f => f.Id,
                        uwf => uwf.FilmId,
                        (f, uwfs) => new { Film = f, Uwfs = uwfs })
                    .SelectMany(x => x.Uwfs.DefaultIfEmpty(),
                        (x, uwf) => new { x.Film, Uwf = uwf })
                    .AsQueryable();

                //sorting
                switch (Sort.ToLower())
                {
                    case "popularity":
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(x => x.Film.WatchCount) : CreditsQuery.OrderBy(x => x.Film.WatchCount);
                        break;
                    case "length":
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(x => x.Film.Length) : CreditsQuery.OrderBy(x => x.Film.Length);
                        break;
                    case "release date":
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(x => x.Film.ReleaseYear) : CreditsQuery.OrderBy(x => x.Film.ReleaseYear);
                        break;
                    case "average rating":
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(x => _context.Reviews.Where(r => r.FilmId == x.Film.Id).Select(r => (double?)r.Rating).Average() ?? 0).ThenByDescending(x => x.Film.WatchCount) : CreditsQuery.OrderBy(x => _context.Reviews.Where(r => r.FilmId == x.Film.Id).Select(r => (double?)r.Rating).Average() ?? 0).ThenByDescending(x => x.Film.WatchCount);
                        break;
                    default:
                        //error handling
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(x => x.Film.ReleaseYear) : CreditsQuery.OrderBy(x => x.Film.ReleaseYear);
                        break;
                }

                var TotalCount = await CreditsQuery.CountAsync();
                var SeenCount = await CreditsQuery.Where(x => x.Uwf != null).CountAsync();
                var JoinResult = await CreditsQuery
                    .Skip((Page - 1) * PageSize)
                    .Take(PageSize)
                    .ToListAsync();
                return (JoinResult.Select(x => x.Film).ToList(), TotalCount, JoinResult.Where(x => x.Uwf != null).Select(x => x.Uwf).ToList(), SeenCount);
            }
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
