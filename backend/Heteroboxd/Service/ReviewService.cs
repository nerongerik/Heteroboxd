using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;
using System.ComponentModel;

namespace Heteroboxd.Service
{
    public interface IReviewService
    {
        Task<List<ReviewInfoResponse>> GetAllReviews();
        Task<ReviewInfoResponse?> GetReview(string ReviewId);
        Task<List<ReviewInfoResponse>> GetReviewsByFilm(string FilmId);
        Task<List<ReviewInfoResponse>> GetReviewsByAuthor(string UserId);
        Task CreateReview(CreateReviewRequest ReviewRequest);
        Task UpdateReview(UpdateReviewRequest ReviewRequest);
        Task UpdateReviewLikeCountEfCore7Async(string ReviewId, string LikeChange);
        Task ToggleNotificationsEfCore7Async(string ReviewId);
        Task ReportReviewEfCore7Async(string ReviewId);
        Task LogicalDeleteReview(string ReviewId);
    }
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _repo;
        private readonly IUserRepository _userRepo;
        private readonly IFilmRepository _filmRepo;

        public ReviewService(IReviewRepository repo, IUserRepository userRepo, IFilmRepository filmRepo)
        {
            _repo = repo;
            _userRepo = userRepo;
            _filmRepo = filmRepo;
        }

        public async Task<List<ReviewInfoResponse>> GetAllReviews()
        {
            var AllReviews = await _repo.GetAllAsync();
            return AllReviews.Select(r => new ReviewInfoResponse(r)).ToList();
        }

        public async Task<ReviewInfoResponse?> GetReview(string ReviewId)
        {
            var Review = await _repo.GetByIdAsync(Guid.Parse(ReviewId));
            if (Review == null) throw new KeyNotFoundException();
            User Author = await _userRepo.GetByIdAsync(Review.AuthorId);
            if (Author == null) throw new KeyNotFoundException();
            Film Film = await _filmRepo.GetByIdAsync(Review.FilmId);
            if (Film == null) throw new KeyNotFoundException();
            return new ReviewInfoResponse(Review, Author, Film);
        }

        public async Task<List<ReviewInfoResponse>> GetReviewsByFilm(string FilmId)
        {
            var FilmReviews = await _repo.GetByFilmAsync(Guid.Parse(FilmId));

            var ReviewTasks = FilmReviews.Select(async r =>
            {
                var Author = await _userRepo.GetByIdAsync(r.AuthorId);
                if (Author == null) throw new KeyNotFoundException();
                return new ReviewInfoResponse(r, Author);
            });

            var Reviews = await Task.WhenAll(ReviewTasks);
            return Reviews.ToList();
        }

        public async Task<List<ReviewInfoResponse>> GetReviewsByAuthor(string UserId)
        {
            var UserReviews = await _repo.GetByAuthorAsync(Guid.Parse(UserId));

            var ReviewTasks = UserReviews.Select(async r =>
            {
                var Film = await _filmRepo.GetByIdAsync(r.FilmId);
                if (Film == null) throw new KeyNotFoundException();
                return new ReviewInfoResponse(r, Film);
            });

            var Reviews = await Task.WhenAll(ReviewTasks);
            return Reviews.ToList();
        }

        public async Task CreateReview(CreateReviewRequest ReviewRequest)
        {
            Review Review = new Review(ReviewRequest.Rating, ReviewRequest.Text, ReviewRequest.Flags, ReviewRequest.Spoiler, Guid.Parse(ReviewRequest.AuthorId), Guid.Parse(ReviewRequest.FilmId));
            _repo.Create(Review);
            await _repo.SaveChangesAsync();
        }

        public async Task UpdateReview(UpdateReviewRequest ReviewRequest)
        {
            var Review = await _repo.GetByIdAsync(Guid.Parse(ReviewRequest.ReviewId));
            if (Review == null) throw new KeyNotFoundException();
            Review.Rating = ReviewRequest.Rating ?? Review.Rating;
            Review.Text = ReviewRequest.Text ?? Review.Text;
            Review.Spoiler = ReviewRequest.Spoiler ?? Review.Spoiler;
            _repo.Update(Review);
            await _repo.SaveChangesAsync();
        }

        public async Task UpdateReviewLikeCountEfCore7Async(string ReviewId, string LikeChange)
        {
            if (!Guid.TryParse(ReviewId, out var Id)) throw new ArgumentException();
            if (!int.TryParse(LikeChange, out var Delta)) throw new ArgumentException();
            await _repo.UpdateReviewLikeCountEfCore7Async(Id, Delta);
        }

        public async Task ToggleNotificationsEfCore7Async(string ReviewId)
        {
            if (!Guid.TryParse(ReviewId, out var Id)) throw new ArgumentException();
            await _repo.ToggleNotificationsEfCore7Async(Id);
        }

        public async Task ReportReviewEfCore7Async(string ReviewId)
        {
            if (!Guid.TryParse(ReviewId, out var Id)) throw new ArgumentException();
            await _repo.ReportReviewEfCore7Async(Id);
        }

        public async Task LogicalDeleteReview(string ReviewId)
        {
            var Review = await _repo.GetByIdAsync(Guid.Parse(ReviewId));
            if (Review == null) throw new KeyNotFoundException();
            Review.Deleted = true;
            _repo.Update(Review);
            await _repo.SaveChangesAsync();
        }
    }
}
