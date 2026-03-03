using Heteroboxd.Data;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface ICommentRepository
    {
        Task<Comment?> GetByIdAsync(Guid CommentId);
        Task<(List<JoinResponse<Comment, User>> Comments, int TotalCount)> GetByReviewAsync(Guid ReviewId, int Page, int PageSize);
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

        public async Task<(List<JoinResponse<Comment, User>> Comments, int TotalCount)> GetByReviewAsync(Guid ReviewId, int Page, int PageSize)
        {
            var ReviewQuery = _context.Comments
                .Where(c => c.ReviewId == ReviewId)
                .Join(_context.Users, c => c.AuthorId, u => u.Id, (c, u) => new { c, u })
                .OrderBy(x => x.c.Date);

            var TotalCount = await ReviewQuery.CountAsync();
            var Responses = await ReviewQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinResponse<Comment, User> { Item = x.c, Joined = x.u })
                .ToListAsync();

            return (Responses, TotalCount);
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
