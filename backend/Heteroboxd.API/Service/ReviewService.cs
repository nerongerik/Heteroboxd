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
        Task UpdateReviewLikeCount(string ReviewId, int Delta);
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
                Items = Responses.Select(x => new ReviewInfoResponse(x.Item.Review, x.Joined, x.Item.Film)).ToList()
            };
        }

        public async Task<ReviewInfoResponse> GetReview(string ReviewId)
        {
            var Response = await _repo.GetJoinedByIdAsync(Guid.Parse(ReviewId));
            if (Response == null) throw new KeyNotFoundException();
            return new ReviewInfoResponse(Response.Item.Review, Response.Joined, Response.Item.Film);
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
            return new ReviewInfoResponse(Response.Review, Response.Film);
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
                Items = Responses.Select(x => new ReviewInfoResponse(x.Item, x.Joined)).ToList()
            };
        }

        public async Task<PagedResponse<ReviewInfoResponse>> GetTopX(int FilmId, int X)
        {
            var (Responses, TotalCount) = await _repo.GetTopAsync(FilmId, X);
            return new PagedResponse<ReviewInfoResponse>
            {
                TotalCount = TotalCount,
                Page = 1,
                Items = Responses.Select(x => new ReviewInfoResponse(x.Item, x.Joined)).ToList()
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
                Items = Responses.Select(x => new ReviewInfoResponse(x.Item, Author, x.Joined)).ToList()
            };
        }

        public async Task UpdateReviewLikeCount(string ReviewId, int Delta) =>
            await _repo.UpdateLikeCountAsync(Guid.Parse(ReviewId), Delta);

        public async Task ToggleNotifications(string ReviewId) =>
            await _repo.ToggleNotificationsAsync(Guid.Parse(ReviewId));

        public async Task ReportReview(string ReviewId) =>
            await _repo.ReportAsync(Guid.Parse(ReviewId));

        public async Task<ReviewInfoResponse> AddReview(CreateReviewRequest ReviewRequest)
        {
            Guid UserId = Guid.Parse(ReviewRequest.AuthorId);

            var DuplicateCheck = await _repo.GetByUserFilmAsync(UserId, ReviewRequest.FilmId);
            if (DuplicateCheck != null)
            {
                return new ReviewInfoResponse(DuplicateCheck.Review); //fail silently
            }

            var Film = await _filmRepo.LightweightFetcherAsync(ReviewRequest.FilmId);
            if (Film == null) throw new KeyNotFoundException(); //fail loudly

            var Review = new Review(ReviewRequest.Rating, ReviewRequest.Text, Flag(ReviewRequest.Text), ReviewRequest.Spoiler, UserId, ReviewRequest.FilmId);
            await _repo.CreateAsync(Review);
            await _filmRepo.UpdateAverageRatingAsync(Film.Id, ((Film.AverageRating * Film.RatingCount) + Review.Rating) / (Film.RatingCount + 1));
            await _filmRepo.UpdateRatingCountAsync(ReviewRequest.FilmId, 1);

            //if user never clicked "Watched" on this title, we add it here for their lazy arse
            if ((await _userRepo.GetUserWatchedFilmAsync(UserId, ReviewRequest.FilmId)) == null)
            {
                var Existing = await _userRepo.IsWatchlistedAsync(ReviewRequest.FilmId, UserId);
                if (Existing != null)
                {
                    await _userRepo.RemoveFromWatchlistAsync(Existing.Id);
                }
                await _userRepo.CreateUserWatchedFilmAsync(new UserWatchedFilm(UserId, ReviewRequest.FilmId));
                await _filmRepo.UpdateWatchCountAsync(ReviewRequest.FilmId, 1);
            }
            return new ReviewInfoResponse(Review);
        }

        public async Task<ReviewInfoResponse> UpdateReview(UpdateReviewRequest ReviewRequest)
        {
            var Response = await _repo.GetJoinedByIdAsync(Guid.Parse(ReviewRequest.ReviewId));
            if (Response == null) throw new KeyNotFoundException();

            if (ReviewRequest.Rating != null && ReviewRequest.Rating != Response.Item.Review.Rating)
            {
                await _filmRepo.UpdateAverageRatingAsync(Response.Item.Film.Id, ((Response.Item.Film.AverageRating * Response.Item.Film.RatingCount) - Response.Item.Review.Rating + ReviewRequest.Rating.Value) / Response.Item.Film.RatingCount);
            }

            Response.Item.Review.UpdateFields(ReviewRequest);
            Response.Item.Review.Flags = Flag(Response.Item.Review.Text); //reflag after update
            await _repo.UpdateAsync(Response.Item.Review);

            return new ReviewInfoResponse(Response.Item.Review);
        }

        public async Task DeleteReview(string ReviewId)
        {
            var Response = await _repo.GetJoinedByIdAsync(Guid.Parse(ReviewId));
            if (Response == null) throw new KeyNotFoundException();

            await _filmRepo.UpdateAverageRatingAsync(
                Response.Item.Film.Id,
                Response.Item.Film.RatingCount <= 1 ? 0 : ((Response.Item.Film.AverageRating * Response.Item.Film.RatingCount) - Response.Item.Review.Rating) / (Response.Item.Film.RatingCount - 1)
            );
            await _filmRepo.UpdateRatingCountAsync(Response.Item.Film.Id, -1);

            var User = await _userRepo.LightweightFetcherAsync(Response.Item.Review.AuthorId);
            if (User != null && User.PinnedReviewId == Response.Item.Review.Id) await _userRepo.PinReviewAsync(User.Id, Response.Item.Review.Id);

            await _repo.DeleteAsync(Response.Item.Review.Id);
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
