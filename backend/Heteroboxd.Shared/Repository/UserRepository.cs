using Heteroboxd.Shared.Data;
using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Models.DTO;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Heteroboxd.Shared.Repository
{
    public interface IUserRepository
    {
        Task<(List<User> Users, int TotalCount)> GetAllAsync(int Page, int PageSize);
        Task<(User? User, int WatchlistCount, int UserListCount, int ReviewCount, int WatchedFilmCount, int LikesCount, int FollowerCount, int FollowingCount, int BlockedCount)> GetByIdAsync(Guid Id);
        Task<User?> LightweightFetcherAsync(Guid Id);
        Task<Dictionary<double, int>> GetRatingsAsync(Guid UserId);
        Task<(List<User> Results, int TotalCount)> SearchAsync(string Search, int Page, int PageSize);

        Task<(List<JoinResponse<WatchlistEntry, Film>> Responses, int TotalCount)> GetUserWatchlistAsync(Guid UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<(List<JoinResponse<WatchlistEntry, Film>> Responses, int TotalCount)> ShuffleWatchlistAsync(Guid UserId, int PageSize);
        Task<UserFavorites?> GetUserFavoritesAsync(Guid UserId);
        Task<UserWatchedFilm?> GetUserWatchedFilmAsync(Guid UserId, int FilmId);
        Task<(List<User> Friends, List<Review> ExistingReviews)> GetFriendsForFilmAsync(Guid UserId, int FilmId);
        Task<(List<User> Following, int FollowingCount, List<User> Followers, int FollowersCount, List<User> Blocked, int BlockedCount)> GetUserRelationshipsAsync(Guid UserId, int FollowingPage, int FollowersPage, int BlockedPage, int PageSize);
        Task<List<Guid>> GetFriendsAsync(Guid UserId);
        Task<Models.Enums.Relationship?> GetRelationshipStatusAsync(Guid UserId, Guid TargetId);
        Task<(List<JoinResponse<JoinedReviewFilm, User>> ReviewResponses, int ReviewCount, List<JoinedListEntries> ListResponses, int ListCount)> GetUserLikedAsync(Guid UserId, int ReviewsPage, int ListsPage, int PageSize);
        Task ReportAsync(Guid UserId);
        Task AddToWatchlistAsync(WatchlistEntry Entry);
        Task RemoveFromWatchlistAsync(Guid WeId);
        Task<bool> UpdateLikedReviewsAsync(Guid UserId, Guid ReviewId);
        Task<bool> UpdateLikedListsAsync(Guid UserId, Guid ListId);
        Task<(bool SendNotif, string UserName)> FollowUnfollowAsync(Guid UserId, Guid TargetId);
        Task BlockUnblockAsync(Guid UserId, Guid TargetId);
        Task RemoveFollowerAsync(Guid UserId, Guid TargetId);

        Task<UserLikedReview?> IsReviewLikedAsync(Guid UserId, Guid ReviewId);
        Task<UserLikedList?> IsListLikedAsync(Guid UserId, Guid ListId);
        Task<WatchlistEntry?> IsWatchlistedAsync(int FilmId, Guid UserId);

        Task UpdateAsync(User User);
        Task UpdateFavoritesAsync(UserFavorites Favorites);
        Task CreateUserWatchedFilmAsync(UserWatchedFilm WatchedFilm);
        Task UpdateUserWatchedFilmAsync(UserWatchedFilm WatchedFilm);
        Task PinReviewAsync(Guid UserId, Guid ReviewId);
        Task PinListAsync(Guid UserId, Guid ListId);
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
                .OrderByDescending(u => u.Flags).ThenBy(u => u.Id)
                .AsQueryable();

            var TotalCount = await Query.CountAsync();
            var Users = await Query
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            return (Users, TotalCount);
        }

        public async Task<(User? User, int WatchlistCount, int UserListCount, int ReviewCount, int WatchedFilmCount, int LikesCount, int FollowerCount, int FollowingCount, int BlockedCount)> GetByIdAsync(Guid Id)
        {
            var WatchlistCount = await _context.WatchlistEntries
                .AsNoTracking()
                .CountAsync(wle => wle.UserId == Id);
            var UserListCount = await _context.UserLists
                .AsNoTracking()
                .CountAsync(ul => ul.AuthorId == Id);
            var ReviewCount = await _context.Reviews
                .AsNoTracking()
                .CountAsync(r => r.AuthorId == Id);
            var WatchedFilmCount = await _context.UserWatchedFilms
                .AsNoTracking()
                .CountAsync(uwf => uwf.UserId == Id);
            var LikedReviewsCount = await _context.UserLikedReviews
                .AsNoTracking()
                .CountAsync(ulr => ulr.UserId == Id);
            var LikedListCount = await _context.UserLikedLists
                .AsNoTracking()
                .CountAsync(ull => ull.UserId == Id);
            var FollowerCount = await _context.UserRelationships
                .AsNoTracking()
                .CountAsync(ur => ur.TargetId == Id && ur.Relationship == Models.Enums.Relationship.Following);
            var FollowingCount = await _context.UserRelationships
                .AsNoTracking()
                .CountAsync(ur => ur.UserId == Id && ur.Relationship == Models.Enums.Relationship.Following);
            var BlockedCount = await _context.UserRelationships
                .AsNoTracking()
                .CountAsync(ur => ur.UserId == Id && ur.Relationship == Models.Enums.Relationship.Blocked);
            var User = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == Id);

            return (User, WatchlistCount, UserListCount, ReviewCount, WatchedFilmCount, LikedReviewsCount + LikedListCount, FollowerCount, FollowingCount, BlockedCount);
        }

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
            IQueryable<User> Query;
            if (!string.IsNullOrEmpty(Search))
            {
                var PrefixPattern = $"{Search.Replace("%", "\\%").Replace("_", "\\_")}%";
                var PrefixQuery = _context.Users
                    .AsNoTracking()
                    .Where(u => EF.Functions.ILike(u.Name, PrefixPattern));
                var PrefixCount = await PrefixQuery.CountAsync();

                if (PrefixCount > 0)
                {
                    Query = PrefixQuery;
                }
                else
                {
                    Query = _context.Users
                        .AsNoTracking()
                        .Where(u => EF.Functions.ToTsVector("english", u.Name).Matches(EF.Functions.PhraseToTsQuery("english", Search)));
                }

                var TotalCount = await Query.CountAsync();
                var Results = await Query
                    .OrderBy(u => u.Date).ThenBy(u => u.Id)
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

        public async Task<(List<JoinResponse<WatchlistEntry, Film>> Responses, int TotalCount)> GetUserWatchlistAsync(Guid UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var EntriesQuery = _context.WatchlistEntries
                .AsNoTracking()
                .Where(wle => wle.UserId == UserId)
                .Join(_context.Films, wle => wle.FilmId, f => f.Id, (wle, f) => new { Entry = wle, Film = f });

            //filtering
            switch (Filter.ToLower())
            {
                case "genre":
                    EntriesQuery = EntriesQuery.Where(x => x.Film.Genres.Contains(FilterValue!));
                    break;
                case "year":
                    EntriesQuery = EntriesQuery.Where(x => x.Film.Date.Year == int.Parse(FilterValue!));
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
                    EntriesQuery = Desc ? EntriesQuery.OrderByDescending(x => x.Entry.Date).ThenBy(x => x.Film.Id) : EntriesQuery.OrderBy(x => x.Entry.Date).ThenBy(x => x.Film.Id);
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
                    EntriesQuery = EntriesQuery.OrderByDescending(x => x.Entry.Date).ThenBy(x => x.Film.Id);
                    break;
            }

            var TotalCount = await EntriesQuery.CountAsync();
            var Responses = await EntriesQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinResponse<WatchlistEntry, Film> { Item = x.Entry, Joined = x.Film })
                .ToListAsync();

            return (Responses, TotalCount);
        }

        public async Task<(List<JoinResponse<WatchlistEntry, Film>> Responses, int TotalCount)> ShuffleWatchlistAsync(Guid UserId, int PageSize)
        {
            var TotalCount = await _context.WatchlistEntries.CountAsync(wle => wle.UserId == UserId);
            var Responses = await _context.WatchlistEntries
                .AsNoTracking()
                .Where(wle => wle.UserId == UserId)
                .OrderBy(wle => EF.Functions.Random()).ThenBy(wle => wle.Id)
                .Take(PageSize)
                .Join(_context.Films, wle => wle.FilmId, f => f.Id, (wle, f) => new { wle, f })
                .ToListAsync();
            return (Responses.Select(x => new JoinResponse<WatchlistEntry, Film> { Item = x.wle, Joined = x.f }).ToList(), TotalCount);
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
            var FriendIds = await _context.UserRelationships
                .AsNoTracking()
                .Where(ur => ur.UserId == UserId && ur.Relationship == Models.Enums.Relationship.Following)
                .Select(ur => ur.TargetId)
                .ToListAsync();

            if (FriendIds.Count == 0)
            {
                return (new(), new());
            }

            var FriendsWatchedResponse = await _context.UserWatchedFilms
                .AsNoTracking()
                .Where(uwf => FriendIds.Contains(uwf.UserId) && uwf.FilmId == FilmId)
                .Join(_context.Users, uwf => uwf.UserId, u => u.Id, (uwf, u) => new { uwf, u })
                .ToListAsync();

            var Reviews = await _context.Reviews
                .AsNoTracking()
                .Where(r => FriendIds.Contains(r.AuthorId) && r.FilmId == FilmId)
                .ToListAsync();

            return (FriendsWatchedResponse.Select(x => x.u).ToList(), Reviews);
        }

        public async Task<(List<User> Following, int FollowingCount, List<User> Followers, int FollowersCount, List<User> Blocked, int BlockedCount)> GetUserRelationshipsAsync(Guid UserId, int FollowingPage, int FollowersPage, int BlockedPage, int PageSize)
        {
            var FollowingQuery = _context.UserRelationships
                .AsNoTracking()
                .Where(ur => ur.UserId == UserId && ur.Relationship == Models.Enums.Relationship.Following)
                .OrderBy(ur => ur.Date).ThenBy(ur => ur.Id)
                .Join(_context.Users, ur => ur.TargetId, u => u.Id, (ur, u) => new { ur, u })
                .Select(x => x.u);
            var FollowersQuery = _context.UserRelationships
                .AsNoTracking()
                .Where(ur => ur.TargetId == UserId && ur.Relationship == Models.Enums.Relationship.Following)
                .OrderBy(ur => ur.Date).ThenBy(ur => ur.Id)
                .Join(_context.Users, ur => ur.UserId, u => u.Id, (ur, u) => new { ur, u })
                .Select(x => x.u);
            var BlockedQuery = _context.UserRelationships
                .AsNoTracking()
                .Where(ur => ur.UserId == UserId && ur.Relationship == Models.Enums.Relationship.Blocked)
                .OrderBy(ur => ur.Date).ThenBy(ur => ur.Id)
                .Join(_context.Users, ur => ur.TargetId, u => u.Id, (ur, u) => new { ur, u })
                .Select(x => x.u);

            var FollowingCount = FollowingPage > 0 ? await FollowingQuery.CountAsync() : 0;
            var FollowersCount = FollowersPage > 0 ? await FollowersQuery.CountAsync() : 0;
            var BlockedCount = BlockedPage > 0 ? await BlockedQuery.CountAsync() : 0;

            var Following = FollowingPage > 0
                ? await FollowingQuery.Skip((FollowingPage - 1) * PageSize).Take(PageSize).ToListAsync()
                : new();
            var Followers = FollowersPage > 0
                ? await FollowersQuery.Skip((FollowersPage - 1) * PageSize).Take(PageSize).ToListAsync()
                : new();
            var Blocked = BlockedPage > 0
                ? await BlockedQuery.Skip((BlockedPage - 1) * PageSize).Take(PageSize).ToListAsync()
                : new();

            return (Following, FollowingCount, Followers, FollowersCount, Blocked, BlockedCount);
        }

        public async Task<List<Guid>> GetFriendsAsync(Guid UserId) =>
            await _context.UserRelationships
                .AsNoTracking()
                .Where(ur => ur.UserId == UserId && ur.Relationship == Models.Enums.Relationship.Following)
                .Select(ur => ur.TargetId)
                .ToListAsync();

        public async Task<Models.Enums.Relationship?> GetRelationshipStatusAsync(Guid UserId, Guid TargetId) =>
            await _context.UserRelationships
                .AsNoTracking()
                .Where(ur => ur.UserId == UserId && ur.TargetId == TargetId)
                .Select(ur => (Models.Enums.Relationship?)ur.Relationship)
                .FirstOrDefaultAsync();

        public async Task<(List<JoinResponse<JoinedReviewFilm, User>> ReviewResponses, int ReviewCount, List<JoinedListEntries> ListResponses, int ListCount)> GetUserLikedAsync(Guid UserId, int ReviewsPage, int ListsPage, int PageSize)
        {
            var ReviewsQuery = _context.UserLikedReviews
                .AsNoTracking()
                .Where(ulr => ulr.UserId == UserId)
                .OrderByDescending(ulr => ulr.Date).ThenBy(ulr => ulr.Id)
                .Select(ulr => ulr.ReviewId)
                .Join(_context.Reviews, reviewId => reviewId, r => r.Id, (_, r) => r)
                .Join(_context.Films, r => r.FilmId, f => f.Id, (r, f) => new { r, f })
                .Join(_context.Users, x => x.r.AuthorId, u => u.Id, (x, u) => new { x.r, x.f, u });

            var ListsQuery = _context.UserLikedLists
                .AsNoTracking()
                .Where(ull => ull.UserId == UserId)
                .OrderByDescending(ull => ull.Date).ThenBy(ull => ull.Id)
                .Select(ull => ull.ListId)
                .Join(_context.UserLists, listId => listId, ul => ul.Id, (_, ul) => ul)
                .Join(_context.Users, ul => ul.AuthorId, u => u.Id, (ul, u) => new { ul, u });

            var ReviewCount = ReviewsPage > 0 ? await ReviewsQuery.CountAsync() : 0;
            var ListCount = ListsPage > 0 ? await ListsQuery.CountAsync() : 0;

            var ReviewResponses = ReviewsPage > 0
                ? await ReviewsQuery
                    .Skip((ReviewsPage - 1) * PageSize)
                    .Take(PageSize)
                    .Select(x => new JoinResponse<JoinedReviewFilm, User> { Item = new JoinedReviewFilm(x.r, x.f), Joined = x.u })
                    .ToListAsync()
                : new();

            List<JoinedListEntries> ListResponses = new();
            if (ListsPage > 0)
            {
                var PreListResponses = await ListsQuery
                    .Skip((ListsPage - 1) * PageSize)
                    .Take(PageSize)
                    .ToListAsync();
                var ListIds = PreListResponses.Select(x => x.ul.Id).ToHashSet();
                var Entries = await _context.ListEntries
                    .AsNoTracking()
                    .Where(le => ListIds.Contains(le.UserListId))
                    .OrderBy(le => le.Position)
                    .Join(_context.Films, le => le.FilmId, f => f.Id, (le, f) => new { le, f })
                    .ToListAsync();
                var EntriesByList = Entries
                    .GroupBy(x => x.le.UserListId)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Take(4)
                             .Select(x => (JoinResponse<ListEntry, Film>?)new JoinResponse<ListEntry, Film> { Item = x.le, Joined = x.f })
                             .Concat(Enumerable.Repeat<JoinResponse<ListEntry, Film>?>(null, Math.Max(0, 4 - g.Count())))
                             .ToList()
                    );
                ListResponses = PreListResponses.Select(x => new JoinedListEntries(
                    new JoinResponse<UserList, User> { Item = x.ul, Joined = x.u }!,
                    EntriesByList.TryGetValue(x.ul.Id, out var entries)
                        ? entries
                        : Enumerable.Repeat<JoinResponse<ListEntry, Film>?>(null, 4).ToList()
                )).ToList();
            }

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

        public async Task<bool> UpdateLikedReviewsAsync(Guid UserId, Guid ReviewId)
        {
            var Review = await _context.Reviews
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == ReviewId);
            if (Review == null) throw new KeyNotFoundException();

            try
            {
                _context.UserLikedReviews.Add(new UserLikedReview(UserId, ReviewId));
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
            {
                _context.ChangeTracker.Clear();
                await _context.UserLikedReviews
                    .Where(ul => ul.UserId == UserId && ul.ReviewId == ReviewId)
                    .ExecuteDeleteAsync();
            }

            return Review.NotificationsOn;
        }

        public async Task<bool> UpdateLikedListsAsync(Guid UserId, Guid ListId)
        {
            var UserList = await _context.UserLists
                .AsNoTracking()
                .FirstOrDefaultAsync(ul => ul.Id == ListId);
            if (UserList == null) throw new KeyNotFoundException();

            try
            {
                _context.UserLikedLists.Add(new UserLikedList(UserId, ListId));
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
            {
                _context.ChangeTracker.Clear();
                await _context.UserLikedLists
                    .Where(ul => ul.UserId == UserId && ul.ListId == ListId)
                    .ExecuteDeleteAsync();
            }

            return UserList.NotificationsOn;
        }

        public async Task<(bool SendNotif, string UserName)> FollowUnfollowAsync(Guid UserId, Guid TargetId)
        {
            try
            {
                _context.UserRelationships.Add(new UserRelationship(UserId, TargetId, Models.Enums.Relationship.Following));
                await _context.SaveChangesAsync();

                return (true, (await _context.Users.Where(u => u.Id == UserId).Select(u => u.Name).FirstOrDefaultAsync())!);
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
            {
                _context.ChangeTracker.Clear();
                await _context.UserRelationships
                    .Where(ur => ur.UserId == UserId && ur.TargetId == TargetId && ur.Relationship == Models.Enums.Relationship.Following)
                    .ExecuteDeleteAsync();

                return (false, "");
            }
        }

        public async Task BlockUnblockAsync(Guid UserId, Guid TargetId)
        {
            try
            {
                _context.UserRelationships.Add(new UserRelationship(UserId, TargetId, Models.Enums.Relationship.Blocked));
                await _context.SaveChangesAsync();

                await _context.UserRelationships
                    .Where(ur => ((ur.UserId == TargetId && ur.TargetId == UserId) || (ur.UserId == UserId && ur.TargetId == TargetId)) && ur.Relationship == Models.Enums.Relationship.Following)
                    .ExecuteDeleteAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
            {
                _context.ChangeTracker.Clear();
                await _context.UserRelationships
                    .Where(ur => ur.UserId == UserId && ur.TargetId == TargetId && ur.Relationship == Models.Enums.Relationship.Blocked)
                    .ExecuteDeleteAsync();
            }
        }

        public async Task RemoveFollowerAsync(Guid UserId, Guid TargetId) =>
            await _context.UserRelationships
                .Where(ur => ur.UserId == TargetId && ur.TargetId == UserId && ur.Relationship == Models.Enums.Relationship.Following)
                .ExecuteDeleteAsync();

        public async Task<UserLikedReview?> IsReviewLikedAsync(Guid UserId, Guid ReviewId) =>
            await _context.UserLikedReviews
                .AsNoTracking()
                .Where(ulr => ulr.UserId == UserId && ulr.ReviewId == ReviewId)
                .FirstOrDefaultAsync();

        public async Task<UserLikedList?> IsListLikedAsync(Guid UserId, Guid ListId) =>
            await _context.UserLikedLists
                .AsNoTracking()
                .Where(ull => ull.UserId == UserId && ull.ListId == ListId)
                .FirstOrDefaultAsync();

        public async Task<WatchlistEntry?> IsWatchlistedAsync(int FilmId, Guid UserId)
        {
            var Entry = await _context.WatchlistEntries
                .AsNoTracking()
                .FirstOrDefaultAsync(wle => wle.FilmId == FilmId && wle.UserId == UserId);
            return Entry;
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

        public async Task PinReviewAsync(Guid UserId, Guid ReviewId)
        {
            var Rows = await _context.Users
                .Where(u => u.Id == UserId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    u => u.PinnedReviewId,
                    u => u.PinnedReviewId == ReviewId ? null : ReviewId
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task PinListAsync(Guid UserId, Guid ListId)
        {
            var Rows = await _context.Users
                .Where(u => u.Id == UserId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    u => u.PinnedListId,
                    u => u.PinnedListId == ListId ? null : ListId
                ));
            if (Rows == 0) throw new KeyNotFoundException();
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
