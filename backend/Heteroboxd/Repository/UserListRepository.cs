using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface IUserListRepository
    {
        Task<UserList?> GetByIdAsync(Guid ListId);
        Task<(List<ListEntry> ListEntries, int TotalCount)> GetEntriesByIdAsync(Guid ListId, int Page, int PageSize); //view
        Task<List<ListEntry>> PowerGetEntriesAsync(Guid ListId); //update
        Task<(List<UserList> Lists, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize);
        Task<List<UserList>> GetLightweightAsync(Guid UserId);
        Task<(List<UserList> Lists, int TotalCount)> GetFeaturingFilmAsync(int FilmId, int Page, int PageSize);
        Task<int> GetFeaturingFilmCountAsync(int FilmId);
        Task<List<UserList>> SearchAsync(string Search);
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

        public async Task<UserList?> GetByIdAsync(Guid ListId) =>
            await _context.UserLists
                .FirstOrDefaultAsync(ul => ul.Id == ListId);

        public async Task<(List<ListEntry> ListEntries, int TotalCount)> GetEntriesByIdAsync(Guid ListId, int Page, int PageSize)
        {
            var EntryQuery = _context.ListEntries
                .Where(le => le.UserListId == ListId)
                .OrderBy(le => le.Position);

            var TotalCount = await EntryQuery.CountAsync();

            var Entries = await EntryQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            return (Entries, TotalCount);
        }

        public async Task<List<ListEntry>> PowerGetEntriesAsync(Guid ListId) =>
            await _context.ListEntries
                .Where(le => le.UserListId == ListId)
                .OrderBy(le => le.Position)
                .ToListAsync();

        public async Task<(List<UserList> Lists, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize)
        {
            var UserQuery = _context.UserLists
                .Include(ul => ul.Films)
                .Where(ul => ul.AuthorId == UserId)
                .OrderByDescending(f => f.DateCreated);

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

        public async Task<(List<UserList> Lists, int TotalCount)> GetFeaturingFilmAsync(int FilmId, int Page, int PageSize)
        {
            var FilmQuery = _context.UserLists
                .Include(ul => ul.Films)
                .Where(ul => ul.Films.Any(le => le.FilmId == FilmId))
                .OrderByDescending(f => f.DateCreated);

            var TotalCount = await FilmQuery.CountAsync();

            var Lists = await FilmQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            return (Lists, TotalCount);
        }

        public async Task<int> GetFeaturingFilmCountAsync(int FilmId) =>
            await _context.UserLists
                .Include(ul => ul.Films)
                .Where(ul => ul.Films.Any(le => le.FilmId == FilmId))
                .CountAsync();

        public async Task<List<UserList>> SearchAsync(string Search)
        {
            var Query = _context.UserLists.AsQueryable();

            if (!string.IsNullOrEmpty(Search))
            {
                Query = Query.Where(ul =>
                    EF.Functions.TrigramsSimilarity(ul.Name, Search) > 0.3f);
            }

            return await Query
                .OrderByDescending(ul => EF.Functions.TrigramsSimilarity(ul.Name, Search))
                .ToListAsync();
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
