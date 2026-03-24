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
        Task<(List<JoinResponse<Review, User>> Reviews, int TotalCount)> GetByFilmAsync(int FilmId, List<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<(List<JoinResponse<Review, User>> Responses, int TotalCount)> GetTopAsync(int FilmId, int PageSize);
        Task<(List<JoinResponse<Review, Film>> Responses, int TotalCount)> GetByAuthorAsync(Guid AuthorId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<JoinedReviewFilm?> GetByUserFilmAsync(Guid AuthorId, int FilmId);
        Task UpdateLikeCountAsync(Guid ReviewId, int Delta);
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
                    Query = Desc ? Query.OrderByDescending(x => x.r.LikeCount) : Query.OrderBy(x => x.r.LikeCount);
                    break;
                case "date created":
                    Query = Desc ? Query.OrderByDescending(x => x.r.Date) : Query.OrderBy(x => x.r.Date);
                    break;
                case "rating":
                    Query = Desc ? Query.OrderByDescending(x => x.r.Rating) : Query.OrderBy(x => x.r.Rating);
                    break;
                case "flags":
                    Query = Query.OrderByDescending(x => x.r.Flags);
                    break;
                default:
                    //error handling
                    Query = Query.OrderByDescending(x => x.r.Date);
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
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == Id);

        public async Task<JoinResponse<JoinedReviewFilm, User>?> GetJoinedByIdAsync(Guid Id) =>
            await _context.Reviews
                .AsNoTracking()
                .Where(r => r.Id == Id)
                .Join(_context.Films, r => r.FilmId, f => f.Id, (r, f) => new { r, f })
                .Join(_context.Users, x => x.r.AuthorId, u => u.Id, (x, u) => new { x.r, x.f, u })
                .Select(x => new JoinResponse<JoinedReviewFilm, User> { Item = new JoinedReviewFilm(x.r, x.f), Joined = x.u })
                .FirstOrDefaultAsync();

        public async Task<(List<JoinResponse<Review, User>> Reviews, int TotalCount)> GetByFilmAsync(int FilmId, List<Guid>? UsersFriends, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var FilmQuery = _context.Reviews
                .AsNoTracking()
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
                    FilmQuery = Desc ? FilmQuery.OrderByDescending(x => x.r.LikeCount) : FilmQuery.OrderBy(x => x.r.LikeCount);
                    break;
                case "date created":
                    FilmQuery = Desc ? FilmQuery.OrderByDescending(x => x.r.Date) : FilmQuery.OrderBy(x => x.r.Date);
                    break;
                case "rating":
                    FilmQuery = Desc ? FilmQuery.OrderByDescending(x => x.r.Rating) : FilmQuery.OrderBy(x => x.r.Rating);
                    break;
                default:
                    //error handling
                    FilmQuery = FilmQuery.OrderByDescending(x => x.r.LikeCount);
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

        public async Task<(List<JoinResponse<Review, User>> Responses, int TotalCount)> GetTopAsync(int FilmId, int PageSize)
        {
            var Responses = await _context.Reviews
                .AsNoTracking()
                .Where(r => r.FilmId == FilmId && r.Text != null && r.Text.Length > 0 && !r.Spoiler)
                .OrderByDescending(r => r.LikeCount)
                .Take(PageSize)
                .Join(_context.Users, r => r.AuthorId, u => u.Id, (r, u) => new { r, u })
                .Select(x => new JoinResponse<Review, User> { Item = x.r, Joined = x.u })
                .ToListAsync();
            var TotalCount = await _context.Reviews.AsNoTracking().CountAsync(r => r.FilmId == FilmId);
            return (Responses, TotalCount);
        }

        public async Task<(List<JoinResponse<Review, Film>> Responses, int TotalCount)> GetByAuthorAsync(Guid AuthorId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var UserQuery = _context.Reviews
                .AsNoTracking()
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

        public async Task<JoinedReviewFilm?> GetByUserFilmAsync(Guid AuthorId, int FilmId)
        {
            var JoinedReviewFilm = await _context.Reviews
                .AsNoTracking()
                .Join(_context.Films, r => r.FilmId, f => f.Id, (r, f) => new { r, f })
                .FirstOrDefaultAsync(x => x.r.AuthorId == AuthorId && x.r.FilmId == FilmId);

            return JoinedReviewFilm == null ? null : new JoinedReviewFilm(JoinedReviewFilm.r, JoinedReviewFilm.f);
        }

        public async Task UpdateLikeCountAsync(Guid ReviewId, int Delta)
        {
            var Rows = await _context.Reviews
                .Where(r => r.Id == ReviewId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    r => r.LikeCount,
                    r => Math.Max(r.LikeCount + Delta, 0)
                ));
            if (Rows == 0) throw new KeyNotFoundException();
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
