using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;
using Heteroboxd.Models;
using Microsoft.AspNetCore.Identity;

namespace Heteroboxd.Service
{
    public interface IUserService
    {
        Task<UserInfoResponse?> GetUser(string UserId);
        Task<PagedWatchlistResponse> GetWatchlist(string UserId, int Page, int PageSize); //for viewing
        Task<bool> IsFilmWatchlisted(string UserId, int FilmId); //for checking if a film is in the watchlist (quick lookup)
        Task<Dictionary<string, object?>> GetFavorites(string UserId);
        Task<Dictionary<string, List<UserInfoResponse>>> GetRelationships(string UserId); //example: {"following": [User1, User2, User3], "followers": [User2], "blocked": [User4, User5]}
        Task<Dictionary<string, IEnumerable<object>>> GetLikes(string UserId); //example: {"likedReviews": [Review1, Review2], "likedComments": [Comment1, Comment2], "likedLists": [List1, List2]}
        Task<bool> IsObjectLiked(string UserId, string ObjectId, string ObjectType); //ObjectType: "review", "comment", "list"
        Task<UserWatchedFilmResponse?> GetUserWatchedFilm(string UserId, int FilmId);
        Task<List<FriendFilmResponse>> GetFriendsForFilm(string UserId, int FilmId);
        Task<Dictionary<double, int>> GetUserRatings(string UserId);
        Task<List<UserInfoResponse>> SearchUsers(string SearchName);
        Task ReportUserEfCore7Async(string UserId);
        Task UpdateUser(UpdateUserRequest UserUpdate);
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
        private readonly IAuthService _authService;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<UserService> _logger;

        public UserService(IUserRepository repo, IFilmRepository filmRepo, IReviewRepository reviewRepository, IAuthService authService, UserManager<User> userManager, ILogger<UserService> logger)
        {
            _repo = repo;
            _filmRepo = filmRepo;
            _reviewRepo = reviewRepository;
            _authService = authService;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<UserInfoResponse?> GetUser(string UserId)
        {
            if (!Guid.TryParse(UserId, out var Id))
            {
                _logger.LogError($"Failed to parse UserId: {UserId}; invalid.");
                throw new ArgumentException();
            }
            var User = await _repo.GetByIdAsync(Id);
            if (User == null)
            {
                _logger.LogError($"User with Id: {UserId} not found.");
                return null;
            }
            return new UserInfoResponse(User);
        }

        public async Task<PagedWatchlistResponse> GetWatchlist(string UserId, int Page, int PageSize)
        {
            var (WatchlistPage, TotalCount) = await _repo.GetUserWatchlistAsync(Guid.Parse(UserId), Page, PageSize);
            return new PagedWatchlistResponse
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Entries = WatchlistPage.Select(wle => new WatchlistEntryInfoResponse(wle)).ToList()
            };
        }

        public async Task<bool> IsFilmWatchlisted(string UserId, int FilmId)
        {
            var ExistingEntry = await _repo.IsWatchlistedAsync(FilmId, Guid.Parse(UserId));
            return ExistingEntry != null;
        }

        public async Task<Dictionary<string, object?>> GetFavorites(string UserId)
        {
            if (!Guid.TryParse(UserId, out var Id))
            {
                _logger.LogError($"Failed to parse GUID: {UserId}");
                throw new ArgumentException();
            }
            var Favorites = await _repo.GetUserFavoritesAsync(Id);
            if (Favorites == null)
            {
                _logger.LogError($"Failed to find Favorites of User: {UserId}");
                throw new KeyNotFoundException();
            }

            object? Film1IR = null;
            object? Film2IR = null;
            object? Film3IR = null;
            object? Film4IR = null;

            if (Favorites.Film1 != null)
            {
                var Film1 = await _filmRepo.GetByIdAsync(Favorites.Film1.Value);
                if (Film1 != null)
                {
                    Film1IR = new FilmInfoResponse(Film1, false);
                }
                else
                {
                    Film1IR = "error";
                }
            }

            if (Favorites.Film2 != null)
            {
                var Film2 = await _filmRepo.GetByIdAsync(Favorites.Film2.Value);
                if (Film2 != null)
                {
                    Film2IR = new FilmInfoResponse(Film2, false);
                }
                else
                {
                    Film2IR = "error";
                }
            }

            if (Favorites.Film3 != null)
            {
                var Film3 = await _filmRepo.GetByIdAsync(Favorites.Film3.Value);
                if (Film3 != null)
                {
                    Film3IR = new FilmInfoResponse(Film3, false);
                }
                else
                {
                    Film3IR = "error";
                }
            }

            if (Favorites.Film4 != null)
            {
                var Film4 = await _filmRepo.GetByIdAsync(Favorites.Film4.Value);
                if (Film4 != null)
                {
                    Film4IR = new FilmInfoResponse(Film4, false);
                }
                else
                {
                    Film4IR = "error";
                }
            }

            return new Dictionary<string, object?>
            {
                {"1", Film1IR},
                {"2", Film2IR},
                {"3", Film3IR},
                {"4", Film4IR}
            };
        }


        public async Task<Dictionary<string, List<UserInfoResponse>>> GetRelationships(string UserId)
        {
            var _following = await _repo.GetUserFollowingAsync(Guid.Parse(UserId));
            var _followers = await _repo.GetUserFollowersAsync(Guid.Parse(UserId));
            var _blocked = await _repo.GetUserBlockedAsync(Guid.Parse(UserId));

            if (_following == null || _followers == null || _blocked == null)
            {
                _logger.LogError("Failed to fetch all relationships");
                throw new KeyNotFoundException();
            }

            return new Dictionary<string, List<UserInfoResponse>>
            {
                { "following", _following.Following.Select(u => new UserInfoResponse(u)).ToList() },
                { "followers", _followers.Followers.Select(u => new UserInfoResponse(u)).ToList() },
                { "blocked", _blocked.Blocked.Select(u => new UserInfoResponse(u)).ToList() }
            };
        }

        public async Task<Dictionary<string, IEnumerable<object>>> GetLikes(string UserId)
        {
            var _likedReviews = await _repo.GetUserLikedReviewsAsync(Guid.Parse(UserId));
            var _likedLists = await _repo.GetUserLikedListsAsync(Guid.Parse(UserId));

            if (_likedLists == null || _likedReviews == null) throw new KeyNotFoundException();

            var TaskedReviews = _likedReviews.LikedReviews.Select(async r =>
            {
                var Author = await _repo.GetByIdAsync(r.AuthorId);
                var Film = await _filmRepo.GetByIdAsync(r.FilmId);
                if (Author == null || Film == null) throw new KeyNotFoundException();
                return new ReviewInfoResponse(r, Author, Film);
            });

            var TaskedLists = _likedLists.LikedLists.Select(async ul =>
            {
                var Author = await _repo.GetByIdAsync(ul.AuthorId);
                if (Author == null) throw new KeyNotFoundException();
                return new UserListInfoResponse(ul, Author);
            });

            var LikedReviews = await Task.WhenAll(TaskedReviews);
            var LikedLists = await Task.WhenAll(TaskedLists);

            return new Dictionary<string, IEnumerable<object>>
            {
                { "liked_reviews", LikedReviews },
                { "liked_lists", LikedLists }
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
                    _logger.LogError($"Unknown ObjectType: {ObjectType}");
                    throw new ArgumentException();
            }
        }

        public async Task<UserWatchedFilmResponse?> GetUserWatchedFilm(string UserId, int FilmId)
        {
            var UserWatchedFilm = await _repo.GetUserWatchedFilmAsync(Guid.Parse(UserId), FilmId);
            return UserWatchedFilm == null ? null : new UserWatchedFilmResponse(UserWatchedFilm);
        }

        public async Task<List<FriendFilmResponse>> GetFriendsForFilm(string UserId, int FilmId)
        {
            var (Friends, Reviews) = await _repo.GetFriendsForFilmAsync(Guid.Parse(UserId), FilmId);

            return Friends
                .Select(f => new FriendFilmResponse
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

        public async Task<List<UserInfoResponse>> SearchUsers(string SearchName)
        {
            var Users = await _repo.SearchAsync(SearchName.ToLower());
            return Users.Select(u => new UserInfoResponse(u)).ToList();
        }

        public async Task UpdateUser(UpdateUserRequest UserUpdate)
        {
            var User = await _repo.GetByIdAsync(Guid.Parse(UserUpdate.UserId)); //no need for rigorous id-checking, as users are requires to be logged in to update their profile
            if (User == null)
            {
                _logger.LogError($"Failed to update User with Id: {UserUpdate.UserId}; not found"); //should never happen
                throw new KeyNotFoundException();
            }
            User.Name = UserUpdate.Name ?? User.Name;
            User.Bio = UserUpdate.Bio ?? User.Bio;
            User.PictureUrl = UserUpdate.PictureUrl ?? User.PictureUrl;
            _repo.Update(User);
            await _repo.SaveChangesAsync();
        }

        public async Task VerifyUser(string UserId, string Token)
        {
            Guid Id;
            if (Guid.TryParse(UserId, out Id))
            {
                var User = await _repo.GetByIdAsync(Guid.Parse(UserId));
                if (User == null)
                {
                    _logger.LogError($"Failed to verify User with Id: {UserId}; Not Found.");
                    throw new KeyNotFoundException();
                }
                var Result = await _userManager.ConfirmEmailAsync(User, Token);
                if (!Result.Succeeded)
                {
                    _logger.LogError($"Failed to verify User with Id: {UserId}; Token: {Token} expired.");
                    throw new Exception();
                }
            }
            else
            {
                _logger.LogError($"Failed to verify User with Id: {UserId}; Parsing failed.");
                throw new Exception();
            }
            
        }

        public async Task ReportUserEfCore7Async(string UserId)
        {
            if (!Guid.TryParse(UserId, out var Id))
            {
                _logger.LogError($"GUID failed to parse {UserId}; malformed.");
                throw new ArgumentException();
            }
            await _repo.ReportUserEfCore7Async(Id);
        }

        public async Task UpdateWatchlist(string UserId, int FilmId)
        {
            var User = await _repo.GetByIdAsync(Guid.Parse(UserId));
            if (User == null) throw new KeyNotFoundException();
            var ExistingEntry = await _repo.IsWatchlistedAsync(FilmId, Guid.Parse(UserId));
            if (ExistingEntry != null)
            {
                await _repo.RemoveFromWatchlist(ExistingEntry);
            }
            else
            {
                var Film = await _filmRepo.GetByIdAsync(FilmId);
                if (Film == null) throw new KeyNotFoundException();
                await _repo.AddToWatchlist(new WatchlistEntry(Film.PosterUrl, FilmId, Guid.Parse(UserId), User.Watchlist!.Id));
            }
            await _repo.SaveChangesAsync();
        }

        public async Task<Dictionary<string, object?>> UpdateFavorites(string UserId, int? FilmId, int Index)
        {
            UserFavorites? UserFavorites = await _repo.GetUserFavoritesAsync(Guid.Parse(UserId));
            if (UserFavorites == null) throw new KeyNotFoundException();

            if (UserFavorites.Film1 != null && UserFavorites.Film1 == FilmId)
            {
                await _filmRepo.UpdateFilmFavoriteCountEfCore7Async(UserFavorites.Film1.Value, -1);
                UserFavorites.Film1 = null;
            }
            if (UserFavorites.Film2 != null && UserFavorites.Film2 == FilmId)
            {
                await _filmRepo.UpdateFilmFavoriteCountEfCore7Async(UserFavorites.Film2.Value, -1);
                UserFavorites.Film2 = null;
            }
            if (UserFavorites.Film3 != null && UserFavorites.Film3 == FilmId)
            {
                await _filmRepo.UpdateFilmFavoriteCountEfCore7Async(UserFavorites.Film3.Value, -1);
                UserFavorites.Film3 = null;
            }
            if (UserFavorites.Film4 != null && UserFavorites.Film4 == FilmId)
            {
                await _filmRepo.UpdateFilmFavoriteCountEfCore7Async(UserFavorites.Film4.Value, -1);
                UserFavorites.Film4 = null;
            }

            switch (Index)
            {
                case 1:
                    if (UserFavorites.Film1 != null)
                    {
                        await _filmRepo.UpdateFilmFavoriteCountEfCore7Async(UserFavorites.Film1.Value, -1);
                    } 
                    UserFavorites.Film1 = FilmId;
                    if (FilmId != null)
                    {
                        await _filmRepo.UpdateFilmFavoriteCountEfCore7Async(FilmId.Value, 1);
                    }
                    break;
                case 2:
                    if (UserFavorites.Film2 != null)
                    {
                        await _filmRepo.UpdateFilmFavoriteCountEfCore7Async(UserFavorites.Film2.Value, -1);
                    }
                    UserFavorites.Film2 = FilmId;
                    if (FilmId != null)
                    {
                        await _filmRepo.UpdateFilmFavoriteCountEfCore7Async(FilmId.Value, 1);
                    }
                    break;
                case 3:
                    if (UserFavorites.Film3 != null)
                    {
                        await _filmRepo.UpdateFilmFavoriteCountEfCore7Async(UserFavorites.Film3.Value, -1);
                    }
                    UserFavorites.Film3 = FilmId;
                    if (FilmId != null)
                    {
                        await _filmRepo.UpdateFilmFavoriteCountEfCore7Async(FilmId.Value, 1);
                    }
                    break;
                case 4:
                    if (UserFavorites.Film4 != null)
                    {
                        await _filmRepo.UpdateFilmFavoriteCountEfCore7Async(UserFavorites.Film4.Value, -1);
                    }
                    UserFavorites.Film4 = FilmId;
                    if (FilmId != null)
                    {
                        await _filmRepo.UpdateFilmFavoriteCountEfCore7Async(FilmId.Value, 1);
                    }
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
                    await _repo.FollowUnfollowAsync(Guid.Parse(UserId), Guid.Parse(TargetId));
                    _logger.LogInformation("Successfully followed/unfollowed.");
                    await _repo.SaveChangesAsync();
                    break;
                case ("block-unblock"):
                    await _repo.BlockUnblockAsync(Guid.Parse(UserId), Guid.Parse(TargetId));
                    _logger.LogInformation("Successfully blocked/unblocked.");
                    await _repo.SaveChangesAsync();
                    break;
                case ("add-remove-follower"):
                    await _repo.FollowUnfollowAsync(Guid.Parse(TargetId), Guid.Parse(UserId));
                    _logger.LogInformation("Successfully added/removed follower.");
                    await _repo.SaveChangesAsync();
                    break;
            }
        }

        public async Task UpdateLikes(UpdateUserLikesRequest LikeRequest)
        {
            if (LikeRequest.ReviewId != null)
            {
                await _repo.UpdateLikedReviewsAsync(Guid.Parse(LikeRequest.UserId), Guid.Parse(LikeRequest.ReviewId));
                await _repo.SaveChangesAsync();
            }
            else if (LikeRequest.ListId != null)
            {
                await _repo.UpdateLikedListsAsync(Guid.Parse(LikeRequest.UserId), Guid.Parse(LikeRequest.ListId));
                await _repo.SaveChangesAsync();
            }
            else throw new ArgumentNullException();
        }

        public async Task TrackFilm(string UserId, int FilmId, string Action)
        {
            var User = await _repo.GetByIdAsync(Guid.Parse(UserId));
            var Film = await _filmRepo.GetByIdAsync(FilmId);
            if (User == null || Film == null) throw new KeyNotFoundException();

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
                        UserWatchedFilm UserWatchedFilm = new UserWatchedFilm(User.Id, Film.Id);
                        _repo.CreateUserWatchedFilm(UserWatchedFilm);
                        await _filmRepo.UpdateFilmWatchCountEfCore7Async(Film.Id, 1);
                    }
                    //remove film from watchlist
                    var ExistingEntry = await _repo.IsWatchlistedAsync(Film.Id, User.Id);
                    if (ExistingEntry != null)
                    {
                        await _repo.RemoveFromWatchlist(ExistingEntry);
                    }
                    await _repo.SaveChangesAsync();
                    break;
                case ("unwatched"):
                    var UserUnWatchedFilm = await _repo.GetUserWatchedFilmAsync(User.Id, Film.Id);
                    if (UserUnWatchedFilm == null)
                    {
                        _logger.LogError($"Failed to unwatch UserWatchedFilm for {UserId} -> {FilmId}; UWF not found;");
                        throw new KeyNotFoundException();
                    }
                    //decrement watchcount
                    await _filmRepo.UpdateFilmWatchCountEfCore7Async(Film.Id, -1);
                    //delete uwf
                    _repo.DeleteUserWatchedFilm(UserUnWatchedFilm);
                    await _repo.SaveChangesAsync();
                    //delete associated review if any
                    var Review = await _reviewRepo.GetByUserFilmAsync(UserUnWatchedFilm.UserId, Film.Id);
                    if (Review != null)
                    {
                        _reviewRepo.Delete(Review);
                        await _reviewRepo.SaveChangesAsync();
                    }
                    break;
                default:
                    _logger.LogError($"Unknown action: {Action}");
                    throw new ArgumentException();
            }
        }

        public async Task DeleteUser(string UserId)
        {
            if (!Guid.TryParse(UserId, out var Id))
            {
                _logger.LogError($"GUID failed to parse {UserId}; malformed.");
                throw new ArgumentException();
            }
            var User = await _repo.GetByIdAsync(Id);
            if (User == null)
            {
                _logger.LogError($"Failed to find User with Id: {UserId}");
                throw new KeyNotFoundException();
            }
            _repo.Delete(User);
            await _repo.SaveChangesAsync();
            await _authService.RevokeAllUserTokens(User.Id);
        }
    }
}
