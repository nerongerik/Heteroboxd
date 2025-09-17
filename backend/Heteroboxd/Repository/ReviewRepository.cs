using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface IReviewRepository
    {
        Task<List<Review>> GetAllAsync(CancellationToken CancellationToken = default);
        Task<Review?> GetByIdAsync(Guid Id);
        Task<List<Review>> GetByFilmAsync(Guid FilmId);
        Task<List<Review>> GetByAuthorAsync(Guid AuthorId);
        void Create(Review Review);
        void Update(Review Review);
        Task UpdateReviewLikeCountEfCore7Async(Guid ReviewId, int Delta);
        Task ToggleNotificationsEfCore7Async(Guid ReviewId);
        Task ReportReviewEfCore7Async(Guid ReviewId);
        void Delete(Review Review);
        Task SaveChangesAsync();
    }
    public class ReviewRepository : IReviewRepository
    {
        public readonly HeteroboxdContext _context;

        public ReviewRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<List<Review>> GetAllAsync(CancellationToken CancellationToken = default) =>
            await _context.Reviews
                .Where(r => !r.Deleted)
                .ToListAsync(CancellationToken);

        public async Task<Review?> GetByIdAsync(Guid Id) =>
            await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == Id && !r.Deleted);

        public async Task<List<Review>> GetByFilmAsync(Guid FilmId) =>
            await _context.Reviews
                .Where(r => r.FilmId == FilmId && !r.Deleted)
                .ToListAsync();

        public async Task<List<Review>> GetByAuthorAsync(Guid AuthorId) =>
            await _context.Reviews
                .Where(r => r.AuthorId == AuthorId && !r.Deleted)
                .ToListAsync();

        public void Create(Review Review)
        {
            _context.Reviews
                .Add(Review);
        }

        public void Update(Review Review)
        {
            _context.Reviews
                .Update(Review);
        }

        public async Task UpdateReviewLikeCountEfCore7Async(Guid ReviewId, int Delta) //increments/decrements like count
        {
            var Rows = await _context.Reviews
                .Where(r => r.Id == ReviewId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    r => r.LikeCount,
                    r => r.LikeCount + Delta
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task ToggleNotificationsEfCore7Async(Guid ReviewId) //flips the boolean value of notifications on a review
        {
            var Rows = await _context.Reviews
                .Where(r => r.Id == ReviewId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    r => r.NotificationsOn,
                    r => !r.NotificationsOn
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task ReportReviewEfCore7Async(Guid ReviewId) //increments the flag count of a review
        {
            var Rows = await _context.Reviews
                .Where(r => r.Id == ReviewId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    r => r.Flags,
                    r => r.Flags + 1
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public void Delete(Review Review) //used in big, weekly (or monthly) purge jobs, consider cascades and side effects later
        {
            _context.Reviews
                .Remove(Review);
        }

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
