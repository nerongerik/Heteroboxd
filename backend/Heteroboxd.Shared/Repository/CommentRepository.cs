using Heteroboxd.Shared.Data;
using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Shared.Repository
{
    public interface ICommentRepository
    {
        Task<(List<JoinResponse<Comment, User>> Comments, int TotalCount)> GetAllAsync(int Page, int PageSize);
        Task<JoinResponse<Comment, User>?> GetByIdAsync(Guid CommentId);
        Task<Comment?> LightweightFetcherAsync(Guid CommentId);
        Task<(List<JoinResponse<Comment, User>> Comments, int TotalCount)> GetByReviewAsync(Guid ReviewId, int Page, int PageSize);
        Task ReportAsync(Guid CommentId);
        Task CreateAsync(Comment Comment);
        Task DeleteAsync(Guid CommentId);
    }

    public class CommentRepository : ICommentRepository
    {
        private readonly HeteroboxdContext _context;

        public CommentRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<(List<JoinResponse<Comment, User>> Comments, int TotalCount)> GetAllAsync(int Page, int PageSize)
        {
            var CommentQuery = _context.Comments
                .AsNoTracking()
                .Join(_context.Users, c => c.AuthorId, u => u.Id, (c, u) => new { c, u })
                .OrderByDescending(x => x.c.Flags).ThenBy(x => x.c.Id);
            var TotalCount = await CommentQuery.CountAsync();
            var Responses = await CommentQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinResponse<Comment, User> { Item = x.c, Joined = x.u })
                .ToListAsync();
            return (Responses, TotalCount);
        }

        public async Task<JoinResponse<Comment, User>?> GetByIdAsync(Guid CommentId)
        {
            var Response = await _context.Comments
                .AsNoTracking()
                .Where(c => c.Id == CommentId)
                .Join(_context.Users, c => c.AuthorId, u => u.Id, (c, u) => new { c, u })
                .FirstOrDefaultAsync();
            return Response == null ? null : new JoinResponse<Comment, User> { Item = Response.c, Joined = Response.u };
        }

        public async Task<Comment?> LightweightFetcherAsync(Guid CommentId) =>
            await _context.Comments
                .AsNoTracking()
                .Where(c => c.Id == CommentId)
                .FirstOrDefaultAsync();

        public async Task<(List<JoinResponse<Comment, User>> Comments, int TotalCount)> GetByReviewAsync(Guid ReviewId, int Page, int PageSize)
        {
            var ReviewQuery = _context.Comments
                .AsNoTracking()
                .Where(c => c.ReviewId == ReviewId)
                .Join(_context.Users, c => c.AuthorId, u => u.Id, (c, u) => new { c, u })
                .OrderBy(x => x.c.Date).ThenBy(x => x.c.Id);

            var TotalCount = await ReviewQuery.CountAsync();
            var Responses = await ReviewQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinResponse<Comment, User> { Item = x.c, Joined = x.u })
                .ToListAsync();

            return (Responses, TotalCount);
        }

        public async Task ReportAsync(Guid CommentId)
        {
            var Rows = await _context.Comments
                .Where(c => c.Id == CommentId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    c => c.Flags,
                    c => c.Flags + 1
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task CreateAsync(Comment Comment)
        {
            _context.Comments.Add(Comment);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid CommentId) =>
            await _context.Comments
                .Where(c => c.Id == CommentId)
                .ExecuteDeleteAsync();
    }
}
