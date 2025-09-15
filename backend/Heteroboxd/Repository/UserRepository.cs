using Heteroboxd.Data;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
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
        Task<List<User>> GetAllAsync();
        Task<User?> GetByIdAsync(Guid Id);
        /*Task<Watchlist> GetUserWatchlistAsync(Guid UserId);
        Task<UserFavorites> GetUserFavoritesAsync(Guid UserId);
        Task<List<User>> GetFollowing(Guid UserId);
        Task<List<User>> GetFollowers(Guid UserId);
        Task<List<User>> GetBlocked(Guid UserId);
        Task<List<Report>> GetUserReportsAsync(Guid UserId);
        Task<List<Review>> GetUserLikedReviewsAsync(Guid UserId);
        Task<List<Comment>> GetUserLikedCommentsAsync(Guid UserId);
        Task<List<UserList>> GetUserLikedListsAsync(Guid UserId);
        Task<List<User>> SearchAsync(string Name);
        void CreateReport(Report Report);
        void Update(User User);
        void UpdateWatchlist(Watchlist Watchlist);
        void UpdateFavorites(UserFavorites Favorites);
        void UpdateUserFollowing(User User, User Target);
        void UpdateUserFollowers(User User, User Target);
        void UpdateUserBlocked(User User, User Target);
        void UpdateUserLikedReviews(User User, Review Review);
        void UpdateUserLikedComments(User User, Comment Comment);
        void UpdateUserLikedLists(User User, UserList List);
        void CreateUserWatchedFilm(UserWatchedFilm WatchedFilm);
        void UpdateUserWatchedFilm(UserWatchedFilm WatchedFilm);
        void DeleteUser(User User);
        Task SaveChangesAsync();*/
    }

    public class UserRepository : IUserRepository
    {
        private readonly HeteroboxdContext _context;

        public UserRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<List<User>> GetAllAsync() =>
            await _context.Users
                .Where(u => !u.Deleted)
                .ToListAsync();

        public async Task<User?> GetByIdAsync(Guid Id) =>
            await _context.Users
                .FirstOrDefaultAsync(u => u.Id == Id && !u.Deleted);
    }
}
