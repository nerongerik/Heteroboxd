using Heteroboxd.Data;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public record RelationshipStatus(bool IsBlocked, bool IsFollowing, bool IsFollower);

    public interface IUserRepository
    {
        Task<(List<User> Users, int TotalCount)> GetAllAsync(int Page, int PageSize);
        Task<User?> GetByIdAsync(Guid Id);
        Task<User?> LightweightFetcherAsync(Guid Id);
        Task<Dictionary<double, int>> GetRatingsAsync(Guid UserId);
        Task<(List<User> Results, int TotalCount)> SearchAsync(string Search, int Page, int PageSize);

        Task<(List<WatchlistEntry> Entries, int TotalCount)> GetUserWatchlistAsync(Guid UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<UserFavorites?> GetUserFavoritesAsync(Guid UserId);
        Task<UserWatchedFilm?> GetUserWatchedFilmAsync(Guid UserId, int FilmId);
        Task<(List<User> Friends, List<Review> ExistingReviews)> GetFriendsForFilmAsync(Guid UserId, int FilmId);
        Task<(List<User> Following, int FollowingCount, List<User> Followers, int FollowersCount, List<User> Blocked, int BlockedCount)> GetUserRelationshipsAsync(Guid UserId, int FollowingPage, int FollowersPage, int BlockedPage, int PageSize);
        Task<List<Guid>> GetFriendsAsync(Guid UserId);
        Task<RelationshipStatus?> GetRelationshipStatusAsync(Guid UserId, Guid TargetId);
        Task<(List<JoinResponse<JoinedReviewFilm, User>> ReviewResponses, int ReviewCount, List<JoinResponse<UserList, User>> ListResponses, int ListCount)> GetUserLikedAsync(Guid UserId, int ReviewsPage, int ListsPage, int PageSize);
        Task ReportAsync(Guid UserId);
        Task AddToWatchlistAsync(WatchlistEntry Entry);
        Task RemoveFromWatchlistAsync(Guid WeId);
        Task UpdateLikedReviewsAsync(Guid UserId, Guid ReviewId);
        Task UpdateLikedListsAsync(Guid UserId, Guid ListId);
        Task<(bool SendNotif, string UserName)> FollowUnfollowAsync(Guid UserId, Guid TargetId);
        Task BlockUnblockAsync(Guid UserId, Guid TargetId);

        Task<Review?> IsReviewLikedAsync(Guid UserId, Guid ReviewId);
        Task<UserList?> IsListLikedAsync(Guid UserId, Guid ListId);
        Task<(WatchlistEntry? Entry, Guid WatchlistId)> IsWatchlistedAsync(int FilmId, Guid UserId);

        Task UpdateAsync(User User);
        Task UpdateFavoritesAsync(UserFavorites Favorites);
        Task CreateUserWatchedFilmAsync(UserWatchedFilm WatchedFilm);
        Task UpdateUserWatchedFilmAsync(UserWatchedFilm WatchedFilm);
        Task DeleteAsync(Guid UserId);
        Task DeleteUserWatchedFilmAsync(Guid UwfId);
    }

    public class UserRepository : IUserRepository
    {
        private readonly HeteroboxdContext _context;

        public UserRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<(List<User> Users, int TotalCount)> GetAllAsync(int Page, int PageSize)
        {
            var Query = _context.Users
                .AsNoTracking()
                .Where(u => !u.IsAdmin)
                .OrderByDescending(u => u.Flags)
                .AsQueryable();

            var TotalCount = await Query.CountAsync();
            var Users = await Query
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            return (Users, TotalCount);
        }

        public async Task<User?> GetByIdAsync(Guid Id) =>
            await _context.Users
                .AsNoTracking()
                .AsSplitQuery()
                .Include(u => u.Watchlist).ThenInclude(wl => wl!.Films)
                .Include(u => u.Followers)
                .Include(u => u.Following)
                .Include(u => u.Blocked)
                .Include(u => u.Lists)
                .Include(u => u.Reviews)
                .Include(u => u.LikedLists)
                .Include(u => u.LikedReviews)
                .Include(u => u.WatchedFilms)
                .FirstOrDefaultAsync(u => u.Id == Id);

        public async Task<User?> LightweightFetcherAsync(Guid Id) =>
            await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == Id);

        public async Task<Dictionary<double, int>> GetRatingsAsync(Guid UserId) =>
            await _context.Reviews
                .AsNoTracking()
                .Where(r => r.AuthorId == UserId)
                .GroupBy(r => r.Rating)
                .Select(g => new { Rating = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Rating, x => x.Count);

        public async Task<(List<User> Results, int TotalCount)> SearchAsync(string Search, int Page, int PageSize)
        {
            var Query = _context.Users
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrEmpty(Search))
            {
                Query = Query.Where(u =>
                    EF.Functions.TrigramsSimilarity(u.Name, Search) > 0.3f);
            }

            int TotalCount = await Query.CountAsync();
            var Results = await Query
                .OrderByDescending(u => EF.Functions.TrigramsSimilarity(u.Name, Search))
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            return (Results, TotalCount);
        }

        public async Task<(List<WatchlistEntry> Entries, int TotalCount)> GetUserWatchlistAsync(Guid UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var WatchlistId = await _context.Watchlists
                .AsNoTracking()
                .Where(wl => wl.UserId == UserId)
                .Select(wl => wl.Id)
                .FirstOrDefaultAsync();

            var EntriesQuery = _context.WatchlistEntries
                .AsNoTracking()
                .Where(wle => wle.WatchlistId == WatchlistId)
                .Join(_context.Films, wle => wle.FilmId, f => f.Id, (wle, f) => new { Entry = wle, Film = f });

            //filtering
            switch (Filter.ToLower())
            {
                case "genre":
                    EntriesQuery = EntriesQuery.Where(x => x.Film.Genres.Contains(FilterValue!));
                    break;
                case "year":
                    EntriesQuery = EntriesQuery.Where(x => x.Film.ReleaseYear == int.Parse(FilterValue!));
                    break;
                case "country":
                    EntriesQuery = EntriesQuery.Where(x => x.Film.Country.Contains(FilterValue!));
                    break;
                default:
                    //error fallback
                    break;
            }

            //sorting
            switch (Sort.ToLower())
            {
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
                    EntriesQuery = EntriesQuery.OrderByDescending(x => x.Entry.DateAdded);
                    break;
            }

            var TotalCount = await EntriesQuery.CountAsync();
            var Entries = await EntriesQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => x.Entry)
                .ToListAsync();

            return (Entries, TotalCount);
        }

        public async Task<UserFavorites?> GetUserFavoritesAsync(Guid UserId) =>
            await _context.UserFavorites
                .AsNoTracking()
                .FirstOrDefaultAsync(uf => uf.UserId == UserId);

        public async Task<UserWatchedFilm?> GetUserWatchedFilmAsync(Guid UserId, int FilmId) =>
            await _context.UserWatchedFilms
                .AsNoTracking()
                .FirstOrDefaultAsync(uwf => uwf.UserId == UserId && uwf.FilmId == FilmId);

        public async Task<(List<User> Friends, List<Review> ExistingReviews)> GetFriendsForFilmAsync(Guid UserId, int FilmId)
        {
            var FriendIds = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == UserId)
                .SelectMany(u => u.Following)
                .Where(f => f.WatchedFilms.Any(uwf => uwf.FilmId == FilmId))
                .Select(f => f.Id)
                .ToListAsync();

            if (FriendIds.Count == 0)
            {
                return (new List<User>(), new List<Review>());
            }

            var Friends = await _context.Users
                .AsNoTracking()
                .Where(u => FriendIds.Contains(u.Id))
                .Select(f => new User
                {
                    Id = f.Id,
                    Name = f.Name,
                    PictureUrl = f.PictureUrl,
                    WatchedFilms = f.WatchedFilms.Where(uwf => uwf.FilmId == FilmId).ToList()
                })
                .ToListAsync();

            var Reviews = await _context.Reviews
                .AsNoTracking()
                .Where(r => FriendIds.Contains(r.AuthorId) && r.FilmId == FilmId)
                .ToListAsync();

            return (Friends, Reviews);
        }

        public async Task<(List<User> Following, int FollowingCount, List<User> Followers, int FollowersCount, List<User> Blocked, int BlockedCount)> GetUserRelationshipsAsync(Guid UserId, int FollowingPage, int FollowersPage, int BlockedPage, int PageSize)
        {
            var FollowingQuery = _context.Users
                .AsNoTracking()
                .Where(u => u.Id == UserId)
                .SelectMany(u => u.Following);
            var FollowersQuery = _context.Users
                .AsNoTracking()
                .Where(u => u.Id == UserId)
                .SelectMany(u => u.Followers);
            var BlockedQuery = _context.Users
                .AsNoTracking()
                .Where(u => u.Id == UserId)
                .SelectMany(u => u.Blocked);

            var FollowingCount = await FollowingQuery.CountAsync();
            var FollowersCount = await FollowersQuery.CountAsync();
            var BlockedCount = await BlockedQuery.CountAsync();

            var Following = await FollowingQuery
                .Skip((FollowingPage - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();
            var Followers = await FollowersQuery
                .Skip((FollowersPage - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();
            var Blocked = await BlockedQuery
                .Skip((BlockedPage - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            return (Following, FollowingCount, Followers, FollowersCount, Blocked, BlockedCount);
        }

        public async Task<List<Guid>> GetFriendsAsync(Guid UserId) =>
            await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == UserId)
                .SelectMany(u => u.Following)
                .Select(f => f.Id)
                .ToListAsync();

        public async Task<RelationshipStatus?> GetRelationshipStatusAsync(Guid UserId, Guid TargetId) =>
            await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == UserId)
                .Select(u => new RelationshipStatus(
                    u.Blocked.Any(b => b.Id == TargetId),
                    u.Following.Any(f => f.Id == TargetId),
                    u.Followers.Any(f => f.Id == TargetId)
                ))
                .FirstOrDefaultAsync();

        public async Task<(List<JoinResponse<JoinedReviewFilm, User>> ReviewResponses, int ReviewCount, List<JoinResponse<UserList, User>> ListResponses, int ListCount)> GetUserLikedAsync(Guid UserId, int ReviewsPage, int ListsPage, int PageSize)
        {
            var ReviewsQuery = _context.Users
                .AsNoTracking()
                .Where(u => u.Id == UserId)
                .SelectMany(u => u.LikedReviews)
                .Join(_context.Films, r => r.FilmId, f => f.Id, (r, f) => new { r, f })
                .Join(_context.Users, x => x.r.AuthorId, u => u.Id, (x, u) => new { x.r, x.f, u })
                .OrderByDescending(x => x.r.LikeCount);

            var ListsQuery = _context.Users
                .AsNoTracking()
                .Where(u => u.Id == UserId)
                .SelectMany(u => u.LikedLists)
                .Include(ul => ul.Films)
                .Join(_context.Users, ul => ul.AuthorId, u => u.Id, (ul, u) => new { ul, u })
                .OrderByDescending(x => x.ul.LikeCount);

            var ReviewCount = await ReviewsQuery.CountAsync();
            var ListCount = await ListsQuery.CountAsync();

            var ReviewResponses = await ReviewsQuery
                .Skip((ReviewsPage - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinResponse<JoinedReviewFilm, User> { Item = new JoinedReviewFilm(x.r, x.f), Joined = x.u })
                .ToListAsync();

            var ListResponses = await ListsQuery
                .Skip((ListsPage - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinResponse<UserList, User> { Item = x.ul, Joined = x.u })
                .ToListAsync();

            return (ReviewResponses, ReviewCount, ListResponses, ListCount);
        }

        public async Task ReportAsync(Guid UserId)
        {
            var Rows = await _context.Users
                .Where(u => u.Id == UserId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    u => u.Flags,
                    u => u.Flags + 1
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task AddToWatchlistAsync(WatchlistEntry Entry)
        {
            _context.WatchlistEntries.Add(Entry);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveFromWatchlistAsync(Guid WeId) =>
            await _context.WatchlistEntries
                .Where(wle => wle.Id == WeId)
                .ExecuteDeleteAsync();

        public async Task UpdateLikedReviewsAsync(Guid UserId, Guid ReviewId)
        {
            var User = await _context.Users
                .AsNoTracking()
                .Include(u => u.LikedReviews)
                .FirstOrDefaultAsync(u => u.Id == UserId);
            var Review = await _context.Reviews
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == ReviewId);
            if (User == null || Review == null) throw new KeyNotFoundException();
            if (User.LikedReviews.Any(r => r.Id == ReviewId)) User.LikedReviews.Remove(Review);
            else User.LikedReviews.Add(Review);
            await UpdateAsync(User);
        }

        public async Task UpdateLikedListsAsync(Guid UserId, Guid ListId)
        {
            var User = await _context.Users
                .AsNoTracking()
                .Include(u => u.LikedLists)
                .FirstOrDefaultAsync(u => u.Id == UserId);
            var UserList = await _context.UserLists
                .AsNoTracking()
                .FirstOrDefaultAsync(ul => ul.Id == ListId);
            if (User == null || UserList == null) throw new KeyNotFoundException();
            if (User.LikedLists.Any(ul => ul.Id == ListId)) User.LikedLists.Remove(UserList);
            else User.LikedLists.Add(UserList);
            await UpdateAsync(User);
        }

        public async Task<(bool SendNotif, string UserName)> FollowUnfollowAsync(Guid UserId, Guid TargetId)
        {
            var User = await _context.Users
                .AsNoTracking()
                .Include(u => u.Following)
                .FirstOrDefaultAsync(u => u.Id == UserId);
            var Target = await _context.Users
                .AsNoTracking()
                .Include (u => u.Followers)
                .FirstOrDefaultAsync(u => u.Id == TargetId);
            if (User == null ||  Target == null) throw new KeyNotFoundException();
            if (User.Following.Any(u => u.Id == TargetId))
            {
                User.Following.Remove(Target);
                Target.Followers.Remove(User);
                await UpdateAsync(User);
                await UpdateAsync(Target);
                return (false, "");
            }
            else
            {
                User.Following.Add(Target);
                Target.Followers.Add(User);
                await UpdateAsync(User);
                await UpdateAsync(Target);
                return (true, User.Name);
            }
        }

        public async Task BlockUnblockAsync(Guid UserId, Guid TargetId)
        {
            var User = await _context.Users
                .AsSplitQuery()
                .AsNoTracking()
                .Include(u => u.Blocked)
                .Include(u => u.Following)
                .Include(u => u.Followers)
                .FirstOrDefaultAsync(u => u.Id == UserId);
            var Target = await _context.Users
                .AsSplitQuery()
                .AsNoTracking()
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
                await UpdateAsync(Target);
            }
            await UpdateAsync(User);
        }

        public async Task<Review?> IsReviewLikedAsync(Guid UserId, Guid ReviewId)
        {
            var User = await _context.Users
                .AsNoTracking()
                .Include(u => u.LikedReviews)
                .FirstOrDefaultAsync(u => u.Id == UserId);
            if (User == null) return null;
            var Review = User.LikedReviews.FirstOrDefault(r => r.Id == ReviewId);
            return Review;
        }

        public async Task<UserList?> IsListLikedAsync(Guid UserId, Guid ListId)
        {
            var User = await _context.Users
                .AsNoTracking()
                .Include(u => u.LikedLists)
                .FirstOrDefaultAsync(u => u.Id == UserId);
            if (User == null) return null;
            var UserList = User.LikedLists.FirstOrDefault(ul => ul.Id == ListId);
            return UserList;
        }

        public async Task<(WatchlistEntry? Entry, Guid WatchlistId)> IsWatchlistedAsync(int FilmId, Guid UserId)
        {
            var Entry = await _context.WatchlistEntries
                .AsNoTracking()
                .FirstOrDefaultAsync(wle => wle.FilmId == FilmId && wle.UserId == UserId);
            return (Entry, Entry != null ? Entry.WatchlistId : await _context.Watchlists.Where(w => w.UserId == UserId).Select(w => w.Id).FirstOrDefaultAsync());
        }

        public async Task UpdateAsync(User User)
        {
            _context.Users.Update(User);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateFavoritesAsync(UserFavorites Favorites)
        {
            _context.UserFavorites.Update(Favorites);
            await _context.SaveChangesAsync();
        }

        public async Task CreateUserWatchedFilmAsync(UserWatchedFilm WatchedFilm)
        {
            _context.UserWatchedFilms.Add(WatchedFilm);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateUserWatchedFilmAsync(UserWatchedFilm WatchedFilm)
        {
            _context.UserWatchedFilms.Update(WatchedFilm);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid UserId) =>
            await _context.Users
                .Where(u => u.Id == UserId)
                .ExecuteDeleteAsync();

        public async Task DeleteUserWatchedFilmAsync(Guid UwfId) =>
            await _context.UserWatchedFilms
                .Where(uwf => uwf.Id == UwfId)
                .ExecuteDeleteAsync();
    }
}
