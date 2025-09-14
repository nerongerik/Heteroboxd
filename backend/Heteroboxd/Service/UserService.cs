using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface IUserService
    {
        Task<List<UserInfoResponse>> GetAllUsers();
        Task<UserInfoResponse?> GetUser(string UserId);
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
            throw new NotImplementedException();
        }

        public async Task<UserInfoResponse?> GetUser(string UserId)
        {
            var User = await _repo.GetUserAsync(Guid.Parse(UserId));
            return User == null ? null : new UserInfoResponse(User);
        }
    }
}
