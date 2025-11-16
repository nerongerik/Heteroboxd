using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface IUserListRepository
    {
        Task<List<UserList>> GetAllAsync(CancellationToken CancellationToken = default);
        Task<UserList?> GetByIdAsync(Guid ListId);
        Task<List<UserList>> GetByUserAsync(Guid UserId);
        Task<List<UserList>> GetFeaturingFilmAsync(int FilmId);
        Task<List<UserList>> SearchAsync(string Search);
        void Create(UserList UserList);
        void Update(UserList UserList);
        Task UpdateLikeCountEfCore7Async(Guid ListId, int Delta);
        Task ToggleNotificationsEfCore7Async(Guid ListId);
        void Delete(UserList UserList);
        Task SaveChangesAsync();
    }

    public class UserListRepository : IUserListRepository
    {
        private readonly HeteroboxdContext _context;

        public UserListRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<List<UserList>> GetAllAsync(CancellationToken CancellationToken = default) =>
            await _context.UserLists
                .Where(ul => !ul.Deleted)
                .ToListAsync(CancellationToken);

        public async Task<UserList?> GetByIdAsync(Guid ListId) =>
            await _context.UserLists
                .Include(ul => ul.Films)
                .FirstOrDefaultAsync(ul => ul.Id == ListId && !ul.Deleted);

        public async Task<List<UserList>> GetByUserAsync(Guid UserId) =>
            await _context.UserLists
                .Include(ul => ul.Films)
                .Where(ul => ul.AuthorId == UserId && !ul.Deleted)
                .ToListAsync();

        public async Task<List<UserList>> GetFeaturingFilmAsync(int FilmId) =>
            await _context.UserLists
                .Where(ul => ul.Films.Any(le => le.FilmId == FilmId) && !ul.Deleted)
                .ToListAsync();

        public async Task<List<UserList>> SearchAsync(string Search)
        {
            var query = _context.UserLists.AsQueryable();
            if (!string.IsNullOrEmpty(Search))
                query = query
                    .Where(ul => EF.Functions.Like(ul.Name, $"%{Search}%"));
            return await query
                .Where(ul => !ul.Deleted)
                .ToListAsync();
        }

        public void Create(UserList UserList)
        {
            _context.UserLists
                .Add(UserList);
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

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
