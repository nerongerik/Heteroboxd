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

            Comment Comment = new Comment(CommentRequest.Text, Flag(CommentRequest.Text), Guid.Parse(CommentRequest.AuthorId), Review.Id);
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

        private int Flag(string? Text)
        {
            if (string.IsNullOrWhiteSpace(Text)) return 0;

            string _text = Text.ToLowerInvariant().Trim();
            int Score = 0;

            //doxxing
            foreach (var p in AutoModerator.SocialPatterns)
            {
                if (_text.Contains(p) && (_text.Contains("add me") || _text.Contains("dm me") || _text.Contains("message me")))
                {
                    Score += AutoModerator.SocialMediaSolicitation;
                    break; //only flag once for doxxing
                }
            }
            //queershipping
            foreach (var p in AutoModerator.ShippingPatterns)
            {
                if (_text.Contains(p))
                {
                    Score += AutoModerator.Queershipping;
                    break; //only flag once for queershipping
                }
            }
            //simping
            int SimpCount = 0;
            foreach (var p in AutoModerator.SimpPatterns)
            {
                if (_text.Contains(p)) SimpCount++;
            }
            Score += SimpCount * AutoModerator.SimpingPerTerm;
            if (_text.Contains("ryan gosling")) Score = Math.Max(0, Score + AutoModerator.GoslingianForgiveness); //we are only human, after all
            //blasphemy
            int BlasphemyCount = 0;
            foreach (var p in AutoModerator.BlasphemyPatterns)
            {
                if (_text.Contains(p)) BlasphemyCount++;
            }
            Score += BlasphemyCount * AutoModerator.BlasphemyPerTerm;
            //one-liners, millenial humor, redditness...
            int WordCount = _text.Split(new[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries).Length;
            if (WordCount <= 5) Score += AutoModerator.VeryShortReview;
            else if (WordCount <= 12) Score += AutoModerator.ShortReview;
            if (_text.Count(c => c == '!' || c == '?' || c == '.') > 4 && WordCount < 20) Score += AutoModerator.MemeyPunctuation;
            //bonus
            if (WordCount >= 80) Score += AutoModerator.LongThoughtfulBonus;

            return Math.Max(0, Score);
        }
    }
}
