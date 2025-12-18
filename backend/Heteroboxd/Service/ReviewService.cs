using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface IReviewService
    {
        Task<ReviewInfoResponse?> GetReview(string ReviewId);
        Task<ReviewInfoResponse> GetReviewByUserFilm(string UserId, int FilmId);
        Task<PagedReviewResponse> GetReviewsByFilm(int FilmId, int Page, int PageSize);
        Task<List<ReviewInfoResponse>> GetTopReviewsForFilm(int FilmId, int Top);
        Task<PagedReviewResponse> GetReviewsByAuthor(string UserId, int Page, int PageSize);
        Task UpdateReviewLikeCountEfCore7(string ReviewId, int LikeChange);
        Task ToggleNotificationsEfCore7(string ReviewId);
        Task ReportReviewEfCore7(string ReviewId);
        Task<Review> AddReview(CreateReviewRequest ReviewRequest);
        Task<Review> UpdateReview(UpdateReviewRequest ReviewRequest);
        Task DeleteReview(string ReviewId);
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

        public async Task<ReviewInfoResponse?> GetReview(string ReviewId)
        {
            var Review = await _repo.GetByIdAsync(Guid.Parse(ReviewId));
            if (Review == null) throw new KeyNotFoundException();
            var Author = await _userRepo.GetByIdAsync(Review.AuthorId);
            var Film = await _filmRepo.GetByIdAsync(Review.FilmId);
            if (Author == null || Film == null) throw new KeyNotFoundException();
            return new ReviewInfoResponse(Review, Author, Film);
        }

        public async Task<ReviewInfoResponse> GetReviewByUserFilm(string UserId, int FilmId)
        {
            var Review = await _repo.GetByUserFilmAsync(Guid.Parse(UserId), FilmId);
            if (Review == null) throw new KeyNotFoundException();
            return new ReviewInfoResponse(Review);
        }

        public async Task<PagedReviewResponse> GetReviewsByFilm(int FilmId, int Page, int PageSize)
        {
            throw new NotImplementedException();
        }

        public async Task<List<ReviewInfoResponse>> GetTopReviewsForFilm(int FilmId, int Top)
        {
            var TopReviews = await _repo.GetTopAsync(FilmId, Top);
            if (TopReviews.Count == 0) return new();
            var AuthorIds = TopReviews.Select(r => r.AuthorId).Distinct().ToArray();
            var TopAuthors = await _userRepo.GetByIdsAsync(AuthorIds);

            var AuthorLookup = TopAuthors.GroupBy(a => a.Id).ToDictionary(g => g.Key, g => g.First());

            return TopReviews
                .Where(r => AuthorLookup.ContainsKey(r.AuthorId))
                .Select(r => new ReviewInfoResponse(r, AuthorLookup[r.AuthorId]))
                .ToList();
        }

        public async Task<PagedReviewResponse> GetReviewsByAuthor(string UserId, int Page, int PageSize)
        {
            throw new NotImplementedException();
        }

        public async Task UpdateReviewLikeCountEfCore7(string ReviewId, int LikeChange)
        {
            if (!Guid.TryParse(ReviewId, out var Id)) throw new ArgumentException();
            await _repo.UpdateReviewLikeCountEfCore7Async(Id, LikeChange);
        }

        public async Task ToggleNotificationsEfCore7(string ReviewId)
        {
            if (!Guid.TryParse(ReviewId, out var Id)) throw new ArgumentException();
            await _repo.ToggleNotificationsEfCore7Async(Id);
        }

        public async Task ReportReviewEfCore7(string ReviewId)
        {
            if (!Guid.TryParse(ReviewId, out var Id)) throw new ArgumentException();
            await _repo.ReportReviewEfCore7Async(Id);
        }

        public async Task<Review> AddReview(CreateReviewRequest ReviewRequest)
        {
            Guid UserId = Guid.Parse(ReviewRequest.AuthorId);
            Review Review = new Review(ReviewRequest.Rating, ReviewRequest.Text, Flag(ReviewRequest.Text), ReviewRequest.Spoiler, UserId, ReviewRequest.FilmId);
            _repo.Create(Review);
            await _repo.SaveChangesAsync();
            //if user never clicked "Watched" on this title, we add it here for their lazy arse
            if (await _userRepo.GetUserWatchedFilmAsync(UserId, ReviewRequest.FilmId) == null)
            {
                _userRepo.CreateUserWatchedFilm(new UserWatchedFilm(UserId, ReviewRequest.FilmId));
                await _userRepo.SaveChangesAsync();
            }
            return Review;
        }

        public async Task<Review> UpdateReview(UpdateReviewRequest ReviewRequest)
        {
            var Review = await _repo.GetByIdAsync(Guid.Parse(ReviewRequest.ReviewId));
            if (Review == null) throw new KeyNotFoundException();
            Review.Rating = ReviewRequest.Rating ?? Review.Rating;
            Review.Text = ReviewRequest.Text ?? Review.Text;
            Review.Spoiler = ReviewRequest.Spoiler ?? Review.Spoiler;
            _repo.Update(Review);
            await _repo.SaveChangesAsync();
            return Review;
        }

        public async Task DeleteReview(string ReviewId)
        {
            var Review = await _repo.GetByIdAsync(Guid.Parse(ReviewId));
            if (Review == null) throw new KeyNotFoundException();
            _repo.Delete(Review);
            await _repo.SaveChangesAsync();
        }
        
        private int Flag(string? Text)
        {
            if (string.IsNullOrEmpty(Text)) return 0;
            return 0; //placeholder
        }
    }
}
