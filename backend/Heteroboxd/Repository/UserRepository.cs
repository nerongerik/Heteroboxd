using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(Guid Id);
        Task<List<User>> SearchAsync(string Name);

        Task<(List<WatchlistEntry> Entries, int TotalCount)> GetUserWatchlistAsync(Guid UserId, int Page, int PageSize);
        Task<UserFavorites?> GetUserFavoritesAsync(Guid UserId);
        Task<UserWatchedFilm?> GetUserWatchedFilmAsync(Guid UserId, int FilmId);
        Task<User?> GetUserFollowingAsync(Guid UserId);
        Task<User?> GetUserFollowersAsync(Guid UserId);
        Task<User?> GetUserBlockedAsync(Guid UserId);
        Task<User?> GetUserLikedReviewsAsync(Guid UserId);
        Task<User?> GetUserLikedCommentsAsync(Guid UserId);
        Task<User?> GetUserLikedListsAsync(Guid UserId);
        Task ReportUserEfCore7Async(Guid UserId);
        Task AddToWatchlist(WatchlistEntry Entry);
        Task RemoveFromWatchlist(WatchlistEntry Entry);
        Task UpdateLikedReviewsAsync(Guid UserId, Guid ReviewId);
        Task UpdateLikedCommentsAsync(Guid UserId, Guid CommentId);
        Task UpdateLikedListsAsync(Guid UserId, Guid ListId);
        Task FollowUnfollowAsync(Guid UserId, Guid TargetId);
        Task BlockUnblockAsync(Guid UserId, Guid TargetId);

        Task<Review?> IsReviewLikedAsync(Guid UserId, Guid ReviewId);
        Task<Comment?> IsCommentLikedAsync(Guid UserId, Guid CommentId);
        Task<UserList?> IsListLikedAsync(Guid UserId, Guid ListId);
        Task<WatchlistEntry?> IsWatchlistedAsync(int FilmId, Guid UserId);

        void Update(User User);
        void UpdateFavorites(UserFavorites Favorites);
        void CreateUserWatchedFilm(UserWatchedFilm WatchedFilm);
        void UpdateUserWatchedFilm(UserWatchedFilm WatchedFilm);
        void Delete(User User);
        void DeleteUserWatchedFilm(UserWatchedFilm WatchedFilm);
        Task SaveChangesAsync();
    }

    public class UserRepository : IUserRepository
    {
        private readonly HeteroboxdContext _context;

        public UserRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByIdAsync(Guid Id) =>
            await _context.Users
                .Include(u => u.Watchlist).ThenInclude(wl => wl!.Films)
                .Include(u => u.Followers)
                .Include(u => u.Following)
                .Include(u => u.Blocked)
                .Include(u => u.Lists)
                .Include(u => u.Reviews)
                .Include(u => u.LikedComments)
                .Include(u => u.LikedLists)
                .Include(u => u.LikedReviews)
                .Include(u => u.WatchedFilms)
                .FirstOrDefaultAsync(u => u.Id == Id);

        public async Task<List<User>> SearchAsync(string Name)
        {
            var Query = _context.Users.AsQueryable();

            if (!string.IsNullOrEmpty(Name))
            {
                Query = Query.Where(u =>
                    EF.Functions.Like(u.Name.ToLower() ?? "", $"%{Name}%")
                );
            }

            return await Query
                .OrderByDescending(u => u.IsPatron).ThenByDescending(u => u.TierExpiry)
                .ToListAsync();
        }

        public async Task<(List<WatchlistEntry> Entries, int TotalCount)> GetUserWatchlistAsync(Guid UserId, int Page, int PageSize)
        {
            var WatchlistId = await _context.Watchlists
                .Include(wl => wl.Films)
                .Where(wl => wl.UserId == UserId)
                .Select(wl => wl.Id)
                .FirstOrDefaultAsync();
            var EntriesQuery = _context.WatchlistEntries
                .Where(wle => wle.WatchlistId == WatchlistId)
                .OrderByDescending(le => le.DateAdded);
            var TotalCount = await EntriesQuery.CountAsync();
            var Entries = await EntriesQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();
            return (Entries, TotalCount);
        }

        public async Task<UserFavorites?> GetUserFavoritesAsync(Guid UserId) =>
            await _context.UserFavorites
                .FirstOrDefaultAsync(uf => uf.UserId == UserId);

        public async Task<UserWatchedFilm?> GetUserWatchedFilmAsync(Guid UserId, int FilmId) =>
            await _context.UserWatchedFilms
                .FirstOrDefaultAsync(uwf => uwf.UserId == UserId && uwf.FilmId == FilmId);

        public async Task<User?> GetUserFollowingAsync(Guid UserId) =>
            await _context.Users
                .Include(u => u.Following)
                .FirstOrDefaultAsync(u => u.Id == UserId);

        public async Task<User?> GetUserFollowersAsync(Guid UserId) =>
            await _context.Users
                .Include(u => u.Followers)
                .FirstOrDefaultAsync(u => u.Id == UserId);

        public async Task<User?> GetUserBlockedAsync(Guid UserId) =>
            await _context.Users
                .Include(u => u.Blocked)
                .FirstOrDefaultAsync(u => u.Id == UserId);

        public async Task<User?> GetUserLikedReviewsAsync(Guid UserId) =>
            await _context.Users
                .Include(u => u.LikedReviews)
                .FirstOrDefaultAsync(u => u.Id == UserId);


        public async Task<User?> GetUserLikedCommentsAsync(Guid UserId) =>
            await _context.Users
                .Include(u => u.LikedComments)
                .FirstOrDefaultAsync(u => u.Id == UserId);

        public async Task<User?> GetUserLikedListsAsync(Guid UserId) =>
            await _context.Users
                .Include(u => u.LikedLists)
                .FirstOrDefaultAsync(u => u.Id == UserId);

        public async Task ReportUserEfCore7Async(Guid UserId)
        {
            var Rows = await _context.Users
                .Where(u => u.Id == UserId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    u => u.Flags,
                    u => u.Flags + 1
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task AddToWatchlist(WatchlistEntry Entry)
        {
            _context.WatchlistEntries.Add(Entry);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveFromWatchlist(WatchlistEntry Entry)
        {
            _context.WatchlistEntries.Remove(Entry);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateLikedReviewsAsync(Guid UserId, Guid ReviewId)
        {
            var User = await _context.Users
                .Include(u => u.LikedReviews)
                .FirstOrDefaultAsync(u => u.Id == UserId);
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
                .FirstOrDefaultAsync(u => u.Id == UserId);
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
                .FirstOrDefaultAsync(u => u.Id == UserId);
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
                .FirstOrDefaultAsync(u => u.Id == UserId);
            var Target = await _context.Users
                .Include (u => u.Followers)
                .FirstOrDefaultAsync(u => u.Id == TargetId);
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
                .FirstOrDefaultAsync(u => u.Id == UserId);
            var Target = await _context.Users
                .Include (u => u.Following)
                .Include (u => u.Followers)
                .FirstOrDefaultAsync(u => u.Id == TargetId);
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

        public async Task<Review?> IsReviewLikedAsync(Guid UserId, Guid ReviewId)
        {
            var User = await _context.Users
                .Include(u => u.LikedReviews)
                .FirstOrDefaultAsync(u => u.Id == UserId);
            if (User == null) return null;
            var Review = User.LikedReviews.FirstOrDefault(r => r.Id == ReviewId);
            return Review;
        }

        public async Task<Comment?> IsCommentLikedAsync(Guid UserId, Guid CommentId)
        {
            var User = await _context.Users
                .Include(u => u.LikedComments)
                .FirstOrDefaultAsync(u => u.Id == UserId);
            if (User == null) return null;
            var Comment = User.LikedComments.FirstOrDefault(c => c.Id == CommentId);
            return Comment;
        }

        public async Task<UserList?> IsListLikedAsync(Guid UserId, Guid ListId)
        {
            var User = await _context.Users
                .Include(u => u.LikedLists)
                .FirstOrDefaultAsync(u => u.Id == UserId);
            if (User == null) return null;
            var UserList = User.LikedLists.FirstOrDefault(ul => ul.Id == ListId);
            return UserList;
        }

        public async Task<WatchlistEntry?> IsWatchlistedAsync(int FilmId, Guid UserId) =>
            await _context.WatchlistEntries
                .FirstOrDefaultAsync(wle => wle.FilmId == FilmId && wle.UserId == UserId);

        public void Update(User User) =>
            _context.Users.Update(User);

        public void UpdateFavorites(UserFavorites Favorites) =>
            _context.UserFavorites.Update(Favorites);

        public void CreateUserWatchedFilm(UserWatchedFilm WatchedFilm) =>
            _context.UserWatchedFilms.Add(WatchedFilm);

        public void UpdateUserWatchedFilm(UserWatchedFilm WatchedFilm) =>
            _context.UserWatchedFilms.Update(WatchedFilm);

        public void Delete(User User) =>
            _context.Users.Remove(User);

        public void DeleteUserWatchedFilm(UserWatchedFilm WatchedFilm) =>
            _context.UserWatchedFilms.Remove(WatchedFilm);

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
