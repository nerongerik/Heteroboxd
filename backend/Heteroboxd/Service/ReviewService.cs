using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface IReviewService
    {
        Task<PagedResponse<ReviewInfoResponse>> GetReviews(string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<ReviewInfoResponse?> GetReview(string ReviewId);
        Task<ReviewInfoResponse> GetReviewByUserFilm(string UserId, int FilmId);
        Task<PagedResponse<ReviewInfoResponse>> GetReviewsByFilm(int FilmId, string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<PagedResponse<ReviewInfoResponse>> GetReviewsByAuthor(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task UpdateReviewLikeCountEfCore7(string ReviewId, int Delta);
        Task ToggleNotificationsEfCore7(string ReviewId);
        Task ReportReviewEfCore7(string ReviewId);
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

        public async Task<PagedResponse<ReviewInfoResponse>> GetReviews(string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null && Filter.ToLower() == "friends") throw new ArgumentException();

            List<Guid>? UsersFriends = null;
            if (UserId != null && Filter.ToLower() == "friends")
            {
                UsersFriends = await _userRepo.GetFriendsAsync(Guid.Parse(UserId));
            }

            var (Responses, TotalCount) = await _repo.GetAllAsync(UsersFriends, Page, PageSize, Filter, Sort, Desc, FilterValue);
            return new PagedResponse<ReviewInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = Responses.Select(x => new ReviewInfoResponse(x.Item.Review, x.Joined, x.Item.Film)).ToList()
            };
        }

        public async Task<ReviewInfoResponse?> GetReview(string ReviewId)
        {
            var Response = await _repo.GetJoinedByIdAsync(Guid.Parse(ReviewId));
            if (Response == null) throw new KeyNotFoundException();
            return new ReviewInfoResponse(Response.Item.Review, Response.Joined, Response.Item.Film);
        }

        public async Task<ReviewInfoResponse> GetReviewByUserFilm(string UserId, int FilmId)
        {
            var Review = await _repo.GetByUserFilmAsync(Guid.Parse(UserId), FilmId);
            if (Review == null) throw new KeyNotFoundException();
            return new ReviewInfoResponse(Review);
        }

        public async Task<PagedResponse<ReviewInfoResponse>> GetReviewsByFilm(int FilmId, string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null && Filter.ToLower() == "friends") throw new KeyNotFoundException();

            List<Guid>? UsersFriends = null;
            if (UserId != null && Filter.ToLower() == "friends")
            {
                UsersFriends = await _userRepo.GetFriendsAsync(Guid.Parse(UserId));
            }

            var Film = await _filmRepo.LightweightFetcher(FilmId);
            if (Film == null) throw new KeyNotFoundException();

            var (Responses, TotalCount) = await _repo.GetByFilmAsync(FilmId, UsersFriends, Page, PageSize, Filter, Sort, Desc, FilterValue);
            return new PagedResponse<ReviewInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = Responses.Select(x => new ReviewInfoResponse(x.Item, x.Joined, Film)).ToList()
            };
        }

        public async Task<PagedResponse<ReviewInfoResponse>> GetReviewsByAuthor(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var Author = await _userRepo.LightweightFetcherAsync(Guid.Parse(UserId));
            if (Author == null) throw new KeyNotFoundException();

            var (Responses, TotalCount) = await _repo.GetByAuthorAsync(Author.Id, Page, PageSize, Filter, Sort, Desc, FilterValue);
            return new PagedResponse<ReviewInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = Responses.Select(x => new ReviewInfoResponse(x.Item, Author, x.Joined)).ToList()
            };
        }

        public async Task UpdateReviewLikeCountEfCore7(string ReviewId, int Delta) =>
            await _repo.UpdateReviewLikeCountEfCore7Async(Guid.Parse(ReviewId), Delta);

        public async Task ToggleNotificationsEfCore7(string ReviewId) =>
            await _repo.ToggleNotificationsEfCore7Async(Guid.Parse(ReviewId));

        public async Task ReportReviewEfCore7(string ReviewId) =>
            await _repo.ReportReviewEfCore7Async(Guid.Parse(ReviewId));

        public async Task<ReviewInfoResponse> AddReview(CreateReviewRequest ReviewRequest)
        {
            Guid UserId = Guid.Parse(ReviewRequest.AuthorId);
            var Review = new Review(ReviewRequest.Rating, ReviewRequest.Text, Flag(ReviewRequest.Text), ReviewRequest.Spoiler, UserId, ReviewRequest.FilmId);
            _repo.Create(Review);
            //if user never clicked "Watched" on this title, we add it here for their lazy arse
            if ((await _userRepo.GetUserWatchedFilmAsync(UserId, ReviewRequest.FilmId)) == null)
            {
                var (Existing, _) = await _userRepo.IsWatchlistedAsync(ReviewRequest.FilmId, UserId);
                if (Existing != null)
                {
                    await _userRepo.RemoveFromWatchlist(Existing);
                }
                _userRepo.CreateUserWatchedFilm(new UserWatchedFilm(UserId, ReviewRequest.FilmId));
                await _filmRepo.UpdateFilmWatchCountEfCore7Async(ReviewRequest.FilmId, 1);
                await _userRepo.SaveChangesAsync();
            }
            await _repo.SaveChangesAsync();
            return new ReviewInfoResponse(Review);
        }

        public async Task<ReviewInfoResponse> UpdateReview(UpdateReviewRequest ReviewRequest)
        {
            var Review = await _repo.GetByIdAsync(Guid.Parse(ReviewRequest.ReviewId));
            if (Review == null) throw new KeyNotFoundException();
            Review.UpdateFields(ReviewRequest);
            Review.Flags = Flag(Review.Text); //reflag after update
            _repo.Update(Review);
            await _repo.SaveChangesAsync();
            return new ReviewInfoResponse(Review);
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
