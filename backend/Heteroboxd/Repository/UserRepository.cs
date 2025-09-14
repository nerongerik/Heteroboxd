using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface IUserRepository
    {
        Task<User?> GetUserAsync(Guid Id);
    }

    public class UserRepository : IUserRepository
    {
        private readonly HeteroboxdContext _context;

        public UserRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<User?> GetUserAsync(Guid Id) =>
            await _context.Users
                .FirstOrDefaultAsync(u => u.Id == Id && !u.Deleted);
    }
}
