using Heteroboxd.Shared.Repository;

namespace Heteroboxd.API.Service
{
    public interface IPushTokenService
    {
        Task Register(string UserId, string Token);
        Task<bool> Delete(string UserId, string Token);
    }

    public class PushTokenService : IPushTokenService
    {
        private readonly IPushTokenRepository _repo;

        public PushTokenService(IPushTokenRepository repo)
        {
            _repo = repo;
        }

        public async Task Register(string UserId, string Token)
        {
            if (string.IsNullOrWhiteSpace(Token)) throw new ArgumentException();

            await _repo.UpsertAsync(Guid.Parse(UserId), Token);
        }

        public async Task<bool> Delete(string UserId, string Token)
        {
            if (string.IsNullOrWhiteSpace(Token)) throw new ArgumentException();

            return await _repo.DeleteOwnedAsync(Guid.Parse(UserId), Token);
        }
    }
}
