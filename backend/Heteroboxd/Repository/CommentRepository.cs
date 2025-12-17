using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface ICommentRepository
    {
        Task<Comment?> GetByIdAsync(Guid Id);
        Task<List<Comment>> GetByReviewAsync(Guid ReviewId);
        Task ToggleNotificationsEfCore7Async(Guid CommentId);
        Task ReportEfCore7Async(Guid CommentId);
        void Create(Comment Comment);
        void Update(Comment Comment);
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

        public async Task<Comment?> GetByIdAsync(Guid Id) =>
            await _context.Comments
                .FirstOrDefaultAsync(c => c.Id == Id);

        public async Task<List<Comment>> GetByReviewAsync(Guid ReviewId) =>
            await _context.Comments
                .Where(c => c.ReviewId == ReviewId)
                .ToListAsync();

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

        public void Create(Comment Comment) =>
             _context.Comments
                .Add(Comment);

        public void Update(Comment Comment) =>
            _context.Comments
                .Update(Comment);

        public void Delete(Comment Comment) =>
            _context.Comments
                .Remove(Comment);

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
