using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface ICommentService
    {
        Task<CommentInfoResponse?> GetComment(string CommentId);
        Task<List<CommentInfoResponse>> GetCommentsByReview(string ReviewId);
        Task ToggleNotificationsEfCore7(string CommentId);
        Task ReportCommentEfCore7(string CommentId);
        Task CreateComment(CreateCommentRequest CommentRequest);
        Task UpdateComment(UpdateCommentRequest CommentRequest);
        Task DeleteComment(string CommentId);
    }

    public class CommentService : ICommentService
    {
        private readonly ICommentRepository _repo;
        private readonly IUserRepository _userRepo;
        private readonly IReviewRepository _reviewRepo;

        public CommentService(ICommentRepository repo, IUserRepository userRepo, IReviewRepository reviewRepo)
        {
            _repo = repo;
            _userRepo = userRepo;
            _reviewRepo = reviewRepo;
        }

        public async Task<CommentInfoResponse?> GetComment(string CommentId)
        {
            var Comment = await _repo.GetByIdAsync(Guid.Parse(CommentId));
            if (Comment == null) throw new KeyNotFoundException();
            var Author = await _userRepo.GetByIdAsync(Comment.AuthorId);
            if (Author == null) throw new KeyNotFoundException();
            return new CommentInfoResponse(Comment, Author);
        }

        public async Task<List<CommentInfoResponse>> GetCommentsByReview(string ReviewId)
        {
            var ReviewsComments = await _repo.GetByReviewAsync(Guid.Parse(ReviewId));

            var CommentTasks = ReviewsComments.Select(async c =>
            {
                var Author = await _userRepo.GetByIdAsync(c.AuthorId);
                if (Author == null) throw new KeyNotFoundException();
                return new CommentInfoResponse(c, Author);
            });

            var Comments = await Task.WhenAll(CommentTasks);
            return Comments.ToList();
        }

        public async Task ToggleNotificationsEfCore7(string CommentId)
        {
            if (!Guid.TryParse(CommentId, out var Id)) throw new ArgumentException();
            await _repo.ToggleNotificationsEfCore7Async(Id);
        }

        public async Task ReportCommentEfCore7(string CommentId)
        {
            if (!Guid.TryParse(CommentId, out var Id)) throw new ArgumentException();
            await _repo.ReportEfCore7Async(Id);
        }

        public async Task CreateComment(CreateCommentRequest CommentRequest)
        {
            Comment Comment = new Comment(CommentRequest.Text, CommentRequest.Flags, Guid.Parse(CommentRequest.AuthorId), Guid.Parse(CommentRequest.ReviewId));
            _repo.Create(Comment);
            await _repo.SaveChangesAsync();
        }

        public async Task UpdateComment(UpdateCommentRequest CommentRequest)
        {
            var Comment = await _repo.GetByIdAsync(Guid.Parse(CommentRequest.Id));
            if (Comment == null) throw new KeyNotFoundException();
            Comment.Text = CommentRequest.Text;
            _repo.Update(Comment);
            await _repo.SaveChangesAsync();
        }

        public async Task DeleteComment(string CommentId)
        {
            var Comment = await _repo.GetByIdAsync(Guid.Parse(CommentId));
            if (Comment == null) throw new KeyNotFoundException();
            _repo.Delete(Comment);
            await _repo.SaveChangesAsync();
        }
    }
}
