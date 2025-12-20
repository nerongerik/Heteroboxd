using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface IReviewRepository
    {
        Task<Review?> GetByIdAsync(Guid Id);
        Task<(List<Review> Reviews, int TotalCount)> GetByFilmAsync(int FilmId, int Page, int PageSize);
        Task<List<Review>> GetTopAsync(int FilmId, int Top);
        Task<(List<Review> Reviews, int TotalCount)> GetByAuthorAsync(Guid AuthorId, int Page, int PageSize);
        Task<Review?> GetByUserFilmAsync(Guid AuthorId, int FilmId);
        Task UpdateReviewLikeCountEfCore7Async(Guid ReviewId, int Delta);
        Task ToggleNotificationsEfCore7Async(Guid ReviewId);
        Task ReportReviewEfCore7Async(Guid ReviewId);
        void Create(Review Review);
        void Update(Review Review);
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

        public async Task<Review?> GetByIdAsync(Guid Id) =>
            await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == Id);

        public async Task<(List<Review> Reviews, int TotalCount)> GetByFilmAsync(int FilmId, int Page, int PageSize)
        {
            var FilmQuery = _context.Reviews
                .Where(r => r.FilmId == FilmId)
                .OrderBy(r => r.Flags).ThenByDescending(r => r.LikeCount).ThenBy(r => r.Date);

            var TotalCount = await FilmQuery.CountAsync();

            var Reviews = await FilmQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            return (Reviews, TotalCount);
        }

        public async Task<List<Review>> GetTopAsync(int FilmId, int Top) =>
            await _context.Reviews
                .Where(r => r.FilmId == FilmId && r.Text != null && !r.Spoiler)
                .OrderBy(r => r.Flags).ThenByDescending(r => r.LikeCount).ThenBy(r => r.Date)
                .Take(Top)
                .ToListAsync();

        public async Task<(List<Review> Reviews, int TotalCount)> GetByAuthorAsync(Guid AuthorId, int Page, int PageSize)
        {
            var UserQuery = _context.Reviews
                .Where(r => r.AuthorId == AuthorId)
                .OrderBy(r => r.Flags).ThenByDescending(r => r.LikeCount).ThenBy(r => r.Date);

            var TotalCount = await UserQuery.CountAsync();

            var Reviews = await UserQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            return (Reviews, TotalCount);
        }

        public async Task<Review?> GetByUserFilmAsync(Guid AuthorId, int FilmId) =>
            await _context.Reviews
                .FirstOrDefaultAsync(r => r.AuthorId == AuthorId && r.FilmId == FilmId);

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

        public void Create(Review Review) =>
            _context.Reviews
                .Add(Review);

        public void Update(Review Review) =>
            _context.Reviews
                .Update(Review);

        public void Delete(Review Review) =>
            _context.Reviews
                .Remove(Review);

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
