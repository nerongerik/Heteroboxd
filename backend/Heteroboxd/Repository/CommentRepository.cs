using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface ICommentRepository
    {
        Task<Comment?> GetByIdAsync(Guid CommentId);
        Task<(List<Comment> Comments, int TotalCount)> GetByReviewAsync(Guid ReviewId, int Page, int PageSize);
        Task ReportEfCore7Async(Guid CommentId);
        void Create(Comment Comment);
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

        public async Task<Comment?> GetByIdAsync(Guid CommentId) =>
            await _context.Comments
                .FirstOrDefaultAsync(c => c.Id == CommentId);

        public async Task<(List<Comment> Comments, int TotalCount)> GetByReviewAsync(Guid ReviewId, int Page, int PageSize)
        {
            var ReviewQuery = _context.Comments
                .Where(c => c.ReviewId == ReviewId)
                .OrderBy(c => c.Date);

            var TotalCount = await ReviewQuery.CountAsync();

            var Comments = await ReviewQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            return (Comments, TotalCount);
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

        public void Delete(Comment Comment) =>
            _context.Comments
                .Remove(Comment);

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
