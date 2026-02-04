using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface IReviewRepository
    {
        Task<Review?> GetByIdAsync(Guid Id);
        Task<(List<Review> Reviews, int TotalCount)> GetByFilmAsync(int FilmId, List<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<List<Review>> GetTopAsync(int FilmId, int Top);
        Task<(List<Review> Reviews, int TotalCount)> GetByAuthorAsync(Guid AuthorId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
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

        public async Task<Review?> GetByIdAsync(Guid Id) =>
            await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == Id);

        public async Task<(List<Review> Reviews, int TotalCount)> GetByFilmAsync(int FilmId, List<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var FilmQuery = _context.Reviews
                .Where(r => r.FilmId == FilmId)
                .AsQueryable();

            //filtering
            switch (Filter.ToLower())
            {
                case "friends":
                    FilmQuery = FilmQuery.Where(r => UsersFriends!.Contains(r.AuthorId));
                    break;
                default:
                    //error handling
                    break;
            }

            //sorting
            switch (Sort.ToLower())
            {
                case "popularity":
                    FilmQuery = Desc ? FilmQuery.OrderBy(r => r.Flags).ThenByDescending(r => r.LikeCount) : FilmQuery.OrderBy(r => r.Flags).ThenBy(r => r.LikeCount);
                    break;
                case "date created":
                    FilmQuery = Desc ? FilmQuery.OrderBy(r => r.Flags).ThenByDescending(r => r.Date) : FilmQuery.OrderBy(r => r.Flags).ThenBy(r => r.Date);
                    break;
                case "rating":
                    FilmQuery = Desc ? FilmQuery.OrderBy(r => r.Flags).ThenByDescending(r => r.Rating) : FilmQuery.OrderBy(r => r.Flags).ThenBy(r => r.Rating);
                    break;
                default:
                    //error handling
                    FilmQuery = FilmQuery.OrderBy(r => r.Flags).ThenByDescending(r => r.LikeCount);
                    break;
            }

            var TotalCount = await FilmQuery.CountAsync();
            var Lists = await FilmQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();
            return (Lists, TotalCount);
        }

        public async Task<List<Review>> GetTopAsync(int FilmId, int Top) =>
            await _context.Reviews
                .Where(r => r.FilmId == FilmId && r.Text != null && !r.Spoiler)
                .OrderBy(r => r.Flags).ThenByDescending(r => r.LikeCount).ThenBy(r => r.Date)
                .Take(Top)
                .ToListAsync();

        public async Task<(List<Review> Reviews, int TotalCount)> GetByAuthorAsync(Guid AuthorId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var UserQuery = _context.Reviews
                .Where(r => r.AuthorId == AuthorId)
                .AsQueryable();

            //filtering - querying by User already filters out enough

            //sorting
            switch (Sort.ToLower())
            {
                case "popularity":
                    UserQuery = Desc ? UserQuery.OrderByDescending(r => r.LikeCount) : UserQuery.OrderBy(r => r.LikeCount);
                    break;
                case "date created":
                    UserQuery = Desc ? UserQuery.OrderByDescending(r => r.Date) : UserQuery.OrderBy(r => r.Date);
                    break;
                case "rating":
                    UserQuery = Desc ? UserQuery.OrderByDescending(r => r.Rating) : UserQuery.OrderBy(r => r.Rating);
                    break;
                default:
                    //error handling
                    UserQuery = UserQuery.OrderByDescending(r => r.Date);
                    break;
            }

            var TotalCount = await UserQuery.CountAsync();
            var Lists = await UserQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();
            return (Lists, TotalCount);
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
