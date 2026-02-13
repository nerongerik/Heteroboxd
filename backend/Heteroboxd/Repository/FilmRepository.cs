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
        Task<(List<Film> Films, int TotalCount, List<UserWatchedFilm>? Seen, int? SeenCount)> GetFilmsAsync(Guid? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<(List<Film> Films, int TotalCount)> GetByCelebrityAsync(int CelebrityId, int Page, int PageSize);
        Task<(List<Film> Films, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
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

        public async Task<(List<Film> Films, int TotalCount, List<UserWatchedFilm>? Seen, int? SeenCount)> GetFilmsAsync(Guid? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null)
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
                        FilmsQuery = Desc ? FilmsQuery.OrderByDescending(f => _context.Reviews.Where(r => r.FilmId == f.Id).Select(r => (double?)r.Rating).Average() ?? 0).ThenByDescending(f => f.WatchCount) : FilmsQuery.OrderBy(f => _context.Reviews.Where(r => r.FilmId == f.Id).Select(r => (double?)r.Rating).Average() ?? 0).ThenByDescending(f => f.WatchCount);
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
                return (Films, TotalCount, null, null);
            }
            else
            {
                var FilmsQuery = _context.Films.
                    GroupJoin(_context.UserWatchedFilms.Where(uwf => uwf.UserId == UserId), f => f.Id, uwf => uwf.FilmId, (f, uwfs) => new { Film = f, Uwfs = uwfs })
                    .SelectMany(x => x.Uwfs.DefaultIfEmpty(), (x, uwf) => new { Film = x.Film, Uwf = uwf })
                    .AsQueryable();
                //filtering
                switch (Filter.ToLower())
                {
                    case "genre":
                        FilmsQuery = FilmsQuery.Where(x => x.Film.Genres.Contains(FilterValue!));
                        break;
                    case "year":
                        FilmsQuery = FilmsQuery.Where(x => x.Film.ReleaseYear == int.Parse(FilterValue!));
                        break;
                    case "popular":
                        FilmsQuery = FilmsQuery.Where(x => x.Film.WatchCount > 0);
                        break;
                    case "country":
                        var CountryFilms = _context.Films.FromSqlRaw(@"SELECT * FROM ""Films"" WHERE EXISTS (SELECT 1 FROM jsonb_each_text(""Country"") WHERE value = {0})", FilterValue!);
                        FilmsQuery = FilmsQuery.Where(x => CountryFilms.Select(cf => cf.Id).Contains(x.Film.Id));
                        break;
                    default:
                        //error fallback
                        break;
                }
                //sorting
                switch (Sort.ToLower())
                {
                    case "popularity":
                        FilmsQuery = Desc ? FilmsQuery.OrderByDescending(x => x.Film.WatchCount) : FilmsQuery.OrderBy(x => x.Film.WatchCount);
                        break;
                    case "length":
                        FilmsQuery = Desc ? FilmsQuery.OrderByDescending(x => x.Film.Length) : FilmsQuery.OrderBy(x => x.Film.Length);
                        break;
                    case "release date":
                        FilmsQuery = Desc ? FilmsQuery.OrderByDescending(x => x.Film.ReleaseYear) : FilmsQuery.OrderBy(x => x.Film.ReleaseYear);
                        break;
                    case "average rating":
                        FilmsQuery = Desc ? FilmsQuery.OrderByDescending(x => _context.Reviews.Where(r => r.FilmId == x.Film.Id).Select(r => (double?)r.Rating).Average() ?? 0).ThenByDescending(x => x.Film.WatchCount) : FilmsQuery.OrderBy(x => _context.Reviews.Where(r => r.FilmId == x.Film.Id).Select(r => (double?)r.Rating).Average() ?? 0).ThenByDescending(x => x.Film.WatchCount);
                        break;
                    default:
                        //error fallback
                        if (Filter.ToLower() == "popular" || Filter.ToLower() == "year")
                        {
                            FilmsQuery = Desc ? FilmsQuery.OrderByDescending(x => x.Film.WatchCount) : FilmsQuery.OrderBy(x => x.Film.WatchCount);
                        }
                        else
                        {
                            FilmsQuery = Desc ? FilmsQuery.OrderByDescending(x => x.Film.ReleaseYear) : FilmsQuery.OrderBy(x => x.Film.ReleaseYear);
                        }
                        break;
                }
                var TotalCount = await FilmsQuery.CountAsync();
                var SeenCount = await FilmsQuery.Where(x => x.Uwf != null).CountAsync();
                var JoinResult = await FilmsQuery
                    .Skip((Page - 1) * PageSize)
                    .Take(PageSize)
                    .ToListAsync();
                return (JoinResult.Select(x => x.Film).ToList(), TotalCount, JoinResult.Where(x => x.Uwf != null).Select(x => x.Uwf).ToList(), SeenCount);
            }
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

        public async Task<(List<Film> Films, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var UwQuery = _context.UserWatchedFilms
                .Where(uwf => uwf.UserId == UserId)
                .Join(_context.Films, uwf => uwf.FilmId, f => f.Id, (uwf, f) => new { Uwf = uwf, Film = f });

            //filtering
            switch (Filter.ToLower())
            {
                case "genre":
                    UwQuery = UwQuery.Where(x => x.Film.Genres.Contains(FilterValue!));
                    break;
                case "year":
                    UwQuery = UwQuery.Where(x => x.Film.ReleaseYear == int.Parse(FilterValue!));
                    break;
                case "country":
                    var FilteredIds = await _context.Films
                        .FromSqlRaw(@"SELECT * FROM ""Films"" WHERE EXISTS (SELECT 1 FROM jsonb_each_text(""Country"") WHERE value = {0})", FilterValue)
                        .Select(f => f.Id)
                        .ToListAsync();
                    UwQuery = UwQuery.Where(x => FilteredIds.Contains(x.Film.Id));
                    break;
                default:
                    //error fallback
                    break;
            }

            //sorting
            switch (Sort.ToLower())
            {
                case "date watched":
                    UwQuery = Desc ? UwQuery.OrderByDescending(x => x.Uwf.DateWatched) : UwQuery.OrderBy(x => x.Uwf.DateWatched);
                    break;
                case "popularity":
                    UwQuery = Desc ? UwQuery.OrderByDescending(x => x.Film.WatchCount) : UwQuery.OrderBy(x => x.Film.WatchCount);
                    break;
                case "length":
                    UwQuery = Desc ? UwQuery.OrderByDescending(x => x.Film.Length) : UwQuery.OrderBy(x => x.Film.Length);
                    break;
                case "release date":
                    UwQuery = Desc ? UwQuery.OrderByDescending(x => x.Film.ReleaseYear) : UwQuery.OrderBy(x => x.Film.ReleaseYear);
                    break;
                case "average rating":
                    UwQuery = Desc ? UwQuery.OrderByDescending(x => _context.Reviews.Where(r => r.FilmId == x.Film.Id).Select(r => (double?)r.Rating).Average() ?? 0).ThenByDescending(x => x.Film.WatchCount) : UwQuery.OrderBy(x => _context.Reviews.Where(r => r.FilmId == x.Film.Id).Select(r => (double?)r.Rating).Average() ?? 0).ThenByDescending(x => x.Film.WatchCount);
                    break;
                default:
                    //error fallback
                    UwQuery = UwQuery.OrderByDescending(x => x.Uwf.DateWatched);
                    break;
            }

            var TotalCount = await UwQuery.CountAsync();
            var Uwfs = await UwQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(x => x.Film)
                .ToListAsync();
            return (Uwfs, TotalCount);
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
