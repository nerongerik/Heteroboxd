using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface ICommentRepository
    {
        Task<List<Comment>> GetAllAsync(CancellationToken CancellationToken = default);
        Task<Comment?> GetByIdAsync(Guid Id);
        Task<List<Comment>> GetByReviewAsync(Guid ReviewId);
        Task<List<Comment>> GetByAuthorAsync(Guid UserId);
        void Create(Comment Comment);
        void Update(Comment Comment);
        Task UpdateLikeCountEfCore7Async(Guid CommentId, int Delta);
        Task ToggleNotificationsEfCore7Async(Guid CommentId);
        Task ReportEfCore7Async(Guid CommentId);
        void Delete(Comment Comment);
        Task SaveChangesAsync();
    }

    public class CommentRepository : ICommentRepository
    {
        private readonly HeteroboxdContext _context;

        public CommentRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<List<Comment>> GetAllAsync(CancellationToken CancellationToken = default) =>
            await _context.Comments
                .Where(c => !c.Deleted)
                .ToListAsync(CancellationToken);

        public async Task<Comment?> GetByIdAsync(Guid Id) =>
            await _context.Comments
                .FirstOrDefaultAsync(c => c.Id == Id && !c.Deleted);

        public async Task<List<Comment>> GetByReviewAsync(Guid ReviewId) =>
            await _context.Comments
                .Where(c => c.ReviewId == ReviewId && !c.Deleted)
                .ToListAsync();

        public async Task<List<Comment>> GetByAuthorAsync(Guid UserId) =>
            await _context.Comments
                .Where(c => c.AuthorId == UserId && !c.Deleted)
                .ToListAsync();

        public void Create(Comment Comment)
        {
            _context.Comments
                .Add(Comment);
        }

        public void Update(Comment Comment)
        {
            _context.Comments
                .Update(Comment);
        }

        public async Task UpdateLikeCountEfCore7Async(Guid CommentId, int Delta) //increments/decrements like count
        {
            var Rows = await _context.Comments
                .Where(c => c.Id == CommentId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    c => c.LikeCount,
                    c => c.LikeCount + Delta
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task ToggleNotificationsEfCore7Async(Guid CommentId) //flips the boolean value of notifications on a review
        {
            var Rows = await _context.Comments
                .Where(c => c.Id == CommentId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    c => c.NotificationsOn,
                    c => !c.NotificationsOn
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task ReportEfCore7Async(Guid CommentId) //increments the flag count of a review
        {
            var Rows = await _context.Comments
                .Where(c => c.Id == CommentId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    c => c.Flags,
                    c => c.Flags + 1
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public void Delete(Comment Comment)
        {
            _context.Comments
                .Remove(Comment);
        }

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
