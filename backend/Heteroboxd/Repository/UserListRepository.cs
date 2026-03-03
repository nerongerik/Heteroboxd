using Heteroboxd.Data;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface IUserListRepository
    {
        Task<(List<JoinResponse<UserList, User>> Results, int TotalCount)> GetListsAsync(List<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<UserList?> GetByIdAsync(Guid ListId);
        Task<(List<ListEntry> ListEntries, int TotalCount, List<UserWatchedFilm>? Seen, int? SeenCount)> GetEntriesByIdAsync(Guid ListId, Guid? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue); //view
        Task<List<ListEntry>> PowerGetEntriesAsync(Guid ListId); //update
        Task<(List<UserList> Lists, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<List<UserList>> GetLightweightAsync(Guid UserId);
        Task<(List<JoinResponse<UserList, User>> Responses, int TotalCount)> GetFeaturingFilmAsync(int FilmId, List<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<int> GetFeaturingFilmCountAsync(int FilmId);
        Task<(List<JoinResponse<UserList, User>> Results, int TotalCount)> SearchAsync(string Search, int Page, int PageSize);
        void Create(UserList UserList);
        void CreateEntry(ListEntry ListEntry);
        void Update(UserList UserList);
        Task UpdateLikeCountEfCore7Async(Guid ListId, int Delta);
        Task ToggleNotificationsEfCore7Async(Guid ListId);
        void Delete(UserList UserList);
        void DeleteEntriesByListId(Guid ListId);
        Task SaveChangesAsync();
    }

    public class UserListRepository : IUserListRepository
    {
        private readonly HeteroboxdContext _context;

        public UserListRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<(List<JoinResponse<UserList, User>> Results, int TotalCount)> GetListsAsync(List<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var Query = _context.UserLists
                .Include(ul => ul.Films)
                .Join(_context.Users, ul => ul.AuthorId, u => u.Id, (ul, u) => new { ul, u })
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
                    Query = Desc ? Query.OrderByDescending(x => x.ul.LikeCount) : Query.OrderBy(x => x.ul.LikeCount);
                    break;
                case "date created":
                    Query = Desc ? Query.OrderByDescending(x => x.ul.DateCreated) : Query.OrderBy(x => x.ul.DateCreated);
                    break;
                case "size":
                    Query = Desc ? Query.OrderByDescending(x => x.ul.Films.Count) : Query.OrderBy(x => x.ul.Films.Count);
                    break;
                default:
                    //error handling
                    Query = Query.OrderByDescending(x => x.ul.LikeCount);
                    break;
            }

            int TotalCount = await Query.CountAsync();
            var Responses = await Query
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinResponse<UserList, User> { Item = x.ul, Joined = x.u })
                .ToListAsync();
            return (Responses, TotalCount);
        }

        public async Task<UserList?> GetByIdAsync(Guid ListId) =>
            await _context.UserLists
                .FirstOrDefaultAsync(ul => ul.Id == ListId);

        public async Task<(List<ListEntry> ListEntries, int TotalCount, List<UserWatchedFilm>? Seen, int? SeenCount)> GetEntriesByIdAsync(Guid ListId, Guid? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null)
            {
                var EntriesQuery = _context.ListEntries
                .Where(le => le.UserListId == ListId)
                .Join(_context.Films, le => le.FilmId, f => f.Id, (le, f) => new { Entry = le, Film = f });

                //filtering - lists are defined by Users, and thus cannot be filtered by arbitrary properties

                //sorting
                switch (Sort.ToLower())
                {
                    case "position":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Entry.Position) : EntriesQuery.OrderBy(x => x.Entry.Position);
                        break;
                    case "date added":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Entry.DateAdded) : EntriesQuery.OrderBy(x => x.Entry.DateAdded);
                        break;
                    case "popularity":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Film.WatchCount) : EntriesQuery.OrderBy(x => x.Film.WatchCount);
                        break;
                    case "length":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Film.Length) : EntriesQuery.OrderBy(x => x.Film.Length);
                        break;
                    case "release date":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Film.ReleaseYear) : EntriesQuery.OrderBy(x => x.Film.ReleaseYear);
                        break;
                    case "average rating":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => _context.Reviews.Where(r => r.FilmId == x.Film.Id).Select(r => (double?)r.Rating).Average() ?? 0).ThenByDescending(x => x.Film.WatchCount) : EntriesQuery.OrderBy(x => _context.Reviews.Where(r => r.FilmId == x.Film.Id).Select(r => (double?)r.Rating).Average() ?? 0).ThenByDescending(x => x.Film.WatchCount);
                        break;
                    default:
                        //error fallback
                        EntriesQuery = EntriesQuery.OrderBy(x => x.Entry.Position);
                        break;
                }

                var TotalCount = await EntriesQuery.CountAsync();
                var Entries = await EntriesQuery
                    .Skip((Page - 1) * PageSize)
                    .Take(PageSize)
                    .Select(x => x.Entry)
                    .ToListAsync();
                return (Entries, TotalCount, null, null);
            }
            else
            {
                var EntriesQuery = _context.ListEntries
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
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Entry.Position) : EntriesQuery.OrderBy(x => x.Entry.Position);
                        break;
                    case "date added":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Entry.DateAdded) : EntriesQuery.OrderBy(x => x.Entry.DateAdded);
                        break;
                    case "popularity":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Film.WatchCount) : EntriesQuery.OrderBy(x => x.Film.WatchCount);
                        break;
                    case "length":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Film.Length) : EntriesQuery.OrderBy(x => x.Film.Length);
                        break;
                    case "release date":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Film.ReleaseYear) : EntriesQuery.OrderBy(x => x.Film.ReleaseYear);
                        break;
                    case "average rating":
                        EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => _context.Reviews.Where(r => r.FilmId == x.Film.Id).Select(r => (double?)r.Rating).Average() ?? 0).ThenByDescending(x => x.Film.WatchCount) : EntriesQuery.OrderBy(x => _context.Reviews.Where(r => r.FilmId == x.Film.Id).Select(r => (double?)r.Rating).Average() ?? 0).ThenByDescending(x => x.Film.WatchCount);
                        break;
                    default:
                        //error fallback
                        EntriesQuery = EntriesQuery.OrderBy(x => x.Entry.Position);
                        break;
                }

                var TotalCount = await EntriesQuery.CountAsync();
                var SeenCount = await EntriesQuery.Where(x => x.Uwf != null).CountAsync();
                var JoinResult = await EntriesQuery
                    .Skip((Page - 1) * PageSize)
                    .Take(PageSize)
                    .ToListAsync();

                return (JoinResult.Select(x => x.Entry).ToList(), TotalCount, JoinResult.Where(x => x.Uwf != null).Select(x => x.Uwf).ToList(), SeenCount)!;
            }
        }

        public async Task<List<ListEntry>> PowerGetEntriesAsync(Guid ListId) =>
            await _context.ListEntries
                .Where(le => le.UserListId == ListId)
                .OrderBy(le => le.Position)
                .ToListAsync();

        public async Task<(List<UserList> Lists, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var UserQuery = _context.UserLists
                .Include(ul => ul.Films)
                .Where(ul => ul.AuthorId == UserId)
                .AsQueryable();

            //filtering - querying by User already filters out enough

            //sorting
            switch (Sort.ToLower())
            {
                case "popularity":
                    UserQuery = Desc ? UserQuery.OrderByDescending(ul => ul.LikeCount) : UserQuery.OrderBy(ul => ul.LikeCount);
                    break;
                case "date created":
                    UserQuery = Desc ? UserQuery.OrderByDescending(ul => ul.DateCreated) : UserQuery.OrderBy(ul => ul.DateCreated);
                    break;
                case "size":
                    UserQuery = Desc ? UserQuery.OrderByDescending(ul => ul.Films.Count) : UserQuery.OrderBy(ul => ul.Films.Count);
                    break;
                default:
                    //error handling
                    UserQuery = UserQuery.OrderByDescending(ul => ul.DateCreated);
                    break;
            }

            var TotalCount = await UserQuery.CountAsync();
            var Lists = await UserQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();
            return (Lists, TotalCount);
        }

        public async Task<List<UserList>> GetLightweightAsync(Guid UserId) =>
            await _context.UserLists
                .Where(ul => ul.AuthorId == UserId)
                .ToListAsync();

        public async Task<(List<JoinResponse<UserList, User>> Responses, int TotalCount)> GetFeaturingFilmAsync(int FilmId, List<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var FilmQuery = _context.UserLists
                .Include(ul => ul.Films)
                .Where(ul => ul.Films.Any(le => le.FilmId == FilmId))
                .Join(_context.Users, ul => ul.AuthorId, u => u.Id, (ul, u) => new { ul, u })
                .AsQueryable();

            //filtering
            switch (Filter.ToLower())
            {
                case "friends":
                    FilmQuery = FilmQuery.Where(x => UsersFriends!.Contains(x.ul.AuthorId));
                    break;
                default:
                    //error handling
                    break;
            }

            //sorting
            switch (Sort.ToLower())
            {
                case "popularity":
                    FilmQuery = Desc ? FilmQuery.OrderByDescending(x => x.ul.LikeCount) : FilmQuery.OrderBy(x => x.ul.LikeCount);
                    break;
                case "date created":
                    FilmQuery = Desc ? FilmQuery.OrderByDescending(x => x.ul.DateCreated) : FilmQuery.OrderBy(x => x.ul.DateCreated);
                    break;
                case "size":
                    FilmQuery = Desc ? FilmQuery.OrderByDescending(x => x.ul.Films.Count) : FilmQuery.OrderBy(x => x.ul.Films.Count);
                    break;
                default:
                    //error handling
                    FilmQuery = FilmQuery.OrderByDescending(x => x.ul.LikeCount);
                    break;
            }

            var TotalCount = await FilmQuery.CountAsync();
            var Responses = await FilmQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinResponse<UserList, User> { Item = x.ul, Joined = x.u })
                .ToListAsync();
            return (Responses, TotalCount);
        }

        public async Task<int> GetFeaturingFilmCountAsync(int FilmId) =>
            await _context.UserLists
                .Include(ul => ul.Films)
                .Where(ul => ul.Films.Any(le => le.FilmId == FilmId))
                .CountAsync();

        public async Task<(List<JoinResponse<UserList, User>> Results, int TotalCount)> SearchAsync(string Search, int Page, int PageSize)
        {
            var Query = _context.UserLists
                .Include(ul => ul.Films)
                .Join(_context.Users, ul => ul.AuthorId, u => u.Id, (ul, u) => new { ul, u })
                .AsQueryable();

            if (!string.IsNullOrEmpty(Search))
            {
                Query = Query.Where(x =>
                    EF.Functions.TrigramsSimilarity(x.ul.Name, Search) > 0.3f);
            }

            int TotalCount = await Query.CountAsync();

            var Results = await Query
                .OrderByDescending(x => EF.Functions.TrigramsSimilarity(x.ul.Name, Search))
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinResponse<UserList, User> { Item = x.ul, Joined = x.u })
                .ToListAsync();

            return (Results, TotalCount);
        }


        public void Create(UserList UserList)
        {
            _context.UserLists
                .Add(UserList);
        }

        public void CreateEntry(ListEntry ListEntry)
        {
            _context.ListEntries
                .Add(ListEntry);
        }

        public void Update(UserList UserList)
        {
            _context.UserLists
                .Update(UserList);
        }

        public async Task UpdateLikeCountEfCore7Async(Guid ListId, int Delta)
        {
            var Rows = await _context.UserLists
                .Where(ul => ul.Id == ListId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    ul => ul.LikeCount,
                    ul => ul.LikeCount + Delta
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task ToggleNotificationsEfCore7Async(Guid ListId)
        {
            var Rows = await _context.UserLists
                .Where(ul => ul.Id == ListId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    ul => ul.NotificationsOn,
                    ul => !ul.NotificationsOn
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public void Delete(UserList UserList)
        {
            _context.UserLists
                .Remove(UserList);
        }

        public void DeleteEntriesByListId(Guid ListId)
        {
            var Entries = _context.ListEntries
                .Where(le => le.UserListId == ListId);
            _context.ListEntries
                .RemoveRange(Entries);
        }

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
