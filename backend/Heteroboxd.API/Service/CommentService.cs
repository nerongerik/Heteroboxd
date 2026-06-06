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
        Task DeleteComment(string CommentId);
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
            return new CommentInfoResponse(Response.Item, Response.Joined);
        }

        public async Task<PagedResponse<CommentInfoResponse>> GetComments(int Page, int PageSize)
        {
            var (Responses, TotalCount) = await _repo.GetAllAsync(Page, PageSize);
            return new PagedResponse<CommentInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                Items = Responses.Select(x => new CommentInfoResponse(x.Item, x.Joined)).ToList()
            };
        }

        public async Task<PagedResponse<CommentInfoResponse>> GetCommentsByReview(string ReviewId, int Page, int PageSize)
        {
            var Review = await _reviewRepo.GetByIdAsync(Guid.Parse(ReviewId));
            if (Review == null) return new PagedResponse<CommentInfoResponse> { TotalCount = 0, Page = 1, Items = new() };

            var (Responses, TotalCount) = await _repo.GetByReviewAsync(Review.Id, Page, PageSize);
            return new PagedResponse<CommentInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                Items = Responses.Select(x => new CommentInfoResponse(x.Item, x.Joined)).ToList()
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

            await _repo.CreateAsync(new Comment(CommentRequest.Text, Guid.Parse(CommentRequest.AuthorId), Review.Id));
            await _reviewRepo.UpdateCommentCountAsync(Review.Id, 1);

            if (!Review.NotificationsOn || Review.AuthorId == Guid.Parse(CommentRequest.AuthorId)) return;
            await _notificationService.AddNotification(
                $"{TruncateName(CommentRequest.AuthorName)} commented on your review of {TruncateTitle(CommentRequest.FilmTitle)}",
                Review.AuthorId
            );
        }

        public async Task DeleteComment(string CommentId)
        {
            var Comment = await _repo.LightweightFetcherAsync(Guid.Parse(CommentId));
            if (Comment == null) throw new KeyNotFoundException();

            await _repo.DeleteAsync(Comment.Id);
            await _reviewRepo.UpdateCommentCountAsync(Comment.ReviewId, -1);
        }

        private string TruncateName(string Name, int MaxLength = 25) =>
             Name.Length <= MaxLength ? Name : $"{Name[..MaxLength]}...";

        private string TruncateTitle(string Title, int MaxLength = 50) =>
             Title.Length <= MaxLength ? $"\"{Title}\"" : $"\"{Title[..MaxLength]}...\"";
    }
}
