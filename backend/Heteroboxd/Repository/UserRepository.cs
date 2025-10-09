using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

/*
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 NOTE: IF YOU FIND THAT SEARCH MALFUNCTIONS, IT WILL MOST LIKELY BE DUE TO CASE SENSITIVITY
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 *
*/

namespace Heteroboxd.Repository
{
    public interface IUserRepository
    {
        Task<List<User>> GetAllAsync(CancellationToken CancellationToken = default);
        Task<User?> GetByIdAsync(Guid Id);
        Task<Watchlist?> GetUserWatchlistAsync(Guid UserId);
        Task<UserFavorites?> GetUserFavoritesAsync(Guid UserId);
        Task<UserWatchedFilm?> GetUserWatchedFilmAsync(Guid UserId, Guid FilmId);
        Task<User?> GetFollowing(Guid UserId);
        Task<User?> GetFollowers(Guid UserId);
        Task<User?> GetBlocked(Guid UserId);
        Task<List<Report>> GetUserReportsAsync(Guid UserId);
        Task<User?> GetUserLikedReviewsAsync(Guid UserId);
        Task<User?> GetUserLikedCommentsAsync(Guid UserId);
        Task<User?> GetUserLikedListsAsync(Guid UserId);
        Task<List<User>> SearchAsync(string Name);
        void CreateReport(Report Report);
        void Update(User User);
        void UpdateWatchlist(Watchlist Watchlist);
        void UpdateFavorites(UserFavorites Favorites);
        void CreateUserWatchedFilm(UserWatchedFilm WatchedFilm);
        void UpdateUserWatchedFilm(UserWatchedFilm WatchedFilm);
        Task UpdateLikedReviewsAsync(Guid UserId, Guid ReviewId);
        Task UpdateLikedCommentsAsync(Guid UserId, Guid CommentId);
        Task UpdateLikedListsAsync(Guid UserId, Guid ListId);
        Task FollowUnfollowAsync(Guid UserId, Guid TargetId);
        Task BlockUnblockAsync(Guid UserId, Guid TargetId);
        void DeleteUser(User User);
        Task SaveChangesAsync();
    }

    public class UserRepository : IUserRepository
    {
        private readonly HeteroboxdContext _context;

        public UserRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<List<User>> GetAllAsync(CancellationToken CancellationToken = default) =>
            await _context.Users
                .Where(u => !u.Deleted)
                .ToListAsync(CancellationToken);

        public async Task<User?> GetByIdAsync(Guid Id) =>
            await _context.Users
                .FirstOrDefaultAsync(u => u.Id == Id && !u.Deleted);

        public async Task<Watchlist?> GetUserWatchlistAsync(Guid UserId) =>
            await _context.Watchlists
                .Include(wl => wl.Films)
                .FirstOrDefaultAsync(wl => wl.UserId == UserId);

        public async Task<UserFavorites?> GetUserFavoritesAsync(Guid UserId) => //if it fails to fetch ids, explicitally .Include() them
            await _context.UserFavorites
                .FirstOrDefaultAsync(uf => uf.UserId == UserId);

        public async Task<UserWatchedFilm?> GetUserWatchedFilmAsync(Guid UserId, Guid FilmId) =>
            await _context.UserWatchedFilms
                .FirstOrDefaultAsync(uwf => uwf.UserId == UserId && uwf.FilmId == FilmId && uwf.TimesWatched != 0);

        public async Task<User?> GetFollowing(Guid UserId) =>
            await _context.Users
                .Include(u => u.Following)
                .FirstOrDefaultAsync(u => u.Id == UserId && !u.Deleted);

        public async Task<User?> GetFollowers(Guid UserId) =>
            await _context.Users
                .Include(u => u.Followers)
                .FirstOrDefaultAsync(u => u.Id == UserId && !u.Deleted);

        public async Task<User?> GetBlocked(Guid UserId) =>
            await _context.Users
                .Include(u => u.Blocked)
                .FirstOrDefaultAsync(u => u.Id == UserId && !u.Deleted);

        public async Task<List<Report>> GetUserReportsAsync(Guid UserId) =>
            await _context.Reports
                .Where(r => r.TargetId == UserId && !r.Deleted)
                .ToListAsync();

        public async Task<User?> GetUserLikedReviewsAsync(Guid UserId) =>
            await _context.Users
                .Include(u => u.LikedReviews)
                .FirstOrDefaultAsync(u => u.Id == UserId && !u.Deleted);

        public async Task<User?> GetUserLikedCommentsAsync(Guid UserId) =>
            await _context.Users
                .Include(u => u.LikedComments)
                .FirstOrDefaultAsync(u => u.Id == UserId && !u.Deleted);

        public async Task<User?> GetUserLikedListsAsync(Guid UserId) =>
            await _context.Users
                .Include(u => u.LikedLists)
                .FirstOrDefaultAsync(u => u.Id == UserId && !u.Deleted);

        public async Task<List<User>> SearchAsync(string Name)
        {
            var query = _context.Users.AsQueryable();
            if (!string.IsNullOrEmpty(Name))
                query = query
                    .Where(u => EF.Functions.Like(u.Name, $"%{Name}%"));
            return await query
                .Where(u => !u.Deleted)
                .ToListAsync();
        }

        public void CreateReport(Report Report) =>
            _context.Reports.Add(Report);

        public void Update(User User) =>
            _context.Users.Update(User);

        public void UpdateWatchlist(Watchlist Watchlist) =>
            _context.Watchlists.Update(Watchlist);

        public void UpdateFavorites(UserFavorites Favorites) =>
            _context.UserFavorites.Update(Favorites);

        public void CreateUserWatchedFilm(UserWatchedFilm WatchedFilm) =>
            _context.UserWatchedFilms.Add(WatchedFilm);

        public void UpdateUserWatchedFilm(UserWatchedFilm WatchedFilm) =>
            _context.UserWatchedFilms.Update(WatchedFilm);

        public async Task UpdateLikedReviewsAsync(Guid UserId, Guid ReviewId)
        {
            var User = await _context.Users
                .Include(u => u.LikedReviews)
                .FirstOrDefaultAsync(u => u.Id == UserId && !u.Deleted);
            var Review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == ReviewId);
            if (User == null || Review == null) throw new KeyNotFoundException();
            if (User.LikedReviews.Any(r => r.Id == ReviewId)) User.LikedReviews.Remove(Review);
            else User.LikedReviews.Add(Review);
        }

        public async Task UpdateLikedCommentsAsync(Guid UserId, Guid CommentId)
        {
            var User = await _context.Users
                .Include(u => u.LikedComments)
                .FirstOrDefaultAsync(u => u.Id == UserId && !u.Deleted);
            var Comment = await _context.Comments
                .FirstOrDefaultAsync(c => c.Id == CommentId);
            if (User == null || Comment == null) throw new KeyNotFoundException();
            if (User.LikedComments.Any(c => c.Id == CommentId)) User.LikedComments.Remove(Comment);
            else User.LikedComments.Add(Comment);
        }

        public async Task UpdateLikedListsAsync(Guid UserId, Guid ListId)
        {
            var User = await _context.Users
                .Include(u => u.LikedLists)
                .FirstOrDefaultAsync(u => u.Id == UserId && !u.Deleted);
            var UserList = await _context.UserLists
                .FirstOrDefaultAsync(ul => ul.Id == ListId);
            if (User == null || UserList == null) throw new KeyNotFoundException();
            if (User.LikedLists.Any(ul => ul.Id == ListId)) User.LikedLists.Remove(UserList);
            else User.LikedLists.Add(UserList);
        }

        public async Task FollowUnfollowAsync(Guid UserId, Guid TargetId)
        {
            var User = await _context.Users
                .Include(u => u.Following)
                .FirstOrDefaultAsync(u => u.Id == UserId && !u.Deleted);
            var Target = await _context.Users
                .Include (u => u.Followers)
                .FirstOrDefaultAsync(u => u.Id == TargetId && !u.Deleted);
            if (User == null ||  Target == null) throw new KeyNotFoundException();
            if (User.Following.Any(u => u.Id == TargetId))
            {
                User.Following.Remove(Target);
                Target.Followers.Remove(User);
            }
            else
            {
                User.Following.Add(Target);
                Target.Followers.Add(User);
            }
        }

        public async Task BlockUnblockAsync(Guid UserId, Guid TargetId)
        {
            var User = await _context.Users
                .Include(u => u.Blocked)
                .Include(u => u.Following)
                .Include(u => u.Followers)
                .FirstOrDefaultAsync(u => u.Id == UserId && !u.Deleted);
            var Target = await _context.Users
                .Include (u => u.Following)
                .Include (u => u.Followers)
                .FirstOrDefaultAsync(u => u.Id == TargetId && !u.Deleted);
            if (User == null || Target == null) throw new KeyNotFoundException();
            if (User.Blocked.Any(u => u.Id == TargetId))
            {
                User.Blocked.Remove(Target);
            }
            else
            {
                User.Blocked.Add(Target);
                User.Following.Remove(Target);
                User.Followers.Remove(Target);
                Target.Following.Remove(User);
                Target.Followers.Remove(User);
            }
        }

        public void DeleteUser(User User) =>
            _context.Users.Remove(User);

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
