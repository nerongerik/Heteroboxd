using Heteroboxd.Data;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface ICelebrityRepository
    {
        Task<JoinResponse<Celebrity, List<CelebrityCredit>>?> GetByIdAsync(int Id);
        Task<(List<Film> Films, int TotalCount, List<UserWatchedFilm>? Seen, int? SeenCount)> GetCreditsAsync(int CelebrityId, Guid? UserId, int Page, int PageSize, Role Filter, string Sort, bool Desc, string? FilterValue);
        Task<(List<Celebrity> Results, int TotalCount)> SearchAsync(string Search, int Page, int PageSize);
    }

    public class CelebrityRepository : ICelebrityRepository
    {
        private readonly HeteroboxdContext _context;

        public CelebrityRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<JoinResponse<Celebrity, List<CelebrityCredit>>?> GetByIdAsync(int Id) =>
            await _context.Celebrities
                .AsNoTracking()
                .Where(c => c.Id == Id)
                .Select(c => new JoinResponse<Celebrity, List<CelebrityCredit>> { Item = c, Joined = _context.CelebrityCredits.Where(cc => cc.CelebrityId == c.Id).ToList() })
                .FirstOrDefaultAsync();

        public async Task<(List<Film> Films, int TotalCount, List<UserWatchedFilm>? Seen, int? SeenCount)> GetCreditsAsync(int CelebrityId, Guid? UserId, int Page, int PageSize, Role Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null)
            {
                //filtering
                var FilmIds = await _context.CelebrityCredits
                    .AsNoTracking()
                    .Where(cc => cc.CelebrityId == CelebrityId && cc.Role == Filter)
                    .Select(cc => cc.FilmId)
                    .ToListAsync();

                var CreditsQuery = _context.Films
                    .AsNoTracking()
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
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(f => f.Date) : CreditsQuery.OrderBy(f => f.Date);
                        break;
                    case "average rating":
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(f => f.AverageRating).ThenByDescending(f => f.WatchCount) : CreditsQuery.OrderBy(f => f.AverageRating).ThenByDescending(f => f.WatchCount);
                        break;
                    default:
                        //error handling
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(f => f.Date) : CreditsQuery.OrderBy(f => f.Date);
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
                    .AsNoTracking()
                    .Where(cc => cc.CelebrityId == CelebrityId && cc.Role == Filter)
                    .Select(cc => cc.FilmId)
                    .ToListAsync();

                var CreditsQuery = _context.Films
                    .AsNoTracking()
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
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(x => x.Film.Date) : CreditsQuery.OrderBy(x => x.Film.Date);
                        break;
                    case "average rating":
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(x => x.Film.AverageRating).ThenByDescending(x => x.Film.WatchCount) : CreditsQuery.OrderBy(x => x.Film.AverageRating).ThenByDescending(x => x.Film.WatchCount);
                        break;
                    default:
                        //error handling
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(x => x.Film.Date) : CreditsQuery.OrderBy(x => x.Film.Date);
                        break;
                }

                var TotalCount = await CreditsQuery.CountAsync();
                var SeenCount = await CreditsQuery.Where(x => x.Uwf != null).CountAsync();
                var JoinResult = await CreditsQuery
                    .Skip((Page - 1) * PageSize)
                    .Take(PageSize)
                    .ToListAsync();
                return (JoinResult.Select(x => x.Film).ToList(), TotalCount, JoinResult.Where(x => x.Uwf != null).Select(x => x.Uwf).ToList(), SeenCount)!;
            }
        }

        public async Task<(List<Celebrity> Results, int TotalCount)> SearchAsync(string Search, int Page, int PageSize)
        {
            IQueryable<Celebrity> Query;
            if (!string.IsNullOrEmpty(Search))
            {
                var PrefixPattern = $"{Search.Replace("%", "\\%").Replace("_", "\\_")}%";
                var PrefixQuery = _context.Celebrities
                    .AsNoTracking()
                    .Where(c => EF.Functions.Like(c.Name, PrefixPattern));
                var PrefixCount = await PrefixQuery.CountAsync();

                if (PrefixCount > 0)
                {
                    Query = PrefixQuery;
                }
                else
                {
                    Query = _context.Celebrities
                        .AsNoTracking()
                        .Where(c => EF.Functions.ToTsVector("english", c.Name).Matches(EF.Functions.PhraseToTsQuery("english", Search)));
                }

                var TotalCount = await Query.CountAsync();
                var Results = await Query
                    .Skip((Page - 1) * PageSize)
                    .Take(PageSize)
                    .ToListAsync();
                return (Results, TotalCount);
            }
            else
            {
                return (new(), 0);
            }
        }

    }
}
