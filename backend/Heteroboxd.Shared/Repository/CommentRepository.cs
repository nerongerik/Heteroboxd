using Heteroboxd.Shared.Data;
using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Shared.Repository
{
    public enum CommentTombstoneResult
    {
        Success,
        NotFound,
        Forbidden
    }

    public interface ICommentRepository
    {
        Task<(List<JoinedCommentAuthor> Comments, int TotalCount)> GetAllAsync(int Page, int PageSize);
        Task<JoinedCommentAuthor?> GetByIdAsync(Guid CommentId);
        Task<Comment?> LightweightFetcherAsync(Guid CommentId);
        Task<bool> IsThreadRootInReviewAsync(Guid ThreadRootId, Guid ReviewId);
        Task<(List<JoinedCommentAuthor> Comments, int TotalCount, int ThreadCount)> GetByReviewAsync(Guid ReviewId, int Page, int PageSize);
        Task ReportAsync(Guid CommentId);
        Task CreateAsync(Comment Comment);
        Task<CommentTombstoneResult> TombstoneByAuthorAsync(Guid CommentId, Guid AuthorId);
        Task<bool> TombstoneByAdminAsync(Guid CommentId);
    }

    public class CommentRepository : ICommentRepository
    {
        private readonly HeteroboxdContext _context;

        public CommentRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<(List<JoinedCommentAuthor> Comments, int TotalCount)> GetAllAsync(int Page, int PageSize)
        {
            var CommentQuery = _context.Comments
                .AsNoTracking()
                .GroupJoin(_context.Users, c => c.AuthorId, u => (Guid?)u.Id, (c, Authors) => new { c, Authors })
                .SelectMany(x => x.Authors.DefaultIfEmpty(), (x, Author) => new { x.c, u = Author })
                .GroupJoin(_context.Users, x => x.c.RepliedUserId, u => (Guid?)u.Id, (x, RepliedUsers) => new { x.c, x.u, RepliedUsers })
                .SelectMany(x => x.RepliedUsers.DefaultIfEmpty(), (x, RepliedUser) => new { x.c, x.u, RepliedUserName = RepliedUser == null ? null : RepliedUser.UserName })
                .OrderByDescending(x => x.c.Flags).ThenBy(x => x.c.Id);
            var TotalCount = await CommentQuery.CountAsync();
            var Responses = await CommentQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinedCommentAuthor(x.c, x.u, x.RepliedUserName))
                .ToListAsync();
            return (Responses, TotalCount);
        }

        public async Task<JoinedCommentAuthor?> GetByIdAsync(Guid CommentId)
        {
            var Response = await _context.Comments
                .AsNoTracking()
                .Where(c => c.Id == CommentId)
                .GroupJoin(_context.Users, c => c.AuthorId, u => (Guid?)u.Id, (c, Authors) => new { c, Authors })
                .SelectMany(x => x.Authors.DefaultIfEmpty(), (x, Author) => new { x.c, u = Author })
                .GroupJoin(_context.Users, x => x.c.RepliedUserId, u => (Guid?)u.Id, (x, RepliedUsers) => new { x.c, x.u, RepliedUsers })
                .SelectMany(x => x.RepliedUsers.DefaultIfEmpty(), (x, RepliedUser) => new { x.c, x.u, RepliedUserName = RepliedUser == null ? null : RepliedUser.UserName })
                .FirstOrDefaultAsync();
            return Response == null ? null : new JoinedCommentAuthor(Response.c, Response.u, Response.RepliedUserName);
        }

        public async Task<Comment?> LightweightFetcherAsync(Guid CommentId) =>
            await _context.Comments
                .AsNoTracking()
                .Where(c => c.Id == CommentId)
                .FirstOrDefaultAsync();

        public async Task<bool> IsThreadRootInReviewAsync(Guid ThreadRootId, Guid ReviewId) =>
            await _context.Comments
                .AsNoTracking()
                .AnyAsync(c => c.Id == ThreadRootId
                    && c.ReviewId == ReviewId
                    && c.ThreadRootId == null);

        public async Task<(List<JoinedCommentAuthor> Comments, int TotalCount, int ThreadCount)> GetByReviewAsync(Guid ReviewId, int Page, int PageSize)
        {
            var ReviewComments = _context.Comments
                .AsNoTracking()
                .Where(c => c.ReviewId == ReviewId);

            var TotalCount = await ReviewComments.CountAsync();
            var ThreadCount = await ReviewComments.CountAsync(c => c.ThreadRootId == null);

            var ThreadRootIds = await ReviewComments
                .Where(c => c.ThreadRootId == null)
                .OrderBy(c => c.Date)
                .ThenBy(c => c.Id)
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(c => c.Id)
                .ToListAsync();

            var ReviewQuery = ReviewComments
                .Where(c => ThreadRootIds.Contains(c.Id)
                    || (c.ThreadRootId.HasValue && ThreadRootIds.Contains(c.ThreadRootId.Value)))
                .GroupJoin(_context.Users, c => c.AuthorId, u => (Guid?)u.Id, (c, Authors) => new { c, Authors })
                .SelectMany(x => x.Authors.DefaultIfEmpty(), (x, Author) => new { x.c, u = Author })
                .GroupJoin(_context.Users, x => x.c.RepliedUserId, u => (Guid?)u.Id, (x, RepliedUsers) => new { x.c, x.u, RepliedUsers })
                .SelectMany(x => x.RepliedUsers.DefaultIfEmpty(), (x, RepliedUser) => new { x.c, x.u, RepliedUserName = RepliedUser == null ? null : RepliedUser.UserName })
                .OrderBy(x => x.c.Date).ThenBy(x => x.c.Id);

            var Responses = await ReviewQuery
                .Select(x => new JoinedCommentAuthor(x.c, x.u, x.RepliedUserName))
                .ToListAsync();

            var ThreadOrder = ThreadRootIds
                .Select((Id, Index) => new { Id, Index })
                .ToDictionary(x => x.Id, x => x.Index);
            var OrderedResponses = Responses
                .OrderBy(x => ThreadOrder[x.Item.ThreadRootId ?? x.Item.Id])
                .ThenBy(x => x.Item.ThreadRootId.HasValue ? 1 : 0)
                .ThenBy(x => x.Item.Date)
                .ThenBy(x => x.Item.Id)
                .ToList();

            return (OrderedResponses, TotalCount, ThreadCount);
        }

        public async Task ReportAsync(Guid CommentId)
        {
            var Rows = await _context.Comments
                .Where(c => c.Id == CommentId && c.Tombstone == null)
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

        public async Task<CommentTombstoneResult> TombstoneByAuthorAsync(Guid CommentId, Guid AuthorId)
        {
            var Rows = await _context.Comments
                .Where(c => c.Id == CommentId && c.AuthorId == AuthorId && c.Tombstone == null)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(c => c.Text, "")
                    .SetProperty(c => c.Tombstone, Heteroboxd.Shared.Models.Enums.Tombstone.DeletedByAuthor));

            if (Rows > 0) return CommentTombstoneResult.Success;

            var Comment = await _context.Comments
                .AsNoTracking()
                .Where(c => c.Id == CommentId)
                .Select(c => new { c.AuthorId, c.Tombstone })
                .FirstOrDefaultAsync();

            if (Comment == null || !Comment.AuthorId.HasValue || Comment.Tombstone != null)
            {
                return CommentTombstoneResult.NotFound;
            }

            return CommentTombstoneResult.Forbidden;
        }

        public async Task<bool> TombstoneByAdminAsync(Guid CommentId)
        {
            var Rows = await _context.Comments
                .Where(c => c.Id == CommentId && c.Tombstone == null)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(c => c.Text, "")
                    .SetProperty(c => c.Tombstone, Heteroboxd.Shared.Models.Enums.Tombstone.DeletedByAdmin));

            return Rows > 0;
        }
    }
}
