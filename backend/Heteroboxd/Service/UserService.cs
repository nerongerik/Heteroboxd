using Heteroboxd.Integrations;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;
using Microsoft.AspNetCore.Identity;

namespace Heteroboxd.Service
{
    public interface IUserService
    {
        Task<UserInfoResponse> GetUser(string UserId);
        Task<PagedResponse<WatchlistEntryInfoResponse>> GetWatchlist(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<bool> IsFilmWatchlisted(string UserId, int FilmId);
        Task<Dictionary<string, object?>> GetFavorites(string UserId);
        Task<DelimitedUserRelationshipsInfoResponse> GetRelationships(string UserId, int FollowersPage, int FollowingPage, int BlockedPage, int PageSize);
        Task<string> DetermineRelationship(string UserId, string TargetId);
        Task<DelimitedUserLikesInfoResponse> GetLikes(string UserId, int ReviewsPage, int ListsPage, int PageSize);
        Task<bool> IsObjectLiked(string UserId, string ObjectId, string ObjectType);
        Task<UserWatchedFilmInfoResponse?> DidUserWatchFilm(string UserId, int FilmId);
        Task<List<DelimitedUserFilmInfoResponse>> GetFriendsForFilm(string UserId, int FilmId);
        Task<Dictionary<double, int>> GetUserRatings(string UserId);
        Task<PagedResponse<UserInfoResponse>> SearchUsers(string Search, int Page, int PageSize);
        Task ReportUserEfCore7Async(string UserId);
        Task<string?> UpdateUser(UpdateUserRequest UserUpdate);
        Task VerifyUser(string UserId, string Token);
        Task UpdateWatchlist(string UserId, int FilmId);
        Task<Dictionary<string, object?>> UpdateFavorites(string UserId, int? FilmId, int Index);
        Task UpdateRelationship(string UserId, string TargetId, string Action);
        Task UpdateLikes(UpdateUserLikesRequest LikeRequest);
        Task TrackFilm(string UserId, int FilmId, string Action);
        Task DeleteUser(string UserId);
    }

    public class UserService : IUserService
    {
        private readonly IUserRepository _repo;
        private readonly IFilmRepository _filmRepo;
        private readonly IReviewRepository _reviewRepo;
        private readonly IUserListRepository _listRepo;
        private readonly IAuthService _authService;
        private readonly UserManager<User> _userManager;
        private readonly INotificationService _notificationService;
        private readonly IR2Handler _r2Handler;

        public UserService(IUserRepository repo, IFilmRepository filmRepo, IReviewRepository reviewRepository, IUserListRepository listRepo, IAuthService authService, UserManager<User> userManager, INotificationService notificationService, IR2Handler r2Handler)
        {
            _repo = repo;
            _filmRepo = filmRepo;
            _reviewRepo = reviewRepository;
            _listRepo = listRepo;
            _authService = authService;
            _userManager = userManager;
            _notificationService = notificationService;
            _r2Handler = r2Handler;
        }

        public async Task<UserInfoResponse> GetUser(string UserId)
        {
            var User = await _repo.GetByIdAsync(Guid.Parse(UserId));
            if (User == null) throw new KeyNotFoundException();
            return new UserInfoResponse(User);
        }

        public async Task<PagedResponse<WatchlistEntryInfoResponse>> GetWatchlist(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var (WatchlistPage, TotalCount) = await _repo.GetUserWatchlistAsync(Guid.Parse(UserId), Page, PageSize, Filter, Sort, Desc, FilterValue);
            return new PagedResponse<WatchlistEntryInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = WatchlistPage.Select(wle => new WatchlistEntryInfoResponse(wle)).ToList()
            };
        }

        public async Task<bool> IsFilmWatchlisted(string UserId, int FilmId)
        {
            var (Existing, _) = await _repo.IsWatchlistedAsync(FilmId, Guid.Parse(UserId));
            return Existing != null;
        }

        public async Task<Dictionary<string, object?>> GetFavorites(string UserId)
        {
            var Favorites = await _repo.GetUserFavoritesAsync(Guid.Parse(UserId));
            if (Favorites == null) throw new KeyNotFoundException();

            object? Film1IR = null;
            object? Film2IR = null;
            object? Film3IR = null;
            object? Film4IR = null;

            if (Favorites.Film1 != null)
            {
                var Film1 = await _filmRepo.LightweightFetcher(Favorites.Film1.Value);
                if (Film1 != null)  Film1IR = new FilmInfoResponse(Film1, false);
                else Film1IR = "error";
            }
            if (Favorites.Film2 != null)
            {
                var Film2 = await _filmRepo.LightweightFetcher(Favorites.Film2.Value);
                if (Film2 != null) Film2IR = new FilmInfoResponse(Film2, false);
                else Film2IR = "error";
            }
            if (Favorites.Film3 != null)
            {
                var Film3 = await _filmRepo.LightweightFetcher(Favorites.Film3.Value);
                if (Film3 != null) Film3IR = new FilmInfoResponse(Film3, false);
                else Film3IR = "error";
            }
            if (Favorites.Film4 != null)
            {
                var Film4 = await _filmRepo.LightweightFetcher(Favorites.Film4.Value);
                if (Film4 != null) Film4IR = new FilmInfoResponse(Film4, false);
                else Film4IR = "error";
            }

            return new Dictionary<string, object?>
            {
                {"1", Film1IR},
                {"2", Film2IR},
                {"3", Film3IR},
                {"4", Film4IR}
            };
        }


        public async Task<DelimitedUserRelationshipsInfoResponse> GetRelationships(string UserId, int FollowersPage, int FollowingPage, int BlockedPage, int PageSize)
        {
            var (Following, FollowingCount, Followers, FollowersCount, Blocked, BlockedCount) = await _repo.GetUserRelationshipsAsync(Guid.Parse(UserId), FollowingPage, FollowersPage, BlockedPage, PageSize);

            return new DelimitedUserRelationshipsInfoResponse
            {
                Following = new PagedResponse<UserInfoResponse>
                {
                    Items = Following.Select(u => new UserInfoResponse(u)).ToList(),
                    Page = FollowingPage,
                    PageSize = PageSize,
                    TotalCount = FollowingCount
                },
                Followers = new PagedResponse<UserInfoResponse>
                {
                    Items = Followers.Select(u => new UserInfoResponse(u)).ToList(),
                    Page = FollowersPage,
                    PageSize = PageSize,
                    TotalCount = FollowersCount
                },
                Blocked = new PagedResponse<UserInfoResponse>
                {
                    Items = Blocked.Select(u => new UserInfoResponse(u)).ToList(),
                    Page = BlockedPage,
                    PageSize = PageSize,
                    TotalCount = BlockedCount
                }
            };
        }

        public async Task<string> DetermineRelationship(string UserId, string TargetId)
        {
            var Status = await _repo.GetRelationshipStatusAsync(Guid.Parse(UserId), Guid.Parse(TargetId));
            if (Status == null) throw new KeyNotFoundException();

            return Status switch
            {
                { IsBlocked: true } => "blocked",
                { IsFollowing: true } => "following",
                { IsFollower: true } => "followed",
                _ => "none"
            };
        }

        public async Task<DelimitedUserLikesInfoResponse> GetLikes(string UserId, int ReviewsPage, int ListsPage, int PageSize)
        {
            var (ReviewResponses, ReviewCount, ListResponses, ListCount) = await _repo.GetUserLikedAsync(Guid.Parse(UserId), ReviewsPage, ListsPage, PageSize);
            return new DelimitedUserLikesInfoResponse
            {
                LikedReviews = new PagedResponse<ReviewInfoResponse>
                {
                    Items = ReviewResponses.Select(x => new ReviewInfoResponse(x.Item.Review, x.Joined, x.Item.Film)).ToList(),
                    Page = ReviewsPage,
                    PageSize = PageSize,
                    TotalCount = ReviewCount
                },
                LikedLists = new PagedResponse<UserListInfoResponse>
                {
                    Items = ListResponses.Select(x => new UserListInfoResponse(x.Item, x.Joined, 4)).ToList(),
                    Page = ListsPage,
                    PageSize = PageSize,
                    TotalCount = ListCount
                }
            };
        }

        public async Task<bool> IsObjectLiked(string UserId, string ObjectId, string ObjectType)
        {
            switch (ObjectType)
            {
                case ("review"):
                    var LikedReview = await _repo.IsReviewLikedAsync(Guid.Parse(UserId), Guid.Parse(ObjectId));
                    return LikedReview != null;
                case ("list"):
                    var LikedList = await _repo.IsListLikedAsync(Guid.Parse(UserId), Guid.Parse(ObjectId));
                    return LikedList != null;
                default:
                    throw new ArgumentException();
            }
        }

        public async Task<UserWatchedFilmInfoResponse?> DidUserWatchFilm(string UserId, int FilmId)
        {
            var UserWatchedFilm = await _repo.GetUserWatchedFilmAsync(Guid.Parse(UserId), FilmId);
            return UserWatchedFilm == null ? null : new UserWatchedFilmInfoResponse(UserWatchedFilm);
        }

        public async Task<List<DelimitedUserFilmInfoResponse>> GetFriendsForFilm(string UserId, int FilmId)
        {
            var (Friends, Reviews) = await _repo.GetFriendsForFilmAsync(Guid.Parse(UserId), FilmId);
            return Friends
                .Select(f => new DelimitedUserFilmInfoResponse
                {
                    FriendId = f.Id.ToString(),
                    FriendProfilePictureUrl = f.PictureUrl,
                    DateWatched = f.WatchedFilms
                        .First(uwf => uwf.FilmId == FilmId)
                        .DateWatched
                        .ToString("dd/MM/yyyy HH:mm"),
                    Rating = Reviews
                        .FirstOrDefault(r => r.AuthorId == f.Id)?
                        .Rating ?? null,
                    ReviewId = Reviews
                        .FirstOrDefault(r => r.AuthorId == f.Id)?
                        .Id
                        .ToString() ?? null
                })
                .ToList();
        }

        public async Task<Dictionary<double, int>> GetUserRatings(string UserId)
        {
            var Ratings = await _repo.GetRatingsAsync(Guid.Parse(UserId));
            return Ratings;
        }

        public async Task<PagedResponse<UserInfoResponse>> SearchUsers(string Search, int Page, int PageSize)
        {
            var (Result, TotalCount) = await _repo.SearchAsync(Search.ToLower(), Page, PageSize);
            return new PagedResponse<UserInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = Result.Select(u => new UserInfoResponse(u)).ToList()
            };
        }

        public async Task<string?> UpdateUser(UpdateUserRequest UserUpdate)
        {
            var User = await _repo.LightweightFetcherAsync(Guid.Parse(UserUpdate.UserId));
            if (User == null) throw new KeyNotFoundException();

            User.UpdateFields(UserUpdate);
            string? PresignedUrl = null;
            if (UserUpdate.GeneratePresign)
            {
                var (Url, ImgPath) = await _r2Handler.GeneratePresignedUrl(User.Id);
                User.PictureUrl = ImgPath;
                PresignedUrl = Url;
            }

            _repo.Update(User);
            await _repo.SaveChangesAsync();

            return PresignedUrl;
        }

        public async Task VerifyUser(string UserId, string Token)
        {
            var User = await _repo.LightweightFetcherAsync(Guid.Parse(UserId));
            if (User == null) throw new KeyNotFoundException();

            var Result = await _userManager.ConfirmEmailAsync(User, Token);
            if (!Result.Succeeded) throw new Exception();
        }

        public async Task ReportUserEfCore7Async(string UserId) =>
            await _repo.ReportUserEfCore7Async(Guid.Parse(UserId));

        public async Task UpdateWatchlist(string UserId, int FilmId)
        {
            var (Existing, WatchlistId) = await _repo.IsWatchlistedAsync(FilmId, Guid.Parse(UserId));
            if (Existing != null)
            {
                await _repo.RemoveFromWatchlist(Existing);
            }
            else
            {
                var Film = await _filmRepo.LightweightFetcher(FilmId);
                if (Film == null) throw new KeyNotFoundException();
                await _repo.AddToWatchlist(new WatchlistEntry(Film.PosterUrl, FilmId, Guid.Parse(UserId), WatchlistId));
            }
            await _repo.SaveChangesAsync();
        }

        public async Task<Dictionary<string, object?>> UpdateFavorites(string UserId, int? FilmId, int Index)
        {
            var UserFavorites = await _repo.GetUserFavoritesAsync(Guid.Parse(UserId));
            if (UserFavorites == null) throw new KeyNotFoundException();

            if (UserFavorites.Film1 != null && UserFavorites.Film1 == FilmId) UserFavorites.Film1 = null;
            if (UserFavorites.Film2 != null && UserFavorites.Film2 == FilmId) UserFavorites.Film2 = null;
            if (UserFavorites.Film3 != null && UserFavorites.Film3 == FilmId) UserFavorites.Film3 = null;
            if (UserFavorites.Film4 != null && UserFavorites.Film4 == FilmId) UserFavorites.Film4 = null;

            switch (Index)
            {
                case 1:
                    UserFavorites.Film1 = FilmId;
                    break;
                case 2:
                    UserFavorites.Film2 = FilmId;
                    break;
                case 3:
                    UserFavorites.Film3 = FilmId;
                    break;
                case 4:
                    UserFavorites.Film4 = FilmId;
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }

            _repo.UpdateFavorites(UserFavorites);
            await _repo.SaveChangesAsync();

            return await GetFavorites(UserId);
        }

        public async Task UpdateRelationship(string UserId, string TargetId, string Action)
        {
            switch(Action)
            {
                case ("follow-unfollow"):
                    var (SendNotif, UserName) = await _repo.FollowUnfollowAsync(Guid.Parse(UserId), Guid.Parse(TargetId));
                    if (SendNotif)
                    {
                        await _notificationService.AddNotification(
                            $"{UserName} just followed you!",
                            Models.Enums.NotificationType.Follow,
                            Guid.Parse(TargetId)
                        );
                    }
                    break;
                case ("block-unblock"):
                    await _repo.BlockUnblockAsync(Guid.Parse(UserId), Guid.Parse(TargetId));
                    break;
                case ("remove-follower"):
                    await _repo.FollowUnfollowAsync(Guid.Parse(TargetId), Guid.Parse(UserId));
                    break;
            }
            await _repo.SaveChangesAsync();
        }

        public async Task UpdateLikes(UpdateUserLikesRequest LikeRequest)
        {
            if (LikeRequest.ReviewId != null)
            {

                var Review = await _reviewRepo.GetByIdAsync(Guid.Parse(LikeRequest.ReviewId));
                if (Review == null) throw new KeyNotFoundException();

                await _repo.UpdateLikedReviewsAsync(Guid.Parse(LikeRequest.UserId), Guid.Parse(LikeRequest.ReviewId));
                await _repo.SaveChangesAsync();

                if (LikeRequest.LikeChange < 0 || !Review!.NotificationsOn || LikeRequest.UserId == LikeRequest.AuthorId) return;
                
                await _notificationService.AddNotification(
                    $"{LikeRequest.UserName} liked your review of {LikeRequest.FilmTitle!}",
                    Models.Enums.NotificationType.Review,
                    Guid.Parse(LikeRequest.AuthorId)
                );
            }
            else if (LikeRequest.ListId != null)
            {
                var UserList = await _listRepo.GetByIdAsync(Guid.Parse(LikeRequest.ListId));
                if (UserList == null) throw new KeyNotFoundException();

                await _repo.UpdateLikedListsAsync(Guid.Parse(LikeRequest.UserId), Guid.Parse(LikeRequest.ListId));
                await _repo.SaveChangesAsync();

                if (LikeRequest.LikeChange < 0 || !UserList!.NotificationsOn || LikeRequest.UserId == LikeRequest.AuthorId) return;

                await _notificationService.AddNotification(
                    $"{LikeRequest.UserName} liked your list '{LikeRequest.ListName!}'",
                    Models.Enums.NotificationType.List,
                    Guid.Parse(LikeRequest.AuthorId)
                );
            }
            else throw new ArgumentNullException();
        }

        public async Task TrackFilm(string UserId, int FilmId, string Action)
        {
            var User = await _repo.LightweightFetcherAsync(Guid.Parse(UserId));
            if (User == null) throw new KeyNotFoundException();
            var Film = await _filmRepo.LightweightFetcher(FilmId);
            if (Film == null) throw new KeyNotFoundException();

            switch (Action)
            {
                case ("watched"):
                    var Existing = await _repo.GetUserWatchedFilmAsync(User.Id, Film.Id);
                    if (Existing != null)
                    {
                        Existing.TimesWatched++;
                        Existing.DateWatched = DateTime.UtcNow;
                        await _filmRepo.UpdateFilmWatchCountEfCore7Async(Film.Id, 1);
                    }
                    else
                    {
                        var UserWatchedFilm = new UserWatchedFilm(User.Id, Film.Id);
                        _repo.CreateUserWatchedFilm(UserWatchedFilm);
                        await _filmRepo.UpdateFilmWatchCountEfCore7Async(Film.Id, 1);
                    }
                    //remove film from watchlist
                    var (Entry, _) = await _repo.IsWatchlistedAsync(Film.Id, User.Id);
                    if (Entry != null)
                    {
                        await _repo.RemoveFromWatchlist(Entry);
                    }
                    await _repo.SaveChangesAsync();
                    break;
                case ("unwatched"):
                    var UserUnWatchedFilm = await _repo.GetUserWatchedFilmAsync(User.Id, Film.Id);
                    if (UserUnWatchedFilm == null) throw new KeyNotFoundException();
                    //decrement watchcount
                    await _filmRepo.UpdateFilmWatchCountEfCore7Async(Film.Id, -1);
                    //delete uwf
                    _repo.DeleteUserWatchedFilm(UserUnWatchedFilm);
                    await _repo.SaveChangesAsync();
                    //delete associated review (if any)
                    var Response = await _reviewRepo.GetByUserFilmAsync(UserUnWatchedFilm.UserId, Film.Id);
                    if (Response != null)
                    {
                        _reviewRepo.Delete(Response.Review);
                        await _reviewRepo.SaveChangesAsync();
                    }
                    break;
                default:
                    throw new ArgumentException();
            }
        }

        public async Task DeleteUser(string UserId)
        {
            if (!Guid.TryParse(UserId, out var Id)) throw new ArgumentException();

            var User = await _repo.LightweightFetcherAsync(Id);
            if (User == null) throw new KeyNotFoundException();

            await _r2Handler.DeleteByUser(User.Id);

            _repo.Delete(User);
            await _repo.SaveChangesAsync();

            await _authService.RevokeAllUserTokens(User.Id);
        }

        private PagedResponse<T> PaginateItems<T>(List<T> Items, int Page, int PageSize)
        {
            var PagedItems = Items
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToList();
            return new PagedResponse<T>
            {
                Items = PagedItems,
                TotalCount = Items.Count,
                Page = Page,
                PageSize = PageSize
            };
        }
    }
}
