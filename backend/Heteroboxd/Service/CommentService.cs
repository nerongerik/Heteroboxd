using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface ICommentService
    {
        Task<List<CommentInfoResponse>> GetAllComments();
        Task<CommentInfoResponse?> GetComment(string CommentId);
        Task<List<CommentInfoResponse>> GetCommentsByReview(string ReviewId);
        Task<List<CommentInfoResponse>> GetCommentsByAuthor(string UserId);
        Task CreateComment(CreateCommentRequest CommentRequest);
        Task UpdateComment(UpdateCommentRequest CommentRequest);
        Task UpdateCommentLikeCountEfCore7Async(string CommentId, string LikeChange);
        Task ToggleNotificationsEfCore7Async(string CommentId);
        Task ReportCommentEfCore7Async(string CommentId);
        Task LogicalDeleteComment(string CommentId);
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

        public async Task<List<CommentInfoResponse>> GetAllComments()
        {
            var AllComments = await _repo.GetAllAsync();
            return AllComments.Select(c => new CommentInfoResponse(c)).ToList();
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

        public async Task<List<CommentInfoResponse>> GetCommentsByAuthor(string UserId)
        {
            var UsersComments = await _repo.GetByAuthorAsync(Guid.Parse(UserId));
            return UsersComments.Select(c => new CommentInfoResponse(c)).ToList();
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

        public async Task UpdateCommentLikeCountEfCore7Async(string CommentId, string LikeChange)
        {
            if (!Guid.TryParse(CommentId, out var Id)) throw new ArgumentException();
            if (!int.TryParse(LikeChange, out var Delta)) throw new ArgumentException();
            await _repo.UpdateLikeCountEfCore7Async(Id, Delta);
        }

        public async Task ToggleNotificationsEfCore7Async(string CommentId)
        {
            if (!Guid.TryParse(CommentId, out var Id)) throw new ArgumentException();
            await _repo.ToggleNotificationsEfCore7Async(Id);
        }

        public async Task ReportCommentEfCore7Async(string CommentId)
        {
            if (!Guid.TryParse(CommentId, out var Id)) throw new ArgumentException();
            await _repo.ReportEfCore7Async(Id);
        }

        public async Task LogicalDeleteComment(string CommentId)
        {
            var Comment = await _repo.GetByIdAsync(Guid.Parse(CommentId));
            if (Comment == null) throw new KeyNotFoundException();
            Comment.Deleted = true;
            _repo.Update(Comment);
            await _repo.SaveChangesAsync();
        }
    }
}
