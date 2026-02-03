using Heteroboxd.Data;
using Heteroboxd.Models;
using Heteroboxd.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface IFilmRepository
    {
        Task<Film?> GetByIdAsync(int Id);
        Task<Film?> LightweightFetcher(int Id);
        Task<List<Film>> GetByIdsAsync(IReadOnlyCollection<int> Ids);
        Task<List<Trending>> GetTrendingAsync();
        Task<(List<Film> Films, int TotalCount)> GetFilmsAsync(int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<(List<Film> Films, int TotalCount)> GetByCelebrityAsync(int CelebrityId, int Page, int PageSize);
        Task<(List<Film> Films, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize);
        Task<Dictionary<double, int>> GetRatingsAsync(int FilmId);
        Task<List<Film>> SearchAsync(string Title);
        Task UpdateFilmWatchCountEfCore7Async(int FilmId, int Delta);
    }

    public class FilmRepository : IFilmRepository
    {
        public readonly HeteroboxdContext _context;

        public FilmRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<Film?> GetByIdAsync(int Id) =>
            await _context.Films
                .AsSplitQuery()
                .Include(f => f.CastAndCrew)
                .Include(f => f.Reviews)
                .FirstOrDefaultAsync(f => f.Id == Id);

        public async Task<Film?> LightweightFetcher(int Id) =>
            await _context.Films
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == Id);

        public async Task<List<Film>> GetByIdsAsync(IReadOnlyCollection<int> Ids)
        {
            if (Ids.Count == 0) return new();

            return await _context.Films
                .Where(f => Ids.Contains(f.Id))
                .ToListAsync();
        }

        public async Task<List<Trending>> GetTrendingAsync() =>
            await _context.Trendings
                .AsNoTracking()
                .OrderBy(t => t.Rank)
                .ToListAsync();

        public async Task<(List<Film> Films, int TotalCount)> GetFilmsAsync(int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var FilmsQuery = _context.Films.AsQueryable();
            //filtering
            switch (Filter.ToLower())
            {
                case "genre":
                    FilmsQuery = FilmsQuery.Where(f => f.Genres.Contains(FilterValue!));
                    break;
                case "year":
                    FilmsQuery = FilmsQuery.Where(f => f.ReleaseYear == int.Parse(FilterValue!));
                    break;
                case "popular":
                    FilmsQuery = FilmsQuery.Where(f => f.WatchCount > 0);
                    break;
                case "country":
                    FilmsQuery = _context.Films.FromSqlRaw(@"SELECT * FROM ""Films"" WHERE EXISTS (SELECT 1 FROM jsonb_each_text(""Country"") WHERE value = {0})", FilterValue!).AsQueryable();
                    break;
                default:
                    //error fallback
                    break;
            }
            //sorting
            switch (Sort.ToLower())
            {
                case "popularity":
                    FilmsQuery = Desc ? FilmsQuery.OrderByDescending(f => f.WatchCount) : FilmsQuery.OrderBy(f => f.WatchCount);
                    break;
                case "length":
                    FilmsQuery = Desc ? FilmsQuery.OrderByDescending(f => f.Length) : FilmsQuery.OrderBy(f => f.Length);
                    break;
                case "release date":
                    FilmsQuery = Desc ? FilmsQuery.OrderByDescending(f => f.ReleaseYear) : FilmsQuery.OrderBy(f => f.ReleaseYear);
                    break;
                case "average rating":
                    //todo
                    break;
                default:
                    //error fallback
                    if (Filter.ToLower() == "popular" || Filter.ToLower() == "year")
                    {
                        FilmsQuery = Desc ? FilmsQuery.OrderByDescending(f => f.WatchCount) : FilmsQuery.OrderBy(f => f.WatchCount);
                    }
                    else
                    {
                        FilmsQuery = Desc ? FilmsQuery.OrderByDescending(f => f.ReleaseYear) : FilmsQuery.OrderBy(f => f.ReleaseYear);
                    }
                    break;
            }
            var TotalCount = await FilmsQuery.CountAsync();
            var Films = await FilmsQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();
            return (Films, TotalCount);
        }

        public async Task<(List<Film> Films, int TotalCount)> GetByCelebrityAsync(int CelebrityId, int Page, int PageSize)
        {
            var CelebQuery = _context.Films
                .Include(f => f.CastAndCrew)
                .Where(f => f.CastAndCrew.Any(c => c.CelebrityId == CelebrityId));

            var TotalCount = await CelebQuery.CountAsync();

            var Films = await CelebQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            return (Films, TotalCount);
        }

        public async Task<(List<Film> Films, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize)
        {
            var UwQuery = _context.UserWatchedFilms
                .Where(uw => uw.UserId == UserId)
                .OrderByDescending(uw => uw.DateWatched);

            var TotalCount = await UwQuery.CountAsync();

            var PagedFilmIds = await UwQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(uw => uw.FilmId)
                .ToListAsync();

            var Films = await _context.Films
                .Where(f => PagedFilmIds.Contains(f.Id))
                .ToListAsync();

            var FilmsById = Films.ToDictionary(f => f.Id);
            var OrderedFilms = PagedFilmIds.Select(id => FilmsById[id]).ToList();

            return (OrderedFilms, TotalCount);
        }

        public async Task<Dictionary<double, int>> GetRatingsAsync(int FilmId) =>
            await _context.Reviews
                .Where(r => r.FilmId == FilmId)
                .GroupBy(r => r.Rating)
                .Select(g => new { Rating = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Rating, x => x.Count);

        public async Task<List<Film>> SearchAsync(string Search)
        {
            var Query = _context.Films.AsQueryable();

            if (!string.IsNullOrEmpty(Search))
            {
                Query = Query.Where(f =>
                    EF.Functions.TrigramsSimilarity(f.Title, Search) > 0.3f ||
                    EF.Functions.TrigramsSimilarity(f.OriginalTitle ?? "", Search) > 0.3f);
            }

            return await Query
                .Include(f => f.CastAndCrew.Where(cc => cc.Role == Role.Director))
                .OrderByDescending(f => EF.Functions.TrigramsSimilarity(f.Title, Search))
                .ThenByDescending(f => f.WatchCount)
                .ToListAsync();
        }

        public async Task UpdateFilmWatchCountEfCore7Async(int FilmId, int Delta) //increments/decrements watch count
        {
            var Rows = await _context.Films
                .Where(f => f.Id == FilmId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    f => f.WatchCount,
                    f => f.WatchCount + Delta
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }
    }
}
