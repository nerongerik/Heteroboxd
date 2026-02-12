using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface IRefreshTokenRepository
    {
        Task<List<Country>> GetCountriesAsync();
        Task AddAsync(RefreshToken Token);
        Task<RefreshToken?> GetValidTokenAsync(string Token);
        Task<List<RefreshToken>> GetActiveTokensByUserAsync(Guid UserId);
        Task SaveChangesAsync();
    }

    public class RefreshTokenRepository : IRefreshTokenRepository
    {
        private readonly HeteroboxdContext _context;

        public RefreshTokenRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<List<Country>> GetCountriesAsync()
        {
            //there is 0 justification for this method to be here, but I ain't making a whole separate repo for one method bruh
            return await _context.Countries.ToListAsync();
        }

        public async Task AddAsync(RefreshToken Token)
        {
            await _context.RefreshTokens.AddAsync(Token);
        }

        public async Task<RefreshToken?> GetValidTokenAsync(string Token)
        {
            return await _context.RefreshTokens
                .FirstOrDefaultAsync(t => t.Token == Token && !t.Used && !t.Revoked && t.Expires > DateTime.UtcNow);
        }

        public async Task<List<RefreshToken>> GetActiveTokensByUserAsync(Guid UserId)
        {
            return await _context.RefreshTokens
                .Where(t => t.UserId == UserId && !t.Revoked)
                .ToListAsync();
        }

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
