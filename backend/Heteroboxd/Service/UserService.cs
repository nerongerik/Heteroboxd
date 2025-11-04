using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;
using Heteroboxd.Models;
using Heteroboxd.Models.Enums;
using System.Diagnostics.Eventing.Reader;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.AspNetCore.Identity;

namespace Heteroboxd.Service
{
    public interface IUserService
    {
        Task<List<UserInfoResponse>> GetAllUsers();
        Task<UserInfoResponse?> GetUser(string UserId);
        Task<Watchlist> GetWatchlist(string UserId);
        Task<Dictionary<string, FilmInfoResponse?>> GetFavorites(string UserId);
        Task<Dictionary<string, List<UserInfoResponse>>> GetRelationships(string UserId); //example: {"following": [User1, User2, User3], "followers": [User2], "blocked": [User4, User5]}
        Task<List<Report>> GetReports(string UserId);
        Task<Dictionary<string, IEnumerable<object>>> GetLikes(string UserId); //example: {"likedReviews": [Review1, Review2], "likedComments": [Comment1, Comment2], "likedLists": [List1, List2]}
        Task<List<UserInfoResponse>> SearchUsers(string SearchName);
        Task ReportUser(ReportUserRequest ReportRequest);
        Task UpdateUser(UpdateUserRequest UserUpdate);
        Task VerifyUser(String UserId, String Token);
        Task UpdateWatchlist(string UserId, string FilmId);
        Task UpdateFavorites(string UserId, List<string> FilmIds);
        Task UpdateRelationship(string UserId, string TargetId, string Action);
        Task UpdateLikes(UpdateUserLikesRequest LikeRequest);
        Task TrackFilm(string UserId, string FilmId, string Action);
        Task LogicalDeleteUser(string UserId);
    }

    public class UserService : IUserService
    {
        private readonly IUserRepository _repo;
        private readonly IFilmRepository _filmRepo;
        private readonly IAuthService _authService;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<UserService> _logger;

        public UserService(IUserRepository repo, IFilmRepository filmRepo, IAuthService authService, UserManager<User> userManager, ILogger<UserService> logger)
        {
            _repo = repo;
            _filmRepo = filmRepo;
            _authService = authService;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<List<UserInfoResponse>> GetAllUsers()
        {
            var AllUsers = await _repo.GetAllAsync();
            return AllUsers.Select(u => new UserInfoResponse(u)).ToList();
        }

        public async Task<UserInfoResponse?> GetUser(string UserId)
        {
            if (!Guid.TryParse(UserId, out var Id))
            {
                _logger.LogError($"Failed to parse UserId: {UserId}; invalid.");
                throw new ArgumentException();
            }
            var User = await _repo.GetByIdAsync(Guid.Parse(UserId));
            if (User == null)
            {
                _logger.LogError($"User with Id: {UserId} not found.");
                return null;
            }
            return new UserInfoResponse(User);
        }

        public async Task<Watchlist> GetWatchlist(string UserId)
        {
            var Watchlist = await _repo.GetUserWatchlistAsync(Guid.Parse(UserId));
            if (Watchlist == null) throw new ArgumentException();
            return Watchlist;
        }

        public async Task<Dictionary<string, FilmInfoResponse?>> GetFavorites(string UserId)
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

            FilmInfoResponse? Film1IR = null;
            FilmInfoResponse? Film2IR = null;
            FilmInfoResponse? Film3IR = null;
            FilmInfoResponse? Film4IR = null;

            if (Favorites.Film1 != null)
            {
                var Film1 = await _filmRepo.GetByIdAsync(Favorites.Film1.Value);
                if (Film1 == null)
                {
                    _logger.LogError($"Failed to find Film: {Favorites.Film1.Value}");
                    throw new KeyNotFoundException();
                }
                Film1IR = new FilmInfoResponse(Film1, false);
            }

            if (Favorites.Film2 != null)
            {
                var Film2 = await _filmRepo.GetByIdAsync(Favorites.Film2.Value);
                if (Film2 == null)
                {
                    _logger.LogError($"Failed to find Film: {Favorites.Film2.Value}");
                    throw new KeyNotFoundException();
                }
                Film2IR = new FilmInfoResponse(Film2, false);
            }

            if (Favorites.Film3 != null)
            {
                var Film3 = await _filmRepo.GetByIdAsync(Favorites.Film3.Value);
                if (Film3 == null)
                {
                    _logger.LogError($"Failed to find Film: {Favorites.Film3.Value}");
                    throw new KeyNotFoundException();
                }
                Film3IR = new FilmInfoResponse(Film3, false);
            }

            if (Favorites.Film4 != null)
            {
                var Film4 = await _filmRepo.GetByIdAsync(Favorites.Film4.Value);
                if (Film4 == null)
                {
                    _logger.LogError($"Failed to find Film: {Favorites.Film4.Value}");
                    throw new KeyNotFoundException();
                }
                Film4IR = new FilmInfoResponse(Film4, false);
            }

            return new Dictionary<string, FilmInfoResponse?>
            {
                {"1", Film1IR},
                {"2", Film2IR},
                {"3", Film3IR},
                {"4", Film4IR}
            };
        }


        public async Task<Dictionary<string, List<UserInfoResponse>>> GetRelationships(string UserId)
        {
            var _following = await _repo.GetFollowing(Guid.Parse(UserId));
            var _followers = await _repo.GetFollowers(Guid.Parse(UserId));
            var _blocked = await _repo.GetBlocked(Guid.Parse(UserId));

            if (_following == null || _followers == null || _blocked == null) throw new KeyNotFoundException();

            return new Dictionary<string, List<UserInfoResponse>>
            {
                { "following", _following.Following.Select(u => new UserInfoResponse(u)).ToList() },
                { "followers", _followers.Followers.Select(u => new UserInfoResponse(u)).ToList() },
                { "blocked", _blocked.Blocked.Select(u => new UserInfoResponse(u)).ToList() }
            };
        }

        public async Task<List<Report>> GetReports(string UserId)
        {
            var Reports = await _repo.GetUserReportsAsync(Guid.Parse(UserId));
            if (Reports == null) throw new KeyNotFoundException();
            return Reports;
        }

        public async Task<Dictionary<string, IEnumerable<object>>> GetLikes(string UserId)
        {
            var _likedReviews = await _repo.GetUserLikedReviewsAsync(Guid.Parse(UserId));
            var _likedComments = await _repo.GetUserLikedCommentsAsync(Guid.Parse(UserId));
            var _likedLists = await _repo.GetUserLikedListsAsync(Guid.Parse(UserId));

            if (_likedComments == null || _likedLists == null || _likedReviews == null) throw new KeyNotFoundException();

            var TaskedReviews = _likedReviews.LikedReviews.Select(async r =>
            {
                var Author = await _repo.GetByIdAsync(r.AuthorId);
                var Film = await _filmRepo.GetByIdAsync(r.FilmId);
                if (Author == null || Film == null) throw new KeyNotFoundException();
                return new ReviewInfoResponse(r, Author, Film);
            });

            var TaskedComments = _likedComments.LikedComments.Select(async c =>
            {
                var Author = await _repo.GetByIdAsync(c.AuthorId);
                if (Author == null) throw new KeyNotFoundException();
                return new CommentInfoResponse(c, Author);
            });

            var TaskedLists = _likedLists.LikedLists.Select(async ul =>
            {
                var Author = await _repo.GetByIdAsync(ul.AuthorId);
                if (Author == null) throw new KeyNotFoundException();
                return new UserListInfoResponse(ul, Author);
            });

            var LikedReviews = await Task.WhenAll(TaskedReviews);
            var LikedComments = await Task.WhenAll(TaskedComments);
            var LikedLists = await Task.WhenAll(TaskedLists);

            return new Dictionary<string, IEnumerable<object>>
            {
                { "liked_reviews", LikedReviews },
                { "liked_comments", LikedComments },
                { "liked_lists", LikedLists }
            };
        }

        public async Task<List<UserInfoResponse>> SearchUsers(string SearchName)
        {
            var Users = await _repo.SearchAsync(SearchName);
            return Users.Select(u => new UserInfoResponse(u)).ToList();
        }

        public async Task ReportUser(ReportUserRequest ReportRequest)
        {
            Report Report = new Report((Reason)Enum.Parse(typeof(Reason), ReportRequest.Reason, true), ReportRequest.Description, Guid.Parse(ReportRequest.TargetId));
            _repo.CreateReport(Report);
            await _repo.SaveChangesAsync();
        }

        public async Task UpdateUser(UpdateUserRequest UserUpdate)
        {
            var User = await _repo.GetByIdAsync(Guid.Parse(UserUpdate.UserId));
            if (User == null) throw new KeyNotFoundException();
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

        public async Task UpdateWatchlist(string UserId, string FilmId)
        {
            var Watchlist = await _repo.GetUserWatchlistAsync(Guid.Parse(UserId));
            var Film = await _filmRepo.GetByIdAsync(Guid.Parse(FilmId));
            if (Watchlist == null || Film == null) throw new KeyNotFoundException();
            Watchlist.Films.Add(new ListEntry(Film.Id, null, Watchlist.Id, null));
            _repo.UpdateWatchlist(Watchlist);
            await _repo.SaveChangesAsync();
        }

        public async Task UpdateFavorites(string UserId, List<string> FilmIds)
        {
            var UserFavorites = await _repo.GetUserFavoritesAsync(Guid.Parse(UserId));
            if (UserFavorites == null) throw new KeyNotFoundException();

            if (string.IsNullOrEmpty(FilmIds[0]))
            {
                UserFavorites.Film1 = null;
            }
            else
            {
                var Film = await _filmRepo.GetByIdAsync(Guid.Parse(FilmIds[0]));
                if (Film == null) throw new KeyNotFoundException();
                UserFavorites.Film1 = Film.Id;
            }

            if (string.IsNullOrEmpty(FilmIds[1]))
            {
                UserFavorites.Film2 = null;
            }
            else
            {
                var Film = await _filmRepo.GetByIdAsync(Guid.Parse(FilmIds[1]));
                if (Film == null) throw new KeyNotFoundException();
                UserFavorites.Film2 = Film.Id;
            }

            if (string.IsNullOrEmpty(FilmIds[2]))
            {
                UserFavorites.Film3 = null;
            }
            else
            {
                var Film = await _filmRepo.GetByIdAsync(Guid.Parse(FilmIds[2]));
                if (Film == null) throw new KeyNotFoundException();
                UserFavorites.Film3 = Film.Id;
            }

            if (string.IsNullOrEmpty(FilmIds[3]))
            {
                UserFavorites.Film4 = null;
            }
            else
            {
                var Film = await _filmRepo.GetByIdAsync(Guid.Parse(FilmIds[3]));
                if (Film == null) throw new KeyNotFoundException();
                UserFavorites.Film4 = Film.Id;
            }

            _repo.UpdateFavorites(UserFavorites);
            await _repo.SaveChangesAsync();
        }

        public async Task UpdateRelationship(string UserId, string TargetId, string Action)
        {
            switch(Action)
            {
                case ("follow-unfollow"):
                    await _repo.FollowUnfollowAsync(Guid.Parse(UserId), Guid.Parse(TargetId));
                    await _repo.SaveChangesAsync();
                    break;
                case ("block-unblock"):
                    await _repo.BlockUnblockAsync(Guid.Parse(UserId), Guid.Parse(TargetId));
                    await _repo.SaveChangesAsync();
                    break;
                case ("add-remove-follower"):
                    await _repo.FollowUnfollowAsync(Guid.Parse(TargetId), Guid.Parse(UserId));
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
            else if (LikeRequest.CommentId != null)
            {
                await _repo.UpdateLikedCommentsAsync(Guid.Parse(LikeRequest.UserId), Guid.Parse(LikeRequest.CommentId));
                await _repo.SaveChangesAsync();
            }
            else if (LikeRequest.ListId != null)
            {
                await _repo.UpdateLikedListsAsync(Guid.Parse(LikeRequest.UserId), Guid.Parse(LikeRequest.ListId));
                await _repo.SaveChangesAsync();
            }
            else throw new ArgumentNullException();
        }

        public async Task TrackFilm(string UserId, string FilmId, string Action)
        {
            var User = await _repo.GetByIdAsync(Guid.Parse(UserId));
            var Film = await _filmRepo.GetByIdAsync(Guid.Parse(FilmId));
            if (User == null || Film == null) throw new KeyNotFoundException();

            switch (Action)
            {
                case ("watched"):
                    UserWatchedFilm UserWatchedFilm = new UserWatchedFilm(User.Id, Film.Id);
                    _repo.CreateUserWatchedFilm(UserWatchedFilm);
                    await _repo.SaveChangesAsync();
                    break;
                case ("rewatched"):
                    var UserReWatchedFilm = await _repo.GetUserWatchedFilmAsync(User.Id, Film.Id);
                    if (UserReWatchedFilm == null) throw new KeyNotFoundException();
                    UserReWatchedFilm.TimesWatched++;
                    _repo.UpdateUserWatchedFilm(UserReWatchedFilm);
                    await _repo.SaveChangesAsync();
                    break;
                case ("unwatched"):
                    var UserUnWatchedFilm = await _repo.GetUserWatchedFilmAsync(User.Id, Film.Id);
                    if (UserUnWatchedFilm == null) throw new KeyNotFoundException();
                    UserUnWatchedFilm.TimesWatched--;
                    _repo.UpdateUserWatchedFilm(UserUnWatchedFilm);
                    await _repo.SaveChangesAsync();
                    break;
            }
        }

        public async Task LogicalDeleteUser(string UserId)
        {
            var User = await _repo.GetByIdAsync(Guid.Parse(UserId));
            if (User == null) throw new KeyNotFoundException();
            User.Deleted = true;
            _repo.Update(User);
            await _repo.SaveChangesAsync();
            await _authService.RevokeAllUserTokens(User.Id);
        }
    }
}
