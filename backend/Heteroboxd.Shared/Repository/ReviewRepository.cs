using Heteroboxd.Shared.Data;
using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Shared.Repository
{
   public interface IReviewRepository
    {
        Task<(List<JoinResponse<JoinedReviewFilm, User>> Responses, int TotalCount)> GetAllAsync(List<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<Review?> GetByIdAsync(Guid Id);
        Task<JoinResponse<JoinedReviewFilm, User>?> GetJoinedByIdAsync(Guid Id);
        Task<(List<JoinResponse<ReviewWithCounts, User>> Reviews, int TotalCount)> GetByFilmAsync(int FilmId, List<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<(List<JoinResponse<ReviewWithCounts, User>> Responses, int TotalCount)> GetTopAsync(int FilmId, int PageSize);
        Task<(List<JoinResponse<ReviewWithCounts, Film>> Responses, int TotalCount)> GetByAuthorAsync(Guid AuthorId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<JoinedReviewFilm?> GetByUserFilmAsync(Guid AuthorId, int FilmId);
        Task ToggleNotificationsAsync(Guid ReviewId);
        Task ReportAsync(Guid ReviewId);
        Task CreateAsync(Review Review);
        Task UpdateAsync(Review Review);
        Task DeleteAsync(Guid ReviewId);
    }

    public class ReviewRepository : IReviewRepository
    {
        public readonly HeteroboxdContext _context;

        public ReviewRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<(List<JoinResponse<JoinedReviewFilm, User>> Responses, int TotalCount)> GetAllAsync(List<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var Query = _context.Reviews
                .AsNoTracking()
                .Join(_context.Films, r => r.FilmId, f => f.Id, (r, f) => new { r, f })
                .Join(_context.Users, x => x.r.AuthorId, u => u.Id, (x, u) => new { x.r, x.f, u })
                .Select(x => new
                {
                    x.r,
                    x.f,
                    x.u,
                    LikeCount = _context.UserLikedReviews.Count(ulr => ulr.ReviewId == x.r.Id),
                    CommentCount = _context.Comments.Count(c => c.ReviewId == x.r.Id)
                })
                .AsQueryable();

            //filtering
            switch (Filter.ToLower())
            {
                case "text":
                    Query = string.IsNullOrEmpty(FilterValue) ? Query : FilterValue.ToLower() == "containing text" ? Query.Where(x => !string.IsNullOrEmpty(x.r.Text)) : Query.Where(x => string.IsNullOrEmpty(x.r.Text));
                    break;
                case "friends":
                    Query = Query.Where(x => UsersFriends!.Contains(x.r.AuthorId));
                    break;
                default:
                    //error handling
                    break;
                }

            //sorting
            switch (Sort.ToLower())
            {
                case "popularity":
                    Query = Desc ? Query.OrderByDescending(x => x.LikeCount).ThenBy(x => x.r.Id) : Query.OrderBy(x => x.LikeCount).ThenBy(x => x.r.Id);
                    break;
                case "date created":
                    Query = Desc ? Query.OrderByDescending(x => x.r.Date).ThenBy(x => x.r.Id) : Query.OrderBy(x => x.r.Date).ThenBy(x => x.r.Id);
                    break;
                case "rating":
                    Query = Desc ? Query.OrderByDescending(x => x.r.Rating).ThenBy(x => x.r.Id) : Query.OrderBy(x => x.r.Rating).ThenBy(x => x.r.Id);
                    break;
                case "comment count":
                    Query = Desc ? Query.OrderByDescending(x => x.CommentCount).ThenBy(x => x.r.Id) : Query.OrderBy(x => x.CommentCount).ThenBy(x => x.r.Id);
                    break;
                case "flags":
                    Query = Query.OrderByDescending(x => x.r.Flags).ThenBy(x => x.r.Id);
                    break;
                default:
                    //error handling
                    Query = Query.OrderByDescending(x => x.r.Date).ThenBy(x => x.r.Id);
                    break;
            }

            var TotalCount = await Query.CountAsync();
            var Responses = await Query
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinResponse<JoinedReviewFilm, User> { Item = new JoinedReviewFilm(x.r, x.f, x.LikeCount, x.CommentCount), Joined = x.u })
                .ToListAsync();
            return (Responses, TotalCount);
        }

        public async Task<Review?> GetByIdAsync(Guid Id) =>
            await _context.Reviews
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == Id);

        public async Task<JoinResponse<JoinedReviewFilm, User>?> GetJoinedByIdAsync(Guid Id) =>
            await _context.Reviews
                .AsNoTracking()
                .Where(r => r.Id == Id)
                .Join(_context.Films, r => r.FilmId, f => f.Id, (r, f) => new { r, f })
                .Join(_context.Users, x => x.r.AuthorId, u => u.Id, (x, u) => new { x.r, x.f, u })
                .Select(x => new JoinResponse<JoinedReviewFilm, User>
                {
                    Item = new JoinedReviewFilm(
                        x.r,
                        x.f,
                        _context.UserLikedReviews.Count(ulr => ulr.ReviewId == x.r.Id),
                        _context.Comments.Count(c => c.ReviewId == x.r.Id)
                    ),
                    Joined = x.u
                })
                .FirstOrDefaultAsync();

        public async Task<(List<JoinResponse<ReviewWithCounts, User>> Reviews, int TotalCount)> GetByFilmAsync(int FilmId, List<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var FilmQuery = _context.Reviews
                .AsNoTracking()
                .Where(r => r.FilmId == FilmId && !r.Private)
                .Join(_context.Users, r => r.AuthorId, u => u.Id, (r, u) => new { r, u })
                .Select(x => new
                {
                    x.r,
                    x.u,
                    LikeCount = _context.UserLikedReviews.Count(ulr => ulr.ReviewId == x.r.Id),
                    CommentCount = _context.Comments.Count(c => c.ReviewId == x.r.Id)
                })
                .AsQueryable();

            //filtering
            switch (Filter.ToLower())
            {
                case "text":
                    FilmQuery = string.IsNullOrEmpty(FilterValue) ? FilmQuery : FilterValue.ToLower() == "containing text" ? FilmQuery.Where(x => !string.IsNullOrEmpty(x.r.Text)) : FilmQuery.Where(x => string.IsNullOrEmpty(x.r.Text));
                    break;
                case "friends":
                    FilmQuery = FilmQuery.Where(x => UsersFriends!.Contains(x.r.AuthorId));
                    break;
                default:
                    //error handling
                    break;
            }

            //sorting
            switch (Sort.ToLower())
            {
                case "popularity":
                    FilmQuery = Desc ? FilmQuery.OrderByDescending(x => x.LikeCount).ThenBy(x => x.r.Id) : FilmQuery.OrderBy(x => x.LikeCount).ThenBy(x => x.r.Id);
                    break;
                case "date created":
                    FilmQuery = Desc ? FilmQuery.OrderByDescending(x => x.r.Date).ThenBy(x => x.r.Id) : FilmQuery.OrderBy(x => x.r.Date).ThenBy(x => x.r.Id);
                    break;
                case "rating":
                    FilmQuery = Desc ? FilmQuery.OrderByDescending(x => x.r.Rating).ThenBy(x => x.r.Id) : FilmQuery.OrderBy(x => x.r.Rating).ThenBy(x => x.r.Id);
                    break;
                case "comment count":
                    FilmQuery = Desc ? FilmQuery.OrderByDescending(x => x.CommentCount).ThenBy(x => x.r.Id) : FilmQuery.OrderBy(x => x.CommentCount).ThenBy(x => x.r.Id);
                    break;
                default:
                    //error handling
                    FilmQuery = FilmQuery.OrderByDescending(x => x.LikeCount).ThenBy(x => x.r.Id);
                    break;
            }

            var TotalCount = await FilmQuery.CountAsync();
            var Responses = await FilmQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinResponse<ReviewWithCounts, User>
                {
                    Item = new ReviewWithCounts(x.r, x.LikeCount, x.CommentCount),
                    Joined = x.u
                })
                .ToListAsync();

            return (Responses, TotalCount);
        }

        public async Task<(List<JoinResponse<ReviewWithCounts, User>> Responses, int TotalCount)> GetTopAsync(int FilmId, int PageSize)
        {
            var Responses = await _context.Reviews
                .AsNoTracking()
                .Where(r => r.FilmId == FilmId && r.Text != null && r.Text.Length > 0 && !r.Spoiler && !r.Private)
                .Join(_context.Users, r => r.AuthorId, u => u.Id, (r, u) => new
                {
                    r,
                    u,
                    LikeCount = _context.UserLikedReviews.Count(ulr => ulr.ReviewId == r.Id),
                    CommentCount = _context.Comments.Count(c => c.ReviewId == r.Id)
                })
                .OrderByDescending(x => x.LikeCount).ThenBy(x => x.r.Id)
                .Take(PageSize)
                .Select(x => new JoinResponse<ReviewWithCounts, User>
                {
                    Item = new ReviewWithCounts(x.r, x.LikeCount, x.CommentCount),
                    Joined = x.u
                })
                .ToListAsync();
            var TotalCount = await _context.Reviews.AsNoTracking().CountAsync(r => r.FilmId == FilmId);
            return (Responses, TotalCount);
        }

        public async Task<(List<JoinResponse<ReviewWithCounts, Film>> Responses, int TotalCount)> GetByAuthorAsync(Guid AuthorId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var UserQuery = _context.Reviews
                .AsNoTracking()
                .Where(r => r.AuthorId == AuthorId)
                .Join(_context.Films, r => r.FilmId, f => f.Id, (r, f) => new { r, f })
                .Select(x => new
                {
                    x.r,
                    x.f,
                    LikeCount = _context.UserLikedReviews.Count(ulr => ulr.ReviewId == x.r.Id),
                    CommentCount = _context.Comments.Count(c => c.ReviewId == x.r.Id)
                })
                .AsQueryable();

            //filtering
            switch (Filter.ToLower())
            {
                case "text":
                    UserQuery = string.IsNullOrEmpty(FilterValue) ? UserQuery : FilterValue.ToLower() == "containing text" ? UserQuery.Where(x => !string.IsNullOrEmpty(x.r.Text)) : UserQuery.Where(x => string.IsNullOrEmpty(x.r.Text));
                    break;
                default:
                    //error handling
                    break;
            }

            //sorting
            switch (Sort.ToLower())
            {
                case "popularity":
                    UserQuery = Desc ? UserQuery.OrderByDescending(x => x.LikeCount).ThenBy(x => x.r.Id) : UserQuery.OrderBy(x => x.LikeCount).ThenBy(x => x.r.Id);
                    break;
                case "date created":
                    UserQuery = Desc ? UserQuery.OrderByDescending(x => x.r.Date).ThenBy(x => x.r.Id) : UserQuery.OrderBy(x => x.r.Date).ThenBy(x => x.r.Id);
                    break;
                case "rating":
                    UserQuery = Desc ? UserQuery.OrderByDescending(x => x.r.Rating).ThenBy(x => x.r.Id) : UserQuery.OrderBy(x => x.r.Rating).ThenBy(x => x.r.Id);
                    break;
                case "comment count":
                    UserQuery = Desc ? UserQuery.OrderByDescending(x => x.CommentCount).ThenBy(x => x.r.Id) : UserQuery.OrderBy(x => x.CommentCount).ThenBy(x => x.r.Id);
                    break;
                default:
                    //error handling
                    UserQuery = UserQuery.OrderByDescending(x => x.r.Date).ThenBy(x => x.r.Id);
                    break;
            }

            var TotalCount = await UserQuery.CountAsync();
            var Responses = await UserQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinResponse<ReviewWithCounts, Film>
                {
                    Item = new ReviewWithCounts(x.r, x.LikeCount, x.CommentCount),
                    Joined = x.f
                })
                .ToListAsync();

            return (Responses, TotalCount);
        }

        public async Task<JoinedReviewFilm?> GetByUserFilmAsync(Guid AuthorId, int FilmId)
        {
            return await _context.Reviews
                .AsNoTracking()
                .Where(r => r.AuthorId == AuthorId && r.FilmId == FilmId)
                .Join(_context.Films, r => r.FilmId, f => f.Id, (r, f) => new { r, f })
                .Select(x => new JoinedReviewFilm(
                    x.r,
                    x.f,
                    _context.UserLikedReviews.Count(ulr => ulr.ReviewId == x.r.Id),
                    _context.Comments.Count(c => c.ReviewId == x.r.Id)
                ))
                .FirstOrDefaultAsync();
        }

        public async Task ToggleNotificationsAsync(Guid ReviewId)
        {
            var Rows = await _context.Reviews
                .Where(r => r.Id == ReviewId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    r => r.NotificationsOn,
                    r => !r.NotificationsOn
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task ReportAsync(Guid ReviewId)
        {
            var Rows = await _context.Reviews
                .Where(r => r.Id == ReviewId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    r => r.Flags,
                    r => r.Flags + 1
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task CreateAsync(Review Review)
        {
            _context.Reviews.Add(Review);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Review Review)
        {
            _context.Reviews.Update(Review);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid ReviewId) =>
            await _context.Reviews
                .Where(r => r.Id == ReviewId)
                .ExecuteDeleteAsync();
    }
}
