using Heteroboxd.Data;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface IFilmRepository
    {
        Task<JoinResponse<Film, List<JoinResponse<Celebrity, List<CelebrityCredit>>>>?> GetByIdAsync(int Id);
        Task<Film?> LightweightFetcherAsync(int Id);
        Task<List<Film>> GetByIdsAsync(IReadOnlyCollection<int> Ids);
        Task<List<Trending>> GetTrendingAsync();
        Task<(List<Film> Films, int TotalCount, List<UserWatchedFilm>? Seen, int? SeenCount)> GetAllAsync(Guid? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<(List<Film> Films, List<UserWatchedFilm>? Seen, int? SeenCount)> ShuffleAsync(Guid? UserId, int PageSize);
        Task<(List<Film> Films, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<Dictionary<double, int>> GetRatingsAsync(int FilmId);
        Task<(List<JoinResponse<Film, List<JoinResponse<Celebrity, List<CelebrityCredit>>>>> Results, int TotalCount)> SearchAsync(string Search, int Page, int PageSize);
        Task UpdateAverageRatingAsync(int FilmId, double AvgRating);
        Task UpdateRatingCountAsync(int FilmId, int Delta);
        Task UpdateWatchCountAsync(int FilmId, int Delta);
    }

    public class FilmRepository : IFilmRepository
    {
        public readonly HeteroboxdContext _context;

        public FilmRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<JoinResponse<Film, List<JoinResponse<Celebrity, List<CelebrityCredit>>>>?> GetByIdAsync(int Id)
        {
            var Film = await _context.Films
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == Id);
            if (Film == null) return null;

            var Credits = await _context.CelebrityCredits
                .AsNoTracking()
                .Where(cc => cc.FilmId == Id)
                .GroupBy(cc => cc.CelebrityId)
                .Select(g => new { CelebrityId = g.Key, Credits = g.ToList() })
                .Join( _context.Celebrities, g => g.CelebrityId, c => c.Id, (g, c) => new { c, g })
                .Select(x => new JoinResponse<Celebrity, List<CelebrityCredit>> { Item = x.c, Joined = x.g.Credits })
                .ToListAsync();
            return new JoinResponse<Film, List<JoinResponse<Celebrity, List<CelebrityCredit>>>> { Item = Film, Joined = Credits };
        }

        public async Task<Film?> LightweightFetcherAsync(int Id) =>
            await _context.Films
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == Id);

        public async Task<List<Film>> GetByIdsAsync(IReadOnlyCollection<int> Ids)
        {
            if (Ids.Count == 0) return new();

            return await _context.Films
                .AsNoTracking()
                .Where(f => Ids.Contains(f.Id))
                .ToListAsync();
        }

        public async Task<List<Trending>> GetTrendingAsync() =>
            await _context.Trendings
                .AsNoTracking()
                .OrderBy(t => t.Rank)
                .ToListAsync();

        public async Task<(List<Film> Films, int TotalCount, List<UserWatchedFilm>? Seen, int? SeenCount)> GetAllAsync(Guid? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null)
            {
                var FilmsQuery = _context.Films
                    .AsNoTracking()
                    .AsQueryable();

                //filtering
                switch (Filter.ToLower())
                {
                    case "genre":
                        FilmsQuery = FilmsQuery.Where(f => f.Genres.Contains(FilterValue!));
                        break;
                    case "year":
                        FilmsQuery = FilmsQuery.Where(f => f.Date.Year == int.Parse(FilterValue!));
                        break;
                    case "popular":
                        FilmsQuery = FilmsQuery.Where(f => f.WatchCount > 0);
                        break;
                    case "country":
                        FilmsQuery = FilmsQuery.Where(f => f.Country.Contains(FilterValue!));
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
                        FilmsQuery = Desc ? FilmsQuery.OrderByDescending(f => f.Date) : FilmsQuery.OrderBy(f => f.Date);
                        break;
                    case "average rating":
                        FilmsQuery = Desc ? FilmsQuery.OrderByDescending(f => f.AverageRating).ThenByDescending(f => f.WatchCount) : FilmsQuery.OrderBy(f => f.AverageRating).ThenByDescending(f => f.WatchCount);
                        break;
                    default:
                        //error fallback
                        if (Filter.ToLower() == "popular" || Filter.ToLower() == "year")
                        {
                            FilmsQuery = Desc ? FilmsQuery.OrderByDescending(f => f.WatchCount) : FilmsQuery.OrderBy(f => f.WatchCount);
                        }
                        else
                        {
                            FilmsQuery = Desc ? FilmsQuery.OrderByDescending(f => f.Date) : FilmsQuery.OrderBy(f => f.Date);
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
                var FilmsQuery = _context.Films
                    .AsNoTracking()
                    .GroupJoin(_context.UserWatchedFilms.Where(uwf => uwf.UserId == UserId), f => f.Id, uwf => uwf.FilmId, (f, uwfs) => new { Film = f, Uwfs = uwfs })
                    .SelectMany(x => x.Uwfs.DefaultIfEmpty(), (x, uwf) => new { Film = x.Film, Uwf = uwf })
                    .AsQueryable();

                //filtering
                switch (Filter.ToLower())
                {
                    case "genre":
                        FilmsQuery = FilmsQuery.Where(x => x.Film.Genres.Contains(FilterValue!));
                        break;
                    case "year":
                        FilmsQuery = FilmsQuery.Where(x => x.Film.Date.Year == int.Parse(FilterValue!));
                        break;
                    case "popular":
                        FilmsQuery = FilmsQuery.Where(x => x.Film.WatchCount > 0);
                        break;
                    case "country":
                        FilmsQuery = FilmsQuery.Where(x => x.Film.Country.Contains(FilterValue!));
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
                        FilmsQuery = Desc ? FilmsQuery.OrderByDescending(x => x.Film.Date) : FilmsQuery.OrderBy(x => x.Film.Date);
                        break;
                    case "average rating":
                        FilmsQuery = Desc ? FilmsQuery.OrderByDescending(x => x.Film.AverageRating).ThenByDescending(x => x.Film.WatchCount) : FilmsQuery.OrderBy(x => x.Film.AverageRating).ThenByDescending(x => x.Film.WatchCount);
                        break;
                    default:
                        //error fallback
                        if (Filter.ToLower() == "popular" || Filter.ToLower() == "year")
                        {
                            FilmsQuery = Desc ? FilmsQuery.OrderByDescending(x => x.Film.WatchCount) : FilmsQuery.OrderBy(x => x.Film.WatchCount);
                        }
                        else
                        {
                            FilmsQuery = Desc ? FilmsQuery.OrderByDescending(x => x.Film.Date) : FilmsQuery.OrderBy(x => x.Film.Date);
                        }
                        break;
                }
                var TotalCount = await FilmsQuery.CountAsync();
                var SeenCount = await FilmsQuery.Where(x => x.Uwf != null).CountAsync();

                var JoinResult = await FilmsQuery
                    .Skip((Page - 1) * PageSize)
                    .Take(PageSize)
                    .ToListAsync();

                return (JoinResult.Select(x => x.Film).ToList(), TotalCount, JoinResult.Where(x => x.Uwf != null).Select(x => x.Uwf).ToList(), SeenCount)!;
            }
        }

        public async Task<(List<Film> Films, List<UserWatchedFilm>? Seen, int? SeenCount)> ShuffleAsync(Guid? UserId, int PageSize)
        {
            if (UserId == null)
            {
                var Films = await _context.Films
                    .AsNoTracking()
                    .OrderBy(f => EF.Functions.Random())
                    .Take(PageSize)
                    .ToListAsync();
                return (Films, null, null);
            }
            else
            {
                var FilmsQuery = _context.Films
                    .AsNoTracking()
                    .OrderBy(f => EF.Functions.Random())
                    .Take(PageSize)
                    .GroupJoin(_context.UserWatchedFilms.Where(uwf => uwf.UserId == UserId), f => f.Id, uwf => uwf.FilmId, (f, uwfs) => new { f, uwfs })
                    .SelectMany(x => x.uwfs.DefaultIfEmpty(), (x, uwf) => new { x.f, uwf })
                    .AsQueryable();
                var SeenCount = await FilmsQuery.Where(x => x.uwf != null).CountAsync();
                var Films = await FilmsQuery.ToListAsync();
                return (Films.Select(x => x.f).ToList(), Films.Where(x => x.uwf != null).Select(x => x.uwf).ToList(), SeenCount)!;
            }
        }

        public async Task<(List<Film> Films, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var UwQuery = _context.UserWatchedFilms
                .AsNoTracking()
                .Where(uwf => uwf.UserId == UserId)
                .Join(_context.Films, uwf => uwf.FilmId, f => f.Id, (uwf, f) => new { Uwf = uwf, Film = f });

            //filtering
            switch (Filter.ToLower())
            {
                case "genre":
                    UwQuery = UwQuery.Where(x => x.Film.Genres.Contains(FilterValue!));
                    break;
                case "year":
                    UwQuery = UwQuery.Where(x => x.Film.Date.Year == int.Parse(FilterValue!));
                    break;
                case "country":
                    UwQuery = UwQuery.Where(x => x.Film.Country.Contains(FilterValue!));
                    break;
                default:
                    //error fallback
                    break;
            }

            //sorting
            switch (Sort.ToLower())
            {
                case "date watched":
                    UwQuery = Desc ? UwQuery.OrderByDescending(x => x.Uwf.Date) : UwQuery.OrderBy(x => x.Uwf.Date);
                    break;
                case "popularity":
                    UwQuery = Desc ? UwQuery.OrderByDescending(x => x.Film.WatchCount) : UwQuery.OrderBy(x => x.Film.WatchCount);
                    break;
                case "length":
                    UwQuery = Desc ? UwQuery.OrderByDescending(x => x.Film.Length) : UwQuery.OrderBy(x => x.Film.Length);
                    break;
                case "release date":
                    UwQuery = Desc ? UwQuery.OrderByDescending(x => x.Film.Date) : UwQuery.OrderBy(x => x.Film.Date);
                    break;
                case "average rating":
                    UwQuery = Desc ? UwQuery.OrderByDescending(x => x.Film.AverageRating).ThenByDescending(x => x.Film.WatchCount) : UwQuery.OrderBy(x => x.Film.AverageRating).ThenByDescending(x => x.Film.WatchCount);
                    break;
                default:
                    //error fallback
                    UwQuery = UwQuery.OrderByDescending(x => x.Uwf.Date);
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
                .AsNoTracking()
                .Where(r => r.FilmId == FilmId)
                .GroupBy(r => r.Rating)
                .Select(g => new { Rating = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Rating, x => x.Count);

        public async Task<(List<JoinResponse<Film, List<JoinResponse<Celebrity, List<CelebrityCredit>>>>> Results, int TotalCount)> SearchAsync(string Search, int Page, int PageSize)
        {
            var Query = _context.Films
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrEmpty(Search))
            {
                Query = Query.Where(f =>
                    EF.Functions.TrigramsSimilarity(f.Title, Search) > 0.3f ||
                    EF.Functions.TrigramsSimilarity(f.OriginalTitle ?? "", Search) > 0.3f);
            }

            var TotalCount = await Query.CountAsync();

            var Films = await Query
                .OrderByDescending(f => EF.Functions.TrigramsSimilarity(f.Title, Search)).ThenByDescending(f => f.WatchCount)
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            var FilmIds = Films.Select(f => f.Id).ToHashSet();

            var DirectorsByFilm = await _context.CelebrityCredits
                .AsNoTracking()
                .Where(cc => FilmIds.Contains(cc.FilmId) && cc.Role == Role.Director)
                .Join(_context.Celebrities, cc => cc.CelebrityId, c => c.Id, (cc, c) => new { cc.FilmId, Celebrity = c, Credit = cc })
                .GroupBy(x => x.FilmId)
                .ToDictionaryAsync(
                    g => g.Key,
                    g => g.Select(x => new JoinResponse<Celebrity, List<CelebrityCredit>> { Item = x.Celebrity, Joined = [x.Credit] }).ToList()
                );

            var Results = Films.Select(f => new JoinResponse<Film, List<JoinResponse<Celebrity, List<CelebrityCredit>>>> { Item = f, Joined = DirectorsByFilm.TryGetValue(f.Id, out var directors) ? directors : [] }).ToList();
            return (Results, TotalCount);
        }

        public async Task UpdateAverageRatingAsync(int FilmId, double AvgRating)
        {
            var Rows = await _context.Films
                .Where(f => f.Id == FilmId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    f => f.AverageRating,
                    f => AvgRating
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task UpdateRatingCountAsync(int FilmId, int Delta)
        {
            var Rows = await _context.Films
                .Where(f => f.Id == FilmId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    f => f.RatingCount,
                    f => f.RatingCount + Delta
                ));
            if (Rows == 0) throw new KeyNotFoundException();
        }

        public async Task UpdateWatchCountAsync(int FilmId, int Delta)
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
