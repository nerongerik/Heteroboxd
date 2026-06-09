using Heteroboxd.Shared.Data;
using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Models.DTO;
using Heteroboxd.Shared.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Data.Common;

namespace Heteroboxd.Shared.Repository
{
    public interface ICelebrityRepository
    {
        Task<JoinResponse<Celebrity, List<CelebrityCredit>>?> GetByIdAsync(int Id);
        Task<(List<Film> Films, int TotalCount, List<UserWatchedFilm>? Seen, int? SeenCount)> GetCreditsAsync(int CelebrityId, Guid? UserId, int Page, int PageSize, Role Filter, string Sort, bool Desc, string? FilterValue);
        Task<(List<Celebrity> Results, int TotalCount)> SearchAsync(string Search, int Page, int PageSize);
        Task<bool> StansAsync(Guid UserId, int CelebrityId);
        Task StanUnstanAsync(Guid UserId, int CelebrityId);
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
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(f => f.WatchCount).ThenBy(f => f.Id) : CreditsQuery.OrderBy(f => f.WatchCount).ThenBy(f => f.Id);
                        break;
                    case "length":
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(f => f.Length).ThenBy(f => f.Id) : CreditsQuery.OrderBy(f => f.Length).ThenBy(f => f.Id);
                        break;
                    case "release date":
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(f => f.Date).ThenBy(f => f.Id) : CreditsQuery.OrderBy(f => f.Date).ThenBy(f => f.Id);
                        break;
                    case "average rating":
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(f => f.AverageRating).ThenByDescending(f => f.WatchCount).ThenBy(f => f.Id) : CreditsQuery.OrderBy(f => f.AverageRating).ThenByDescending(f => f.WatchCount).ThenBy(f => f.Id);
                        break;
                    default:
                        //error handling
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(f => f.Date).ThenBy(f => f.Id) : CreditsQuery.OrderBy(f => f.Date).ThenBy(f => f.Id);
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
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(x => x.Film.WatchCount).ThenBy(x => x.Film.Id) : CreditsQuery.OrderBy(x => x.Film.WatchCount).ThenBy(x => x.Film.Id);
                        break;
                    case "length":
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(x => x.Film.Length).ThenBy(x => x.Film.Id) : CreditsQuery.OrderBy(x => x.Film.Length).ThenBy(x => x.Film.Id);
                        break;
                    case "release date":
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(x => x.Film.Date).ThenBy(x => x.Film.Id) : CreditsQuery.OrderBy(x => x.Film.Date).ThenBy(x => x.Film.Id);
                        break;
                    case "average rating":
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(x => x.Film.AverageRating).ThenByDescending(x => x.Film.WatchCount).ThenBy(x => x.Film.Id) : CreditsQuery.OrderBy(x => x.Film.AverageRating).ThenByDescending(x => x.Film.WatchCount).ThenBy(x => x.Film.Id);
                        break;
                    default:
                        //error handling
                        CreditsQuery = Desc ? CreditsQuery.OrderByDescending(x => x.Film.Date).ThenBy(x => x.Film.Id) : CreditsQuery.OrderBy(x => x.Film.Date).ThenBy(x => x.Film.Id);
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
                    .Where(c => EF.Functions.ILike(c.Name, PrefixPattern));
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
                    .OrderByDescending(c => c.StanCount).ThenBy(c => c.Id)
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

        public async Task<bool> StansAsync(Guid UserId, int CelebrityId)
        {
            var UserStanning = await _context.UserStannedCelebrities
                .AsNoTracking()
                .FirstOrDefaultAsync(usc => usc.UserId == UserId && usc.CelebrityId == CelebrityId);
            return UserStanning != null;
        }

        public async Task StanUnstanAsync(Guid UserId, int CelebrityId)
        {
            try
            {
                _context.Add(new UserStannedCelebrity(UserId, CelebrityId));
                await _context.SaveChangesAsync();
                await UpdateStanCountAsync(CelebrityId, 1);
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
            {
                _context.ChangeTracker.Clear();
                await _context.UserStannedCelebrities
                    .Where(usc => usc.UserId == UserId && usc.CelebrityId == CelebrityId)
                    .ExecuteDeleteAsync();
                await UpdateStanCountAsync(CelebrityId, -1);
            }
        }

        private async Task UpdateStanCountAsync(int CelebrityId, int Delta)
        {
            var Rows = await _context.Celebrities
                .Where(c => c.Id == CelebrityId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    c => c.StanCount,
                    c => c.StanCount + Delta < 0 ? 0 : c.StanCount + Delta
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }
    }
}
