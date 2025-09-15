using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;
using Heteroboxd.Models;

namespace Heteroboxd.Service
{
    public interface IUserService
    {
        Task<List<UserInfoResponse>> GetAllUsers();
        Task<UserInfoResponse?> GetUser(string UserId);
        Task<Watchlist> GetWatchlist(string UserId);
        Task<UserFavorites> GetFavorites(string UserId);
        Task<HashSet<string>> GetRelationships(string UserId); //example: {"following": [User1, User2, User3], "followers": [User2], "blocked": [User4, User5]}
        Task<List<Report>> GetReports(string UserId);
        Task<HashSet<string>> GetLikes(string UserId); //example: {"likedReviews": [Review1, Review2], "likedComments": [Comment1, Comment2], "likedLists": [List1, List2]}
        Task<List<UserInfoResponse>> SearchUsers(string SearchName);
        Task ReportUser(ReportUserRequest ReportRequest);
        Task<UserInfoResponse?> UpdateUser(UpdateUserRequest UserUpdate);
        Task<Watchlist> UpdateWatchlist(string UserId, string FilmId);
        Task<UserFavorites> UpdateFavorites(string UserId, List<string> FilmIds);
        Task UpdateRelationship(string UserId, string TargetUserId, string Action);
        Task UpdateLikes(UpdateUserLikesRequest LikeRequest);
        Task TrackFilm(string UserId, string FilmId, string Action);
        Task LogicalDeleteUser(string UserId);

        //Task<UserInfoResponse?> CreateUser(CreateUserRequest NewUser);
    }

    public class UserService : IUserService
    {
        private readonly IUserRepository _repo;

        public UserService(IUserRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<UserInfoResponse>> GetAllUsers()
        {
            var AllUsers = await _repo.GetAllAsync();
            return AllUsers.Select(u => new UserInfoResponse(u)).ToList();
        }

        public async Task<UserInfoResponse?> GetUser(string UserId)
        {
            var User = await _repo.GetByIdAsync(Guid.Parse(UserId));
            return User == null ? null : new UserInfoResponse(User);
        }

        public async Task<Watchlist> GetWatchlist(string UserId)
        {
            throw new NotImplementedException();
        }

        public async Task<UserFavorites> GetFavorites(string UserId)
        {
            throw new NotImplementedException();
        }

        public async Task<HashSet<string>> GetRelationships(string UserId)
        {
            throw new NotImplementedException();
        }

        public async Task<List<Report>> GetReports(string UserId)
        {
            throw new NotImplementedException();
        }

        public async Task<HashSet<string>> GetLikes(string UserId)
        {
            throw new NotImplementedException();
        }

        public async Task<List<UserInfoResponse>> SearchUsers(string SearchName)
        {
            throw new NotImplementedException();
        }

        public async Task ReportUser(ReportUserRequest ReportRequest)
        {
            throw new NotImplementedException();
        }

        public async Task<UserInfoResponse?> UpdateUser(UpdateUserRequest UserUpdate)
        {
            throw new NotImplementedException();
        }

        public async Task<Watchlist> UpdateWatchlist(string UserId, string FilmId)
        {
            throw new NotImplementedException();
        }

        public async Task<UserFavorites> UpdateFavorites(string UserId, List<string> FilmIds)
        {
            throw new NotImplementedException();
        }

        public async Task UpdateRelationship(string UserId, string TargetUserId, string Action)
        {
            throw new NotImplementedException();
        }

        public async Task UpdateLikes(UpdateUserLikesRequest LikeRequest)
        {
            throw new NotImplementedException();
        }

        public async Task TrackFilm(string UserId, string FilmId, string Action)
        {
            throw new NotImplementedException();
        }

        public async Task LogicalDeleteUser(string UserId)
        {
            throw new NotImplementedException();
        }
    }
}
