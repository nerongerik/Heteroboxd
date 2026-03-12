using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface IAuthRepository
    {
        Task<List<Country>> GetCountriesAsync();
        Task CreateAsync(RefreshToken Token);
        Task<RefreshToken?> GetValidAsync(string Token);
        Task<Guid?> UseAsync(string Token);
        Task InvalidateAsync(Guid UserId, string Token);
        Task RevokeAllByUserAsync(Guid UserId);
    }

    public class AuthRepository : IAuthRepository
    {
        private readonly HeteroboxdContext _context;

        public AuthRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<List<Country>> GetCountriesAsync() =>
            await _context.Countries
                .AsNoTracking()
                .ToListAsync();

        public async Task CreateAsync(RefreshToken Token)
        {
            _context.RefreshTokens.Add(Token);
            await _context.SaveChangesAsync();
        }

        public async Task<RefreshToken?> GetValidAsync(string Token) =>
            await _context.RefreshTokens
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Token == Token && !t.Used && !t.Revoked && t.Expires > DateTime.UtcNow);

        public async Task<Guid?> UseAsync(string Token)
        {
            var Used = await _context.RefreshTokens
                .Where(t => t.Token == Token && !t.Used && !t.Revoked && t.Expires > DateTime.UtcNow)
                .FirstOrDefaultAsync();

            if (Used == null) return null;

            Used.Used = true;
            await _context.SaveChangesAsync();

            return Used.UserId;
        }

        public async Task InvalidateAsync(Guid UserId, string Token) =>
            await _context.RefreshTokens
                .Where(t => t.UserId == UserId && t.Token == Token && !t.Used && !t.Revoked && t.Expires > DateTime.UtcNow)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.Revoked, true));

        public async Task RevokeAllByUserAsync(Guid UserId) =>
            await _context.RefreshTokens
                .Where(t => t.UserId == UserId && !t.Revoked)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.Revoked, true));
    }
}
