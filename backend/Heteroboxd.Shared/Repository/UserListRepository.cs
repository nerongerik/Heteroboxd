using Heteroboxd.Shared.Data;
using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Shared.Repository
{
    public interface IUserListRepository
    {
        Task<(List<JoinedListEntries> Responses, int TotalCount)> GetAllAsync(IEnumerable<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue, bool Admin);
        Task<UserList?> GetByIdAsync(Guid ListId);
        Task<JoinedUserList?> GetJoinedByIdAsync(Guid ListId);
        Task<(List<JoinResponse<ListEntry, Film>> Responses, int TotalCount, List<UserWatchedFilm>? Seen, int? SeenCount)> GetEntriesByIdAsync(Guid ListId, Guid? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<List<JoinResponse<ListEntry, Film>>> PowerGetEntriesAsync(Guid ListId);
        Task<(List<JoinedListEntries> Responses, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<(List<DelimitedUserListInfoResponse> Response, int TotalCount)> SummarizeByUserAsync(Guid UserId, int FilmId, int Page, int PageSize);
        Task<(List<JoinedListEntries> Responses, int TotalCount)> GetFeaturingFilmAsync(int FilmId, IEnumerable<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<int> GetFeaturingFilmCountAsync(int FilmId);
        Task<(List<JoinedListEntries> Results, int TotalCount)> SearchAsync(string Search, int Page, int PageSize);
        Task<Dictionary<Guid, int>> GetMaxPositionsAsync(IReadOnlyCollection<Guid> ListIds);
        Task CreateAsync(UserList UserList);
        Task CreateEntriesAsync(IReadOnlyCollection<ListEntry> ListEntry);
        Task UpdateAsync(UserList UserList);
        Task RedateAsync(IReadOnlyCollection<Guid> UserListIds);
        Task ToggleNotificationsAsync(Guid ListId);
        Task ReportAsync(Guid ListId);
        Task DeleteAsync(Guid ListId);
        Task DeleteAllEntriesAsync(Guid ListId);
    }

    public class UserListRepository : IUserListRepository
    {
        private readonly HeteroboxdContext _context;

        public UserListRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<(List<JoinedListEntries> Responses, int TotalCount)> GetAllAsync(IEnumerable<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue, bool Admin)
        {
            var Query = 
                Admin ?
                    _context.UserLists
                        .AsNoTracking()
                        .Join(_context.Users, ul => ul.AuthorId, u => u.Id, (ul, u) => new { ul, u })
                        .Select(x => new
                        {
                            x.ul,
                            x.u,
                            LikeCount = _context.UserLikedLists.Count(ull => ull.ListId == x.ul.Id),
                            ListEntryCount = _context.ListEntries.Count(le => le.UserListId == x.ul.Id)
                        })
                        .AsQueryable()
                :
                    _context.UserLists
                        .AsNoTracking()
                        .Where(ul => !ul.Private)
                        .Join(_context.Users, ul => ul.AuthorId, u => u.Id, (ul, u) => new { ul, u })
                        .Select(x => new
                        {
                            x.ul,
                            x.u,
                            LikeCount = _context.UserLikedLists.Count(ull => ull.ListId == x.ul.Id),
                            ListEntryCount = _context.ListEntries.Count(le => le.UserListId == x.ul.Id)
                        })
                        .AsQueryable();

            //filtering
            switch (Filter.ToLower())
            {
                case "friends":
                    Query = Query.Where(x => UsersFriends!.Contains(x.ul.AuthorId));
                    break;
                default:
                    //error handling
                    break;
            }

            //sorting
            switch (Sort.ToLower())
            {
                case "popularity":
                    Query = Desc ? Query.OrderByDescending(x => x.LikeCount).ThenBy(x => x.ul.Id) : Query.OrderBy(x => x.LikeCount).ThenBy(x => x.ul.Id);
                    break;
                case "date created":
                    Query = Desc ? Query.OrderByDescending(x => x.ul.Date).ThenBy(x => x.ul.Id) : Query.OrderBy(x => x.ul.Date).ThenBy(x => x.ul.Id);
                    break;
                case "size":
                    Query = Desc ? Query.OrderByDescending(x => x.ListEntryCount).ThenBy(x => x.ul.Id) : Query.OrderBy(x => x.ListEntryCount).ThenBy(x => x.ul.Id);
                    break;
                case "flags":
                    Query = Query.OrderByDescending(x => x.ul.Flags).ThenBy(x => x.ul.Id);
                    break;
                default:
                    //error handling
                    Query = Query.OrderByDescending(x => x.LikeCount).ThenBy(x => x.ul.Id);
                    break;
            }

            int TotalCount = await Query.CountAsync();
            var Responses = await Query
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            var EntriesByList = await GetTopEntriesByListAsync(Responses.Select(x => x.ul.Id));

            return (Responses.Select(x => new JoinedListEntries(
                new JoinedUserList(x.ul, x.u, x.LikeCount, x.ListEntryCount),
                EntriesByList.TryGetValue(x.ul.Id, out var entries)
                    ? entries
                    : Enumerable.Repeat<JoinResponse<ListEntry, Film>?>(null, 4).ToList()
            )).ToList(), TotalCount);
        }

        public async Task<UserList?> GetByIdAsync(Guid ListId) =>
            await _context.UserLists
                .AsNoTracking()
                .FirstOrDefaultAsync(ul => ul.Id == ListId);

        public async Task<JoinedUserList?> GetJoinedByIdAsync(Guid ListId)
        {
            var Result = await _context.UserLists
                .AsNoTracking()
                .Where(ul => ul.Id == ListId)
                .Join(_context.Users, ul => ul.AuthorId, u => u.Id, (ul, u) => new { ul, u })
                .Select(x => new
                {
                    x.ul,
                    x.u,
                    LikeCount = _context.UserLikedLists.Count(ull => ull.ListId == x.ul.Id),
                    ListEntryCount = _context.ListEntries.Count(le => le.UserListId == x.ul.Id)
                })
                .FirstOrDefaultAsync();
            return Result == null ? null : new JoinedUserList(Result.ul, Result.u, Result.LikeCount, Result.ListEntryCount);
        }

        public async Task<(List<JoinResponse<ListEntry, Film>> Responses, int TotalCount, List<UserWatchedFilm>? Seen, int? SeenCount)> GetEntriesByIdAsync(Guid ListId, Guid? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null)
            {
                var EntriesQuery = _context.ListEntries
                    .AsNoTracking()
                    .Where(le => le.UserListId == ListId)
                    .Join(_context.Films, le => le.FilmId, f => f.Id, (le, f) => new { Entry = le, Film = f });

                //filtering - lists are defined by Users, and thus cannot be filtered by arbitrary properties

                //sorting
                switch (Sort.ToLower())
                {
                    case "position":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Entry.Position).ThenBy(x => x.Film.Id) : EntriesQuery.OrderBy(x => x.Entry.Position).ThenBy(x => x.Film.Id);
                        break;
                    case "popularity":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Film.WatchCount).ThenBy(x => x.Film.Id) : EntriesQuery.OrderBy(x => x.Film.WatchCount).ThenBy(x => x.Film.Id);
                        break;
                    case "length":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Film.Length).ThenBy(x => x.Film.Id) : EntriesQuery.OrderBy(x => x.Film.Length).ThenBy(x => x.Film.Id);
                        break;
                    case "release date":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Film.Date).ThenBy(x => x.Film.Id) : EntriesQuery.OrderBy(x => x.Film.Date).ThenBy(x => x.Film.Id);
                        break;
                    case "average rating":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Film.AverageRating).ThenByDescending(x => x.Film.WatchCount).ThenBy(x => x.Film.Id) : EntriesQuery.OrderBy(x => x.Film.AverageRating).ThenByDescending(x => x.Film.WatchCount).ThenBy(x => x.Film.Id);
                        break;
                    default:
                        //error fallback
                        EntriesQuery = EntriesQuery.OrderBy(x => x.Entry.Position).ThenBy(x => x.Film.Id);
                        break;
                }

                var TotalCount = await EntriesQuery.CountAsync();
                var Responses = await EntriesQuery
                    .Skip((Page - 1) * PageSize)
                    .Take(PageSize)
                    .Select(x => new JoinResponse<ListEntry, Film> { Item = x.Entry, Joined = x.Film })
                    .ToListAsync();

                return (Responses, TotalCount, null, null);
            }
            else
            {
                var EntriesQuery = _context.ListEntries
                    .AsNoTracking()
                    .Where(le => le.UserListId == ListId)
                    .Join(_context.Films, le => le.FilmId, f => f.Id, (le, f) => new { Entry = le, Film = f })
                    .GroupJoin(_context.UserWatchedFilms.Where(uwf => uwf.UserId == UserId),
                        x => x.Film.Id,
                        uwf => uwf.FilmId,
                        (x, uwfs) => new { x.Entry, x.Film, Uwfs = uwfs })
                    .SelectMany(x => x.Uwfs.DefaultIfEmpty(),
                        (x, uwf) => new { x.Entry, x.Film, Uwf = uwf })
                    .AsQueryable();

                //filtering - lists are defined by Users, and thus cannot be filtered by arbitrary properties

                //sorting
                switch (Sort.ToLower())
                {
                    case "position":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Entry.Position).ThenBy(x => x.Film.Id) : EntriesQuery.OrderBy(x => x.Entry.Position).ThenBy(x => x.Film.Id);
                        break;
                    case "popularity":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Film.WatchCount).ThenBy(x => x.Film.Id) : EntriesQuery.OrderBy(x => x.Film.WatchCount).ThenBy(x => x.Film.Id);
                        break;
                    case "length":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Film.Length).ThenBy(x => x.Film.Id) : EntriesQuery.OrderBy(x => x.Film.Length).ThenBy(x => x.Film.Id);
                        break;
                    case "release date":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Film.Date).ThenBy(x => x.Film.Id) : EntriesQuery.OrderBy(x => x.Film.Date).ThenBy(x => x.Film.Id);
                        break;
                    case "average rating":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Film.AverageRating).ThenByDescending(x => x.Film.WatchCount).ThenBy(x => x.Film.Id) : EntriesQuery.OrderBy(x => x.Film.AverageRating).ThenByDescending(x => x.Film.WatchCount).ThenBy(x => x.Film.Id);
                        break;
                    default:
                        //error fallback
                        EntriesQuery = EntriesQuery.OrderBy(x => x.Entry.Position).ThenBy(x => x.Film.Id);
                        break;
                }

                var TotalCount = await EntriesQuery.CountAsync();
                var SeenCount = await EntriesQuery.Where(x => x.Uwf != null).CountAsync();
                var Responses = await EntriesQuery
                    .Skip((Page - 1) * PageSize)
                    .Take(PageSize)
                    .ToListAsync();

                return (Responses.Select(x => new JoinResponse<ListEntry, Film> { Item = x.Entry, Joined = x.Film }).ToList(), TotalCount, Responses.Where(x => x.Uwf != null).Select(x => x.Uwf).ToList(), SeenCount)!;
            }
        }

        public async Task<List<JoinResponse<ListEntry, Film>>> PowerGetEntriesAsync(Guid ListId) =>
            await _context.ListEntries
                .AsNoTracking()
                .Where(le => le.UserListId == ListId)
                .Join(_context.Films, le => le.FilmId, f => f.Id, (le, f) => new { le, f })
                .OrderBy(x => x.le.Position)
                .Select(x => new JoinResponse<ListEntry, Film> { Item = x.le, Joined = x.f })
                .ToListAsync();

        public async Task<(List<JoinedListEntries> Responses, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var UserQuery = _context.UserLists
                .AsNoTracking()
                .Where(ul => ul.AuthorId == UserId)
                .Select(ul => new
                {
                    ul,
                    LikeCount = _context.UserLikedLists.Count(ull => ull.ListId == ul.Id),
                    ListEntryCount = _context.ListEntries.Count(le => le.UserListId == ul.Id)
                })
                .AsQueryable();

            //filtering - querying by User already filters out enough

            //sorting
            switch (Sort.ToLower())
            {
                case "popularity":
                    UserQuery = Desc ? UserQuery.OrderByDescending(x => x.LikeCount).ThenBy(x => x.ul.Id) : UserQuery.OrderBy(x => x.LikeCount).ThenBy(x => x.ul.Id);
                    break;
                case "date created":
                    UserQuery = Desc ? UserQuery.OrderByDescending(x => x.ul.Date).ThenBy(x => x.ul.Id) : UserQuery.OrderBy(x => x.ul.Date).ThenBy(x => x.ul.Id);
                    break;
                case "size":
                    UserQuery = Desc ? UserQuery.OrderByDescending(x => x.ListEntryCount).ThenBy(x => x.ul.Id) : UserQuery.OrderBy(x => x.ListEntryCount).ThenBy(x => x.ul.Id);
                    break;
                default:
                    //error handling
                    UserQuery = UserQuery.OrderByDescending(x => x.ul.Date).ThenBy(x => x.ul.Id);
                    break;
            }

            var TotalCount = await UserQuery.CountAsync();
            var Lists = await UserQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            var EntriesByList = await GetTopEntriesByListAsync(Lists.Select(x => x.ul.Id));

            return (Lists.Select(x => new JoinedListEntries(
                new JoinedUserList(x.ul, null, x.LikeCount, x.ListEntryCount),
                EntriesByList.TryGetValue(x.ul.Id, out var entries)
                    ? entries
                    : Enumerable.Repeat<JoinResponse<ListEntry, Film>?>(null, 4).ToList()
            )).ToList(), TotalCount);
        }

        public async Task<(List<DelimitedUserListInfoResponse> Response, int TotalCount)> SummarizeByUserAsync(Guid UserId, int FilmId, int Page, int PageSize)
        {
            var TotalCount = await _context.UserLists
                .AsNoTracking()
                .CountAsync(ul => ul.AuthorId == UserId);
            var Response = await _context.UserLists
                .AsNoTracking()
                .Where(ul => ul.AuthorId == UserId)
                .OrderBy(ul => ul.Id)
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(ul => new DelimitedUserListInfoResponse
                {
                    ListId = ul.Id.ToString(),
                    ListName = ul.Name,
                    ContainsFilm = _context.ListEntries.Any(le => le.UserListId == ul.Id && le.FilmId == FilmId),
                    Size = _context.ListEntries.Count(le => le.UserListId == ul.Id)
                })
                .ToListAsync();
            return (Response, TotalCount);
        }

        public async Task<(List<JoinedListEntries> Responses, int TotalCount)> GetFeaturingFilmAsync(int FilmId, IEnumerable<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var ListIdsQuery = _context.ListEntries
                .AsNoTracking()
                .Where(le => le.FilmId == FilmId)
                .Select(le => le.UserListId)
                .Distinct();

            var ListQuery = _context.UserLists
                .AsNoTracking()
                .Where(ul => ListIdsQuery.Contains(ul.Id) && !ul.Private)
                .Join(_context.Users, ul => ul.AuthorId, u => u.Id, (ul, u) => new { ul, u })
                .Select(x => new
                {
                    x.ul,
                    x.u,
                    LikeCount = _context.UserLikedLists.Count(ull => ull.ListId == x.ul.Id),
                    ListEntryCount = _context.ListEntries.Count(le => le.UserListId == x.ul.Id)
                });

            //filtering
            switch (Filter.ToLower())
            {
                case "friends":
                    ListQuery = ListQuery.Where(x => UsersFriends!.Contains(x.ul.AuthorId));
                    break;
                default:
                    //error handling
                    break;
            }

            //sorting
            switch (Sort.ToLower())
            {
                case "popularity":
                    ListQuery = Desc ? ListQuery.OrderByDescending(x => x.LikeCount).ThenBy(x => x.ul.Id) : ListQuery.OrderBy(x => x.LikeCount).ThenBy(x => x.ul.Id);
                    break;
                case "date created":
                    ListQuery = Desc ? ListQuery.OrderByDescending(x => x.ul.Date).ThenBy(x => x.ul.Id) : ListQuery.OrderBy(x => x.ul.Date).ThenBy(x => x.ul.Id);
                    break;
                case "size":
                    ListQuery = Desc ? ListQuery.OrderByDescending(x => x.ListEntryCount).ThenBy(x => x.ul.Id) : ListQuery.OrderBy(x => x.ListEntryCount).ThenBy(x => x.ul.Id);
                    break;
                default:
                    //error handling
                    ListQuery = ListQuery.OrderByDescending(x => x.LikeCount).ThenBy(x => x.ul.Id);
                    break;
            }

            var TotalCount = await ListQuery.CountAsync();
            var Responses = await ListQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            var EntriesByList = await GetTopEntriesByListAsync(Responses.Select(x => x.ul.Id));

            return (Responses.Select(x => new JoinedListEntries(
                new JoinedUserList(x.ul, x.u, x.LikeCount, x.ListEntryCount),
                EntriesByList.TryGetValue(x.ul.Id, out var entries)
                    ? entries
                    : Enumerable.Repeat<JoinResponse<ListEntry, Film>?>(null, 4).ToList()
            )).ToList(), TotalCount);
        }

        public async Task<int> GetFeaturingFilmCountAsync(int FilmId) =>
            await _context.ListEntries
                .AsNoTracking()
                .Where(le => le.FilmId == FilmId)
                .CountAsync();

        public async Task<(List<JoinedListEntries> Results, int TotalCount)> SearchAsync(string Search, int Page, int PageSize)
        {
            IQueryable<UserList> Query;
            if (!string.IsNullOrEmpty(Search))
            {
                var PrefixPattern = $"{Search.Replace("%", "\\%").Replace("_", "\\_")}%";
                var PrefixQuery = _context.UserLists
                    .AsNoTracking()
                    .Where(ul => EF.Functions.ILike(ul.Name, PrefixPattern) && !ul.Private);
                var PrefixCount = await PrefixQuery.CountAsync();

                if (PrefixCount > 0)
                {
                    Query = PrefixQuery;
                }
                else
                {
                    Query = _context.UserLists
                        .AsNoTracking()
                        .Where(ul => EF.Functions.ToTsVector("english", ul.Name).Matches(EF.Functions.PhraseToTsQuery("english", Search)) && !ul.Private);
                }

                var TotalCount = await Query.CountAsync();

                var Responses = await Query
                    .Select(ul => new
                    {
                        ul,
                        LikeCount = _context.UserLikedLists.Count(ull => ull.ListId == ul.Id),
                        ListEntryCount = _context.ListEntries.Count(le => le.UserListId == ul.Id)
                    })
                    .OrderByDescending(x => x.LikeCount).ThenBy(x => x.ul.Id)
                    .Skip((Page - 1) * PageSize)
                    .Take(PageSize)
                    .Join(_context.Users, x => x.ul.AuthorId, u => u.Id, (x, u) => new { x.ul, u, x.LikeCount, x.ListEntryCount })
                    .ToListAsync();

                var EntriesByList = await GetTopEntriesByListAsync(Responses.Select(x => x.ul.Id));

                return (Responses.Select(x => new JoinedListEntries(
                    new JoinedUserList(x.ul, x.u, x.LikeCount, x.ListEntryCount),
                    EntriesByList.TryGetValue(x.ul.Id, out var entries)
                        ? entries
                        : Enumerable.Repeat<JoinResponse<ListEntry, Film>?>(null, 4).ToList()
                )).ToList(), TotalCount);
            }
            else
            {
                return (new(), 0);
            }
        }

        public async Task CreateAsync(UserList UserList)
        {
            _context.UserLists.Add(UserList);
            await _context.SaveChangesAsync();
        }

        public async Task<Dictionary<Guid, int>> GetMaxPositionsAsync(IReadOnlyCollection<Guid> ListIds)
        {
            var Positions = await _context.UserLists
                .AsNoTracking()
                .Where(ul => ListIds.Contains(ul.Id))
                .Select(ul => new
                {
                    ul.Id,
                    MaxPosition = _context.ListEntries
                        .Where(le => le.UserListId == ul.Id)
                        .Select(le => (int?)le.Position)
                        .Max() ?? 0
                })
                .ToListAsync();

            return Positions.ToDictionary(x => x.Id, x => x.MaxPosition);
        }

        public async Task CreateEntriesAsync(IReadOnlyCollection<ListEntry> Entries)
        {
            _context.ListEntries.AddRange(Entries);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(UserList UserList)
        {
            _context.UserLists.Update(UserList);
            await _context.SaveChangesAsync();
        }

        public async Task RedateAsync(IReadOnlyCollection<Guid> UserListIds)
        {
            var Rows = await _context.UserLists
                .Where(ul => UserListIds.Contains(ul.Id))
                .ExecuteUpdateAsync(s => s.SetProperty(
                    ul => ul.Date,
                    ul => DateTime.UtcNow
                ));
            if (Rows != UserListIds.Count) throw new KeyNotFoundException();
        }

        public async Task ToggleNotificationsAsync(Guid ListId)
        {
            var Rows = await _context.UserLists
                .Where(ul => ul.Id == ListId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    ul => ul.NotificationsOn,
                    ul => !ul.NotificationsOn
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task ReportAsync(Guid ListId)
        {
            var Rows = await _context.UserLists
                .Where(ul => ul.Id == ListId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    ul => ul.Flags,
                    ul => ul.Flags + 1
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task DeleteAsync(Guid ListId) =>
            await _context.UserLists
                .Where(ul => ul.Id == ListId)
                .ExecuteDeleteAsync();

        public async Task DeleteAllEntriesAsync(Guid ListId) =>
            await _context.ListEntries
                .Where(le => le.UserListId == ListId)
                .ExecuteDeleteAsync();

        private async Task<Dictionary<Guid, List<JoinResponse<ListEntry, Film>?>>> GetTopEntriesByListAsync(IEnumerable<Guid> ListIds)
        {
            var ListIdSet = ListIds.ToHashSet();
            var Entries = await _context.ListEntries
                .AsNoTracking()
                .Where(le => ListIdSet.Contains(le.UserListId)
                    && _context.ListEntries
                        .Where(candidate => candidate.UserListId == le.UserListId)
                        .OrderBy(candidate => candidate.Position)
                        .ThenBy(candidate => candidate.Id)
                        .Take(4)
                        .Select(candidate => candidate.Id)
                        .Contains(le.Id))
                .Join(_context.Films, le => le.FilmId, f => f.Id, (le, f) => new { le, f })
                .OrderBy(x => x.le.UserListId)
                .ThenBy(x => x.le.Position)
                .ThenBy(x => x.le.Id)
                .ToListAsync();

            return Entries
                .GroupBy(x => x.le.UserListId)
                .ToDictionary(
                g => g.Key,
                g =>
                {
                    var Top = g
                        .OrderBy(x => x.le.Position)
                        .Take(4)
                        .Select(x => (JoinResponse<ListEntry, Film>?)new JoinResponse<ListEntry, Film>
                        {
                            Item = x.le,
                            Joined = x.f
                        })
                        .ToList();
                    if (Top.Count < 4)
                    {
                        Top.AddRange(Enumerable.Repeat<JoinResponse<ListEntry, Film>?>(null, 4 - Top.Count));
                    }
                    return Top;
                }
                );
        }
    }
}
