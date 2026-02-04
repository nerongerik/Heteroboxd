using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface IReviewService
    {
        Task<ReviewInfoResponse?> GetReview(string ReviewId);
        Task<ReviewInfoResponse> GetReviewByUserFilm(string UserId, int FilmId);
        Task<PagedResponse<ReviewInfoResponse>> GetReviewsByFilm(int FilmId, string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<List<ReviewInfoResponse>> GetTopReviewsForFilm(int FilmId, int Top);
        Task<PagedResponse<ReviewInfoResponse>> GetReviewsByAuthor(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task UpdateReviewLikeCountEfCore7(string ReviewId, int Delta);
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

        public async Task<PagedResponse<ReviewInfoResponse>> GetReviewsByFilm(int FilmId, string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null && Filter.ToLower() == "friends") throw new KeyNotFoundException();

            List<Guid>? UsersFriends = null;
            if (UserId != null && Filter.ToLower() == "friends")
            {
                UsersFriends = (await _userRepo.GetUserRelationshipsAsync(Guid.Parse(UserId)))?.Following.Select(u => u.Id).ToList();
            }

            var Film = await _filmRepo.LightweightFetcher(FilmId);
            if (Film == null) throw new KeyNotFoundException();

            var (Reviews, TotalCount) = await _repo.GetByFilmAsync(FilmId, UsersFriends, Page, PageSize, Filter, Sort, Desc, FilterValue);
            var AuthorIds = Reviews
                .Select(r => r.AuthorId)
                .Distinct()
                .ToList();
            var Authors = await _userRepo.GetByIdsAsync(AuthorIds);

            var AuthorLookup = Authors.ToDictionary(a => a.Id);

            var ReviewResponses = new List<ReviewInfoResponse>();

            foreach (Review r in Reviews)
            {
                if (!AuthorLookup.TryGetValue(r.AuthorId, out var Author))
                    continue;
                ReviewResponses.Add(new ReviewInfoResponse(r, Author, Film));
            }

            return new PagedResponse<ReviewInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = ReviewResponses
            };
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

        public async Task<PagedResponse<ReviewInfoResponse>> GetReviewsByAuthor(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var Author = await _userRepo.GetByIdAsync(Guid.Parse(UserId));
            if (Author == null) throw new KeyNotFoundException();

            var (Reviews, TotalCount) = await _repo.GetByAuthorAsync(Author.Id, Page, PageSize, Filter, Sort, Desc, FilterValue);

            var FilmIds = Reviews
                .Select(r => r.FilmId)
                .Distinct()
                .ToList();
            var Films = await _filmRepo.GetByIdsAsync(FilmIds);
            var FilmLookup = Films.ToDictionary(f => f.Id);

            var ReviewResponses = new List<ReviewInfoResponse>();

            foreach (Review r in Reviews)
            {
                if (!FilmLookup.TryGetValue(r.FilmId, out var Film))
                    continue;
                ReviewResponses.Add(new ReviewInfoResponse(r, Author, Film));
            }

            return new PagedResponse<ReviewInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = ReviewResponses
            };
        }

        public async Task UpdateReviewLikeCountEfCore7(string ReviewId, int Delta)
        {
            if (!Guid.TryParse(ReviewId, out var Id)) throw new ArgumentException();
            await _repo.UpdateReviewLikeCountEfCore7Async(Id, Delta);
        }

        public async Task ToggleNotificationsEfCore7(string ReviewId)
        {
            if (!Guid.TryParse(ReviewId, out var Id)) throw new ArgumentException();
            await _repo.ToggleNotificationsEfCore7Async(Id);
        }

        public async Task ReportReviewEfCore7(string ReviewId)
        {
            if (!Guid.TryParse(ReviewId, out Guid Id)) throw new ArgumentException();
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
                var ExistingEntry = await _userRepo.IsWatchlistedAsync(ReviewRequest.FilmId, UserId);
                if (ExistingEntry != null)
                {
                    await _userRepo.RemoveFromWatchlist(ExistingEntry);
                }
                _userRepo.CreateUserWatchedFilm(new UserWatchedFilm(UserId, ReviewRequest.FilmId));
                await _filmRepo.UpdateFilmWatchCountEfCore7Async(ReviewRequest.FilmId, 1);
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
            Review.Flags = Flag(Review.Text); //reflag review on update
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
