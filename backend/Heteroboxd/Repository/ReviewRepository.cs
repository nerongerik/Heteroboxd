using Heteroboxd.Data;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public record JoinedReviewFilm(Review Review, Film Film);
    public interface IReviewRepository
    {
        Task<(List<JoinResponse<JoinedReviewFilm, User>> Responses, int TotalCount)> GetAllAsync(List<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<Review?> GetByIdAsync(Guid Id);
        Task<JoinResponse<JoinedReviewFilm, User>?> GetJoinedByIdAsync(Guid Id);
        Task<(List<JoinResponse<Review, User>> Reviews, int TotalCount)> GetByFilmAsync(int FilmId, List<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<List<JoinResponse<Review, User>>> GetTopAsync(int FilmId, int Top);
        Task<(List<JoinResponse<Review, Film>> Responses, int TotalCount)> GetByAuthorAsync(Guid AuthorId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<Review?> GetByUserFilmAsync(Guid AuthorId, int FilmId);
        Task UpdateReviewLikeCountEfCore7Async(Guid ReviewId, int Delta);
        Task ToggleNotificationsEfCore7Async(Guid ReviewId);
        Task ReportReviewEfCore7Async(Guid ReviewId);
        void Create(Review Review);
        void Update(Review Review);
        void Delete(Review Review);
        Task SaveChangesAsync();
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
                .Join(_context.Films, r => r.FilmId, f => f.Id, (r, f) => new { r, f })
                .Join(_context.Users, x => x.r.AuthorId, u => u.Id, (x, u) => new { x.r, x.f, u })
                .AsQueryable();

            //filtering
            switch (Filter.ToLower())
            {
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
                    Query = Desc ? Query.OrderBy(x => x.r.Flags).ThenByDescending(x => x.r.LikeCount) : Query.OrderBy(x => x.r.Flags).ThenBy(x => x.r.LikeCount);
                    break;
                case "date created":
                    Query = Desc ? Query.OrderBy(x => x.r.Flags).ThenByDescending(x => x.r.Date) : Query.OrderBy(x => x.r.Flags).ThenBy(x => x.r.Date);
                    break;
                case "rating":
                    Query = Desc ? Query.OrderBy(x => x.r.Flags).ThenByDescending(x => x.r.Rating) : Query.OrderBy(x => x.r.Flags).ThenBy(x => x.r.Rating);
                    break;
                default:
                    //error handling
                    Query = Query.OrderBy(x => x.r.Flags).ThenByDescending(x => x.r.Date);
                    break;
            }

            var TotalCount = await Query.CountAsync();
            var Responses = await Query
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinResponse<JoinedReviewFilm, User> { Item = new JoinedReviewFilm(x.r, x.f), Joined = x.u })
                .ToListAsync();
            return (Responses, TotalCount);
        }

        public async Task<Review?> GetByIdAsync(Guid Id) =>
            await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == Id);

        public async Task<JoinResponse<JoinedReviewFilm, User>?> GetJoinedByIdAsync(Guid Id) =>
            await _context.Reviews
                .Join(_context.Films, r => r.FilmId, f => f.Id, (r, f) => new { r, f })
                .Join(_context.Users, x => x.r.AuthorId, u => u.Id, (x, u) => new { x.r, x.f, u })
                .Select(x => new JoinResponse<JoinedReviewFilm, User> { Item = new JoinedReviewFilm(x.r, x.f), Joined = x.u })
                .FirstOrDefaultAsync(x => x.Item.Review.Id == Id);

        public async Task<(List<JoinResponse<Review, User>> Reviews, int TotalCount)> GetByFilmAsync(int FilmId, List<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var FilmQuery = _context.Reviews
                .Where(r => r.FilmId == FilmId)
                .Join(_context.Users, r => r.AuthorId, u => u.Id, (r, u) => new { r, u })
                .AsQueryable();

            //filtering
            switch (Filter.ToLower())
            {
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
                    FilmQuery = Desc ? FilmQuery.OrderBy(x => x.r.Flags).ThenByDescending(x => x.r.LikeCount) : FilmQuery.OrderBy(x => x.r.Flags).ThenBy(x => x.r.LikeCount);
                    break;
                case "date created":
                    FilmQuery = Desc ? FilmQuery.OrderBy(x => x.r.Flags).ThenByDescending(x => x.r.Date) : FilmQuery.OrderBy(x => x.r.Flags).ThenBy(x => x.r.Date);
                    break;
                case "rating":
                    FilmQuery = Desc ? FilmQuery.OrderBy(x => x.r.Flags).ThenByDescending(x => x.r.Rating) : FilmQuery.OrderBy(x => x.r.Flags).ThenBy(x => x.r.Rating);
                    break;
                default:
                    //error handling
                    FilmQuery = FilmQuery.OrderBy(x => x.r.Flags).ThenByDescending(x => x.r.LikeCount);
                    break;
            }

            var TotalCount = await FilmQuery.CountAsync();
            var Responses = await FilmQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinResponse<Review, User> { Item = x.r, Joined = x.u })
                .ToListAsync();
            return (Responses, TotalCount);
        }

        public async Task<List<JoinResponse<Review, User>>> GetTopAsync(int FilmId, int Top) =>
            await _context.Reviews
                .Where(r => r.FilmId == FilmId && r.Text != null && !r.Spoiler)
                .Join(_context.Users, r => r.AuthorId, u => u.Id, (r, u) => new { r, u })
                .OrderBy(x => x.r.Flags).ThenByDescending(x => x.r.LikeCount).ThenBy(x => x.r.Date)
                .Take(Top)
                .Select(x => new JoinResponse<Review, User> { Item = x.r, Joined = x.u })
                .ToListAsync();

        public async Task<(List<JoinResponse<Review, Film>> Responses, int TotalCount)> GetByAuthorAsync(Guid AuthorId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var UserQuery = _context.Reviews
                .Where(r => r.AuthorId == AuthorId)
                .Join(_context.Films, r => r.FilmId, f => f.Id, (r, f) => new { r, f })
                .AsQueryable();

            //filtering - querying by User already filters out enough

            //sorting
            switch (Sort.ToLower())
            {
                case "popularity":
                    UserQuery = Desc ? UserQuery.OrderByDescending(x => x.r.LikeCount) : UserQuery.OrderBy(x => x.r.LikeCount);
                    break;
                case "date created":
                    UserQuery = Desc ? UserQuery.OrderByDescending(x => x.r.Date) : UserQuery.OrderBy(x => x.r.Date);
                    break;
                case "rating":
                    UserQuery = Desc ? UserQuery.OrderByDescending(x => x.r.Rating) : UserQuery.OrderBy(x => x.r.Rating);
                    break;
                default:
                    //error handling
                    UserQuery = UserQuery.OrderByDescending(x => x.r.Date);
                    break;
            }

            var TotalCount = await UserQuery.CountAsync();
            var Responses = await UserQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => new JoinResponse<Review, Film> { Item = x.r, Joined = x.f })
                .ToListAsync();
            return (Responses, TotalCount);
        }

        public async Task<Review?> GetByUserFilmAsync(Guid AuthorId, int FilmId) =>
            await _context.Reviews
                .FirstOrDefaultAsync(r => r.AuthorId == AuthorId && r.FilmId == FilmId);

        public async Task UpdateReviewLikeCountEfCore7Async(Guid ReviewId, int Delta) //increments/decrements like count
        {
            var Rows = await _context.Reviews
                .Where(r => r.Id == ReviewId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    r => r.LikeCount,
                    r => r.LikeCount + Delta
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task ToggleNotificationsEfCore7Async(Guid ReviewId) //flips the boolean value of notifications on a review
        {
            var Rows = await _context.Reviews
                .Where(r => r.Id == ReviewId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    r => r.NotificationsOn,
                    r => !r.NotificationsOn
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task ReportReviewEfCore7Async(Guid ReviewId) //increments the flag count of a review
        {
            var Rows = await _context.Reviews
                .Where(r => r.Id == ReviewId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    r => r.Flags,
                    r => r.Flags + 1
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public void Create(Review Review) =>
            _context.Reviews
                .Add(Review);

        public void Update(Review Review) =>
            _context.Reviews
                .Update(Review);

        public void Delete(Review Review) =>
            _context.Reviews
                .Remove(Review);

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
