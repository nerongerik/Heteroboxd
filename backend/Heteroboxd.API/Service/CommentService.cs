using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Models.DTO;
using Heteroboxd.Shared.Repository;
using System.Runtime.CompilerServices;

namespace Heteroboxd.API.Service
{
    public interface ICommentService
    {
        Task<CommentInfoResponse?> GetComment(string CommentId);
        Task<PagedResponse<CommentInfoResponse>> GetComments(int Page, int PageSize);
        Task<PagedResponse<CommentInfoResponse>> GetCommentsByReview(string ReviewId, int Page, int PageSize);
        Task ReportCommentEfCore7(string CommentId);
        Task CreateComment(CreateCommentRequest CommentRequest);
        Task DeleteComment(string CommentId, string AuthenticatedUserId);
        Task DeleteCommentAsAdmin(string CommentId);
    }

    public class CommentService : ICommentService
    {
        private readonly INotificationService _notificationService;
        private readonly ICommentRepository _repo;
        private readonly IReviewRepository _reviewRepo;
        private readonly IUserRepository _userRepo;

        public CommentService(ICommentRepository repo, IReviewRepository reviewRepo, INotificationService notificationService, IUserRepository userRepo)
        {
            _repo = repo;
            _reviewRepo = reviewRepo;
            _notificationService = notificationService;
            _userRepo = userRepo;
        }

        public async Task<CommentInfoResponse?> GetComment(string CommentId)
        {
            var Response = await _repo.GetByIdAsync(Guid.Parse(CommentId));
            if (Response == null) return null;
            return new CommentInfoResponse(Response.Item, Response.Joined, Response.RepliedUserName);
        }

        public async Task<PagedResponse<CommentInfoResponse>> GetComments(int Page, int PageSize)
        {
            var (Responses, TotalCount) = await _repo.GetAllAsync(Page, PageSize);
            return new PagedResponse<CommentInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                Items = Responses.Select(x => new CommentInfoResponse(x.Item, x.Joined, x.RepliedUserName)).ToList()
            };
        }

        public async Task<PagedResponse<CommentInfoResponse>> GetCommentsByReview(string ReviewId, int Page, int PageSize)
        {
            var Review = await _reviewRepo.GetByIdAsync(Guid.Parse(ReviewId));
            if (Review == null) return new PagedResponse<CommentInfoResponse> { TotalCount = 0, ThreadCount = 0, Page = 1, Items = new() };

            var (Responses, TotalCount, ThreadCount) = await _repo.GetByReviewAsync(Review.Id, Page, PageSize);
            return new PagedResponse<CommentInfoResponse>
            {
                TotalCount = TotalCount,
                ThreadCount = ThreadCount,
                Page = Page,
                Items = Responses.Select(x => new CommentInfoResponse(x.Item, x.Joined, x.RepliedUserName)).ToList()
            };
        }

        public async Task ReportCommentEfCore7(string CommentId) =>
            await _repo.ReportAsync(Guid.Parse(CommentId));

        public async Task CreateComment(CreateCommentRequest CommentRequest)
        {
            var User = await _userRepo.LightweightFetcherAsync(Guid.Parse(CommentRequest.AuthorId));
            if (User == null) throw new KeyNotFoundException();
            if (!User.EmailConfirmed) throw new InvalidOperationException();

            var Review = await _reviewRepo.GetByIdAsync(Guid.Parse(CommentRequest.ReviewId));
            if (Review == null) throw new KeyNotFoundException();

            Guid? RepliedCommentId = null;
            Guid? RepliedUserId = null;
            Guid? ThreadRootId = null;
            var HasRepliedComment = !string.IsNullOrWhiteSpace(CommentRequest.RepliedCommentId);
            var HasRepliedUser = !string.IsNullOrWhiteSpace(CommentRequest.RepliedUserId);
            if (HasRepliedComment != HasRepliedUser) throw new ArgumentException();

            var HasReplyPair = HasRepliedComment && HasRepliedUser;
            if (HasReplyPair)
            {
                if (!Guid.TryParse(CommentRequest.RepliedCommentId, out var ParsedRepliedCommentId)
                    || !Guid.TryParse(CommentRequest.RepliedUserId, out var ParsedRepliedUserId))
                {
                    throw new ArgumentException();
                }
                RepliedCommentId = ParsedRepliedCommentId;
                RepliedUserId = ParsedRepliedUserId;
            }
            if (RepliedCommentId.HasValue && RepliedUserId.HasValue)
            {
                var RepliedComment = await _repo.LightweightFetcherAsync(RepliedCommentId.Value);
                if (RepliedComment == null) throw new KeyNotFoundException();
                if (RepliedComment.Tombstone != null
                    || !RepliedComment.AuthorId.HasValue
                    || RepliedComment.ReviewId != Review.Id
                    || RepliedComment.AuthorId.Value != RepliedUserId.Value)
                {
                    throw new ArgumentException();
                }
                if (RepliedComment.ThreadRootId.HasValue
                    && !await _repo.IsThreadRootInReviewAsync(RepliedComment.ThreadRootId.Value, Review.Id))
                {
                    throw new ArgumentException();
                }
                ThreadRootId = RepliedComment.ThreadRootId ?? RepliedComment.Id;
            }

            await _repo.CreateAsync(new Comment(CommentRequest.Text, Guid.Parse(CommentRequest.AuthorId), Review.Id, RepliedCommentId, RepliedUserId, ThreadRootId));

            if (Review.NotificationsOn && Review.AuthorId != User.Id)
            {
                await _notificationService.AddNotification(
                    $"{TruncateName(CommentRequest.AuthorName)} commented on your review of {TruncateTitle(CommentRequest.FilmTitle)}",
                    Review.AuthorId
                );
            }
            if (RepliedUserId.HasValue)
            {
                await _notificationService.AddNotification(
                    $"{TruncateName(CommentRequest.AuthorName)} replied to your comment on the review of {TruncateTitle(CommentRequest.FilmTitle)}",
                    RepliedUserId.Value
                );
            }
        }

        public async Task DeleteComment(string CommentId, string AuthenticatedUserId)
        {
            var Result = await _repo.TombstoneByAuthorAsync(Guid.Parse(CommentId), Guid.Parse(AuthenticatedUserId));
            if (Result == CommentTombstoneResult.NotFound) throw new KeyNotFoundException();
            if (Result == CommentTombstoneResult.Forbidden) throw new UnauthorizedAccessException();
        }

        public async Task DeleteCommentAsAdmin(string CommentId)
        {
            var Tombstoned = await _repo.TombstoneByAdminAsync(Guid.Parse(CommentId));
            if (!Tombstoned) throw new KeyNotFoundException();
        }

        private string TruncateName(string Name, int MaxLength = 25) =>
             Name.Length <= MaxLength ? Name : $"{Name[..MaxLength]}...";

        private string TruncateTitle(string Title, int MaxLength = 50) =>
             Title.Length <= MaxLength ? $"\"{Title}\"" : $"\"{Title[..MaxLength]}...\"";
    }
}
