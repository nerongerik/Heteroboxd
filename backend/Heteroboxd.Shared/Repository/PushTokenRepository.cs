using Heteroboxd.Shared.Data;
using Heteroboxd.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Shared.Repository
{
    public interface IPushTokenRepository
    {
        Task UpsertAsync(Guid UserId, string Token);
        Task<bool> DeleteOwnedAsync(Guid UserId, string Token);
        Task<List<PushToken>> GetByUserIdsAsync(List<Guid> UserIds, CancellationToken CT = default);
        Task DeleteByTokensAsync(List<string> Tokens, CancellationToken CT = default);
    }

    public class PushTokenRepository : IPushTokenRepository
    {
        private readonly HeteroboxdContext _context;

        public PushTokenRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task UpsertAsync(Guid UserId, string Token)
        {
            var PushToken = new PushToken(UserId, Token);

            await _context.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO ""PushTokens"" (""Id"", ""UserId"", ""Token"", ""Date"")
                VALUES ({PushToken.Id}, {PushToken.UserId}, {PushToken.Token}, {PushToken.Date})
                ON CONFLICT (""Token"")
                DO UPDATE SET
                    ""UserId"" = EXCLUDED.""UserId"",
                    ""Date"" = EXCLUDED.""Date"";");
        }

        public async Task<bool> DeleteOwnedAsync(Guid UserId, string Token) =>
            await _context.PushTokens
                .Where(pt => pt.UserId == UserId && pt.Token == Token)
                .ExecuteDeleteAsync() > 0;

        public async Task<List<PushToken>> GetByUserIdsAsync(List<Guid> UserIds, CancellationToken CT = default)
        {
            if (UserIds.Count == 0) return new List<PushToken>();

            return await _context.PushTokens
                .AsNoTracking()
                .Where(pt => UserIds.Contains(pt.UserId))
                .ToListAsync(CT);
        }

        public async Task DeleteByTokensAsync(List<string> Tokens, CancellationToken CT = default)
        {
            if (Tokens.Count == 0) return;

            await _context.PushTokens
                .Where(pt => Tokens.Contains(pt.Token))
                .ExecuteDeleteAsync(CT);
        }
    }
}
