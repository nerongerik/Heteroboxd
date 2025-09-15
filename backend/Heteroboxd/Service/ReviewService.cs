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
        Task<ReviewInfoResponse?> CreateReview(CreateReviewRequest ReviewRequest);
        Task<ReviewInfoResponse?> UpdateReview(UpdateReviewRequest ReviewRequest);
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
            return AllReviews.Select(review => new ReviewInfoResponse(review)).ToList();
        }

        public async Task<ReviewInfoResponse?> GetReview(string ReviewId)
        {
            var Review = await _repo.GetByIdAsync(Guid.Parse(ReviewId));
            return Review == null ? null : new ReviewInfoResponse(Review);
        }

        public async Task<List<ReviewInfoResponse>> GetReviewsByFilm(string FilmId)
        {
            var FilmsReviews = await _repo.GetByFilmAsync(Guid.Parse(FilmId));
            return FilmsReviews.Select(review => new ReviewInfoResponse(review)).ToList();
        }

        public async Task<List<ReviewInfoResponse>> GetReviewsByAuthor(string UserId)
        {
            var UsersReviews = await _repo.GetByAuthorAsync(Guid.Parse(UserId));
            return UsersReviews.Select(review => new ReviewInfoResponse(review)).ToList();
        }

        public async Task<ReviewInfoResponse?> CreateReview(CreateReviewRequest ReviewRequest)
        {
            User Author = await _userRepo.GetByIdAsync(Guid.Parse(ReviewRequest.AuthorId)) ?? throw new KeyNotFoundException();
            Film Film = await _filmRepo.GetByIdAsync(Guid.Parse(ReviewRequest.FilmId)) ?? throw new KeyNotFoundException();
            Review Review = new Review(ReviewRequest.Rating, ReviewRequest.Text, ReviewRequest.Flags, ReviewRequest.Spoiler, Author, Film);
            _repo.Create(Review);
            await _repo.SaveChangesAsync();
            return new ReviewInfoResponse(Review);
        }

        public async Task<ReviewInfoResponse?> UpdateReview(UpdateReviewRequest ReviewRequest)
        {
            var Review = await _repo.GetByIdAsync(Guid.Parse(ReviewRequest.ReviewId));
            if (Review == null) throw new KeyNotFoundException();
            Review.Rating = ReviewRequest.Rating ?? Review.Rating;
            Review.Text = ReviewRequest.Text ?? Review.Text;
            Review.Spoiler = ReviewRequest.Spoiler ?? Review.Spoiler;
            _repo.Update(Review);
            await _repo.SaveChangesAsync();
            return new ReviewInfoResponse(Review);
        }

        public async Task UpdateReviewLikeCountEfCore7Async(string ReviewId, string LikeChange)
        {
            if (!Guid.TryParse(ReviewId, out var Id)) throw new ArgumentException(nameof(ReviewId));
            if (!int.TryParse(LikeChange, out var Delta)) throw new ArgumentException(nameof(LikeChange));
            await _repo.UpdateReviewLikeCountEfCore7Async(Id, Delta);
        }

        public async Task ToggleNotificationsEfCore7Async(string ReviewId)
        {
            if (!Guid.TryParse(ReviewId, out var Id)) throw new ArgumentException(nameof(ReviewId));
            await _repo.ToggleNotificationsEfCore7Async(Id);
        }

        public async Task ReportReviewEfCore7Async(string ReviewId)
        {
            if (!Guid.TryParse(ReviewId, out var Id)) throw new ArgumentException(nameof(ReviewId));
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
