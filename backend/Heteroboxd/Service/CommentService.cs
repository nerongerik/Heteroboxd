using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface ICommentService
    {
        Task<PagedResponse<CommentInfoResponse>> GetCommentsByReview(string ReviewId, int Page, int PageSize);
        Task ReportCommentEfCore7(string CommentId);
        Task CreateComment(CreateCommentRequest CommentRequest);
        Task DeleteComment(string CommentId);
    }

    public class CommentService : ICommentService
    {
        private readonly INotificationService _notificationService;
        private readonly ICommentRepository _repo;
        private readonly IUserRepository _userRepo;
        private readonly IReviewRepository _reviewRepo;

        public CommentService(ICommentRepository repo, IUserRepository userRepo, IReviewRepository reviewRepo, INotificationService notificationService)
        {
            _repo = repo;
            _userRepo = userRepo;
            _reviewRepo = reviewRepo;
            _notificationService = notificationService;
        }

        public async Task<PagedResponse<CommentInfoResponse>> GetCommentsByReview(string ReviewId, int Page, int PageSize)
        {
            Review? Review = await _reviewRepo.GetByIdAsync(Guid.Parse(ReviewId));
            if (Review == null) throw new KeyNotFoundException();

            var (Comments, TotalCount) = await _repo.GetByReviewAsync(Review.Id, Page, PageSize);

            var AuthorIds = Comments
                .Select(c => c.AuthorId)
                .Distinct()
                .ToList();
            var Authors = await _userRepo.GetByIdsAsync(AuthorIds);

            var AuthorLookup = Authors.ToDictionary(a => a.Id);

            var CommentResponses = new List<CommentInfoResponse>();

            foreach (Comment c in Comments)
            {
                if (!AuthorLookup.TryGetValue(c.AuthorId, out var Author))
                    continue;
                CommentResponses.Add(new CommentInfoResponse(c, Author));
            }

            return new PagedResponse<CommentInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = CommentResponses
            };
        }

        public async Task ReportCommentEfCore7(string CommentId)
        {
            if (!Guid.TryParse(CommentId, out Guid Id)) throw new ArgumentException();
            await _repo.ReportEfCore7Async(Id);
        }

        public async Task CreateComment(CreateCommentRequest CommentRequest)
        {
            Review? Review = await _reviewRepo.GetByIdAsync(Guid.Parse(CommentRequest.ReviewId));
            if (Review == null) throw new KeyNotFoundException();

            Comment Comment = new Comment(CommentRequest.Text, Guid.Parse(CommentRequest.AuthorId), Review.Id);
            _repo.Create(Comment);
            await _repo.SaveChangesAsync();

            if (!Review.NotificationsOn || Review.AuthorId == Guid.Parse(CommentRequest.AuthorId)) return;

            await _notificationService.AddNotification(
                $"{CommentRequest.AuthorName} commented on your review of {CommentRequest.FilmTitle}",
                Models.Enums.NotificationType.Comment,
                Review.AuthorId
            );
        }

        public async Task DeleteComment(string CommentId)
        {
            Comment? Comment = await _repo.GetByIdAsync(Guid.Parse(CommentId));
            if (Comment == null) throw new KeyNotFoundException();
            _repo.Delete(Comment);
            await _repo.SaveChangesAsync();
        }
    }
}
