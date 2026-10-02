using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Models.DTO;
using Heteroboxd.Shared.Repository;

namespace Heteroboxd.API.Service
{
    public interface IReviewService
    {
        Task<PagedResponse<ReviewInfoResponse>> GetReviews(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<ReviewInfoResponse> GetReview(string ReviewId);
        Task<ReviewInfoResponse?> GetReviewByUserFilm(string UserId, int FilmId);
        Task<PagedResponse<ReviewInfoResponse>> GetReviewsByFilm(int FilmId, string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<PagedResponse<ReviewInfoResponse>> GetTopX(int FilmId, int X);
        Task<PagedResponse<ReviewInfoResponse>> GetReviewsByAuthor(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task ToggleNotifications(string ReviewId);
        Task ReportReview(string ReviewId);
        Task<ReviewInfoResponse> AddReview(CreateReviewRequest ReviewRequest);
        Task<ReviewInfoResponse> UpdateReview(UpdateReviewRequest ReviewRequest);
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

        public async Task<PagedResponse<ReviewInfoResponse>> GetReviews(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            List<Guid>? UsersFriends = null;
            if (Filter.ToLower() == "friends")
            {
                UsersFriends = await _userRepo.GetFriendsAsync(Guid.Parse(UserId));
            }

            var (Responses, TotalCount) = await _repo.GetAllAsync(UsersFriends, Page, PageSize, Filter, Sort, Desc, FilterValue);
            return new PagedResponse<ReviewInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                Items = Responses.Select(x => new ReviewInfoResponse(x.Item.Review, x.Joined, x.Item.Film, x.Item.LikeCount, x.Item.CommentCount)).ToList()
            };
        }

        public async Task<ReviewInfoResponse> GetReview(string ReviewId)
        {
            var Response = await _repo.GetJoinedByIdAsync(Guid.Parse(ReviewId));
            if (Response == null) throw new KeyNotFoundException();
            return new ReviewInfoResponse(Response.Item.Review, Response.Joined, Response.Item.Film, Response.Item.LikeCount, Response.Item.CommentCount);
        }

        public async Task<ReviewInfoResponse?> GetReviewByUserFilm(string UserId, int FilmId)
        {
            var Response = await _repo.GetByUserFilmAsync(Guid.Parse(UserId), FilmId);
            if (Response == null)
            {
                var Film = await _filmRepo.LightweightFetcherAsync(FilmId);
                if (Film == null) return null;
                return new ReviewInfoResponse(Film);
            }
            return new ReviewInfoResponse(Response.Review, Response.Film, Response.LikeCount, Response.CommentCount);
        }

        public async Task<PagedResponse<ReviewInfoResponse>> GetReviewsByFilm(int FilmId, string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null && Filter.ToLower() == "friends") throw new KeyNotFoundException();

            List<Guid>? UsersFriends = null;
            if (UserId != null && Filter.ToLower() == "friends")
            {
                UsersFriends = await _userRepo.GetFriendsAsync(Guid.Parse(UserId));
            }

            var (Responses, TotalCount) = await _repo.GetByFilmAsync(FilmId, UsersFriends, Page, PageSize, Filter, Sort, Desc, FilterValue);
            return new PagedResponse<ReviewInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                Items = Responses.Select(x => new ReviewInfoResponse(x.Item.Review, x.Joined, x.Item.LikeCount, x.Item.CommentCount)).ToList()
            };
        }

        public async Task<PagedResponse<ReviewInfoResponse>> GetTopX(int FilmId, int X)
        {
            var (Responses, TotalCount) = await _repo.GetTopAsync(FilmId, X);
            return new PagedResponse<ReviewInfoResponse>
            {
                TotalCount = TotalCount,
                Page = 1,
                Items = Responses.Select(x => new ReviewInfoResponse(x.Item.Review, x.Joined, x.Item.LikeCount, x.Item.CommentCount)).ToList()
            };
        }

        public async Task<PagedResponse<ReviewInfoResponse>> GetReviewsByAuthor(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var Author = await _userRepo.LightweightFetcherAsync(Guid.Parse(UserId));
            if (Author == null) return new PagedResponse<ReviewInfoResponse> { TotalCount = 0, Page = 1, Items = new() };

            var (Responses, TotalCount) = await _repo.GetByAuthorAsync(Author.Id, Page, PageSize, Filter, Sort, Desc, FilterValue);
            return new PagedResponse<ReviewInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                Items = Responses.Select(x => new ReviewInfoResponse(x.Item.Review, Author, x.Joined, x.Item.LikeCount, x.Item.CommentCount)).ToList()
            };
        }

        public async Task ToggleNotifications(string ReviewId) =>
            await _repo.ToggleNotificationsAsync(Guid.Parse(ReviewId));

        public async Task ReportReview(string ReviewId) =>
            await _repo.ReportAsync(Guid.Parse(ReviewId));

        public async Task<ReviewInfoResponse> AddReview(CreateReviewRequest ReviewRequest)
        {
            var User = await _userRepo.LightweightFetcherAsync(Guid.Parse(ReviewRequest.AuthorId));
            if (User == null) throw new KeyNotFoundException();
            var Film = await _filmRepo.LightweightFetcherAsync(ReviewRequest.FilmId);
            if (Film == null) throw new KeyNotFoundException();

            var Review = new Review(!User.EmailConfirmed, ReviewRequest.Rating, ReviewRequest.Text, ReviewRequest.Spoiler, User.Id, ReviewRequest.FilmId);
            try
            {
                await _repo.CreateAsync(Review);
            }
            catch
            {
                throw new ArgumentException();
            }
            await _filmRepo.AddRatingAsync(Film.Id, Review.Rating);

            //if user never clicked "Watched" on this title, we add it here for their lazy arse
            if ((await _userRepo.GetUserWatchedFilmAsync(User.Id, ReviewRequest.FilmId)) == null)
            {
                var Existing = await _userRepo.IsWatchlistedAsync(ReviewRequest.FilmId, User.Id);
                if (Existing != null)
                {
                    await _userRepo.RemoveFromWatchlistAsync(Existing.Id);
                }
                await _userRepo.CreateUserWatchedFilmAsync(new UserWatchedFilm(User.Id, ReviewRequest.FilmId));
                await _filmRepo.IncrementWatchCountAsync(ReviewRequest.FilmId);
            }
            return new ReviewInfoResponse(Review, 0, 0);
        }

        public async Task<ReviewInfoResponse> UpdateReview(UpdateReviewRequest ReviewRequest)
        {
            var Response = await _repo.GetJoinedByIdAsync(Guid.Parse(ReviewRequest.ReviewId));
            if (Response == null) throw new KeyNotFoundException();

            if (ReviewRequest.Rating != null && ReviewRequest.Rating != Response.Item.Review.Rating)
            {
                await _filmRepo.ReplaceRatingAsync(Response.Item.Film.Id, Response.Item.Review.Rating, ReviewRequest.Rating.Value);
            }

            Response.Item.Review.UpdateFields(ReviewRequest);
            await _repo.UpdateAsync(Response.Item.Review);

            return new ReviewInfoResponse(Response.Item.Review, Response.Item.LikeCount, Response.Item.CommentCount);
        }

        public async Task DeleteReview(string ReviewId)
        {
            var Response = await _repo.GetJoinedByIdAsync(Guid.Parse(ReviewId));
            if (Response == null) throw new KeyNotFoundException();

            await _filmRepo.RemoveRatingAsync(Response.Item.Film.Id, Response.Item.Review.Rating);

            var User = await _userRepo.LightweightFetcherAsync(Response.Item.Review.AuthorId);
            if (User != null && User.PinnedReviewId == Response.Item.Review.Id) await _userRepo.PinReviewAsync(User.Id, Response.Item.Review.Id);

            await _repo.DeleteAsync(Response.Item.Review.Id);
        }
    }
}
