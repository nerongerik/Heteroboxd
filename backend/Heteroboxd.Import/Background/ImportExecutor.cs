using CsvHelper;
using CsvHelper.Configuration;
using EFCore.BulkExtensions;
using Heteroboxd.Shared.Data;
using Heteroboxd.Shared.Integrations;
using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Globalization;
using System.IO.Compression;

namespace Heteroboxd.Import.Background
{
    public interface IImportExecutor
    {
        Task<bool> ExecuteReadQueue(IServiceProvider _provider, CancellationToken CT);
        Task ExecutePendingImports(IServiceProvider _provider, CancellationToken CT);
    }

    public class ImportExecutor : IImportExecutor
    {
        public async Task<bool> ExecuteReadQueue(IServiceProvider _provider, CancellationToken CT)
        {
            using var _scope = _provider.CreateScope();
            var _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();

            var TotalCount = await _context.ImportJobs
                .Where(ij => ij.Status == ImportJobStatus.Pending)
                .CountAsync(CT);
            return TotalCount > 0;
        }

        public async Task ExecutePendingImports(IServiceProvider _provider, CancellationToken CT)
        {
            using var _scope = _provider.CreateScope();
            var _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();
            var _r2Handler = _scope.ServiceProvider.GetRequiredService<IR2Handler>();
            var _httpClient = _scope.ServiceProvider.GetRequiredService<HttpClient>();

            var PendingJobs = await _context.ImportJobs
                .Where(ij => ij.Status == ImportJobStatus.Pending)
                .OrderBy(ij => ij.Date)
                .Select(ij => ij.UserId)
                .ToListAsync(CT);

            await _context.ImportJobs
                .Where(ij => PendingJobs.Contains(ij.UserId))
                .ExecuteUpdateAsync(s => s.SetProperty(
                    ij => ij.Status,
                    ij => ImportJobStatus.Running
                ));

            foreach (var uid in PendingJobs)
            {
                var Data = await _r2Handler.DownloadUserData(uid);
                if (Data == null)
                {
                    await _context.ImportJobs
                        .Where(ij => ij.UserId == uid)
                        .ExecuteUpdateAsync(s => s.SetProperty(
                            ij => ij.Status,
                            ij => ImportJobStatus.Failed
                        ));
                    continue;
                }

                using var Zip = new ZipArchive(Data, ZipArchiveMode.Read);

                await ParseLetterboxdProfile(await ParseCsv(Zip.Entries.FirstOrDefault(e => e.FullName == "profile.csv")), uid, _context, _httpClient, CT);
                await ParseLetterboxdWatchlist(await ParseCsv(Zip.Entries.FirstOrDefault(e => e.FullName == "watchlist.csv")), uid, _context, CT);
                await ParseLetterboxdWatched(await ParseCsv(Zip.Entries.FirstOrDefault(e => e.FullName == "watched.csv")), uid, _context, CT);
                await ParseLetterboxdRatingsAndReviews(await ParseCsv(Zip.Entries.FirstOrDefault(e => e.FullName == "ratings.csv")), await ParseCsv(Zip.Entries.FirstOrDefault(e => e.FullName == "reviews.csv")), uid, _context, CT);
            }
        }

        private async Task ParseLetterboxdProfile(Dictionary<string, List<string>>? Profile, Guid UserId, HeteroboxdContext _context, HttpClient _client, CancellationToken CT)
        {
            if (Profile == null) return;
            var User = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == UserId);
            if (User == null) return;

            var Name = Profile["Username"]?.First().Trim() ?? User.Name;
            var Bio = Profile["Bio"]?.First().Trim() ?? User.Bio;
            var Date = DateTime.SpecifyKind(
                DateTime.ParseExact(Profile["Date Joined"]?.First().Trim() ?? User.Date.ToString("yyyy-MM-dd"), "yyyy-MM-dd", CultureInfo.InvariantCulture),
                DateTimeKind.Utc
            );
            var Gender = Profile["Pronoun"]?.First().Trim() == "He / his" ? Shared.Models.Enums.Gender.Male : Shared.Models.Enums.Gender.Female;

            await _context.Users
                .Where(u => u.Id == UserId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(
                        u => u.Name,
                        u => Name
                    )
                    .SetProperty(
                        u => u.Bio,
                        u => Bio
                    )
                    .SetProperty(
                        u => u.Date,
                        u => Date
                    )
                    .SetProperty(
                        u => u.Gender,
                        u => Gender
                    )
                );
        }
        
        private async Task ParseLetterboxdWatchlist(Dictionary<string, List<string>>? Watchlist, Guid UserId, HeteroboxdContext _context, CancellationToken CT)
        {
            if (Watchlist == null) return;

            var WatchlistEntries = new Dictionary<int, WatchlistEntry>();

            for (int i = 0; i < Watchlist["Date"].Count; i++)
            {
                if (string.IsNullOrEmpty(Watchlist["Name"][i].Trim()) || !int.TryParse(Watchlist["Year"][i], out int Year))
                {
                    continue;
                }

                var Film = await FuzzyMatchFilm(Watchlist["Name"][i].Trim(), Year, _context, CT);
                if (Film == null)
                {
                    continue;
                }

                if (!WatchlistEntries.ContainsKey(Film.Value))
                {
                    try
                    {
                        WatchlistEntries[Film.Value] = new WatchlistEntry(DateTime.SpecifyKind(DateTime.ParseExact(Watchlist["Date"][i].Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture), DateTimeKind.Utc), Film.Value, UserId);
                    }
                    catch
                    {
                        WatchlistEntries[Film.Value] = new WatchlistEntry(Film.Value, UserId);
                    }
                }
            }

            if (WatchlistEntries.Count == 0) return;
            await _context.BulkInsertOrUpdateAsync(WatchlistEntries.Values.ToList(), new BulkConfig
            {
                SetOutputIdentity = false,
                UpdateByProperties = [nameof(WatchlistEntry.FilmId), nameof(WatchlistEntry.UserId)],
                PropertiesToExcludeOnUpdate = [nameof(WatchlistEntry.Id), nameof(WatchlistEntry.Date)]
            });
        }
        
        private async Task ParseLetterboxdWatched(Dictionary<string, List<string>>? Watched, Guid UserId, HeteroboxdContext _context, CancellationToken CT)
        {
            if (Watched == null) return;

            var UserWatchedFilms = new Dictionary<int, UserWatchedFilm>();

            for (int i = 0; i < Watched["Date"].Count; i++)
            {
                if (string.IsNullOrEmpty(Watched["Name"][i].Trim()) || !int.TryParse(Watched["Year"][i], out int Year))
                {
                    continue;
                }

                var Film = await FuzzyMatchFilm(Watched["Name"][i].Trim(), Year, _context, CT);
                if (Film == null)
                {
                    continue;
                }

                if (UserWatchedFilms.TryGetValue(Film.Value, out var Existing))
                {
                    Existing.TimesWatched++;
                }
                else
                {
                    try
                    {
                        UserWatchedFilms[Film.Value] = new UserWatchedFilm(UserId, Film.Value, DateTime.SpecifyKind( DateTime.ParseExact(Watched["Date"][i].Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture), DateTimeKind.Utc));
                    }
                    catch
                    {
                        UserWatchedFilms[Film.Value] = new UserWatchedFilm(UserId, Film.Value);
                    }
                }
            }

            if (UserWatchedFilms.Count == 0) return;
            await _context.BulkInsertOrUpdateAsync(UserWatchedFilms.Values.ToList(), new BulkConfig
            {
                SetOutputIdentity = false,
                UpdateByProperties = [nameof(UserWatchedFilm.UserId), nameof(UserWatchedFilm.FilmId)],
                PropertiesToExcludeOnUpdate = [nameof(UserWatchedFilm.Id)]
            });
        }

        private async Task ParseLetterboxdRatingsAndReviews(Dictionary<string, List<string>>? Ratings, Dictionary<string, List<string>>? Reviews, Guid UserId, HeteroboxdContext _context, CancellationToken CT)
        {
            if (Ratings == null && Reviews == null) return;

            var Coalesced = new Dictionary<(string Name, int Year), (double Rating, string? Text, DateTime Date)>();

            if (Ratings != null)
            {
                for (int i = 0; i < Ratings["Date"].Count; i++)
                {
                    var Name = Ratings["Name"][i].Trim();
                    if (string.IsNullOrEmpty(Name) || !int.TryParse(Ratings["Year"][i], out int Year)) continue;
                    if (!double.TryParse(Ratings["Rating"][i], NumberStyles.Any, CultureInfo.InvariantCulture, out double Rating)) continue;

                    DateTime Date;
                    try { Date = DateTime.SpecifyKind(DateTime.ParseExact(Ratings["Date"][i].Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture), DateTimeKind.Utc); }
                    catch { Date = DateTime.UtcNow; }

                    var Key = (Name, Year);
                    if (!Coalesced.TryGetValue(Key, out var Existing) || Date >= Existing.Date)
                    {
                        Coalesced[Key] = (Rating, null, Date);
                    }
                }
            }

            if (Reviews != null)
            {
                for (int i = 0; i < Reviews["Date"].Count; i++)
                {
                    var Name = Reviews["Name"][i].Trim();
                    if (string.IsNullOrEmpty(Name) || !int.TryParse(Reviews["Year"][i], out int Year)) continue;

                    DateTime Date;
                    try { Date = DateTime.SpecifyKind(DateTime.ParseExact(Reviews["Date"][i].Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture), DateTimeKind.Utc); }
                    catch { Date = DateTime.UtcNow; }

                    var Text = Reviews["Review"][i].Trim();
                    double Rating = 0;
                    bool HasRating = double.TryParse(Reviews["Rating"][i], NumberStyles.Any, CultureInfo.InvariantCulture, out double ReviewRating);

                    var Key = (Name, Year);
                    if (Coalesced.TryGetValue(Key, out var Existing))
                    {
                        if (Date >= Existing.Date)
                        {
                            Rating = HasRating ? ReviewRating : Existing.Rating;
                            Coalesced[Key] = (Rating, string.IsNullOrEmpty(Text) ? Existing.Text : Text, Date);
                        }
                        else
                        {
                            if (string.IsNullOrEmpty(Existing.Text) && !string.IsNullOrEmpty(Text))
                            {
                                Coalesced[Key] = (Existing.Rating, Text, Existing.Date);
                            }
                        }
                    }
                    else
                    {
                        Rating = HasRating ? ReviewRating : 0;
                        Coalesced[Key] = (Rating, string.IsNullOrEmpty(Text) ? null : Text, Date);
                    }
                }
            }

            var ReviewsToUpsert = new Dictionary<int, Review>();
            foreach (var ((Name, Year), (Rating, Text, Date)) in Coalesced)
            {
                var FilmId = await FuzzyMatchFilm(Name, Year, _context, CT);
                if (FilmId == null) continue;

                var Flags = Flag(Text);
                var Candidate = new Review(Rating, Text, Date, Flags, false, UserId, FilmId.Value);

                if (!ReviewsToUpsert.TryGetValue(FilmId.Value, out var Existing) || Date >= Existing.Date)
                {
                    ReviewsToUpsert[FilmId.Value] = Candidate;
                }
            }

            if (ReviewsToUpsert.Count == 0) return;
            await _context.BulkInsertOrUpdateAsync(ReviewsToUpsert.Values.ToList(), new BulkConfig
            {
                SetOutputIdentity = false,
                UpdateByProperties = [nameof(Review.AuthorId), nameof(Review.FilmId)],
                PropertiesToExcludeOnUpdate = [nameof(Review.Id), nameof(Review.LikeCount), nameof(Review.CommentCount), nameof(Review.NotificationsOn), nameof(Review.Spoiler)]
            });
        }

        private async Task<Dictionary<string, List<string>>?> ParseCsv(ZipArchiveEntry? ZippedCsv)
        {
            if (ZippedCsv == null) return null;

            var Config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true,
                MissingFieldFound = null,
                BadDataFound = null
            };

            using var Csv = new CsvReader(new StreamReader(ZippedCsv.Open()), Config);

            await Csv.ReadAsync(); Csv.ReadHeader();
            if (Csv.HeaderRecord == null) return null;

            var Records = new Dictionary<string, List<string>>();
            Csv.HeaderRecord.ToList().ForEach(h => Records[h] = new List<string>());

            while (await Csv.ReadAsync())
            {
                foreach (var Header in Csv.HeaderRecord) Records[Header].Add(Csv.GetField(Header) ?? "");
            }

            return Records;
        }

        private async Task<int?> FuzzyMatchFilm(string Title, int Year, HeteroboxdContext _context, CancellationToken CT)
        {
            var Candidate = await _context.Films
                .AsNoTracking()
                .Where(f => EF.Functions.ILike(f.Title, $"%{Title.Trim()}%") && f.Date.Year == Year)
                .Select(f => (int?)f.Id)
                .FirstOrDefaultAsync(CT);

            if (Candidate != null) return Candidate;
            else return await _context.Films
                .AsNoTracking()
                .Where(f => f.Date.Year == Year && EF.Functions.TrigramsSimilarity(f.Title, Title) > 0.5)
                .OrderByDescending(f => EF.Functions.TrigramsSimilarity(f.Title, Title))
                .Select(f => (int?)f.Id)
                .FirstOrDefaultAsync(CT);
        }

        private int Flag(string? Text)
        {
            if (string.IsNullOrWhiteSpace(Text)) return 0;

            string _text = Text.ToLowerInvariant().Trim();
            int Score = 0;

            foreach (var p in AutoModerator.SocialPatterns)
            {
                if (_text.Contains(p) && (_text.Contains("add me") || _text.Contains("dm me") || _text.Contains("message me")))
                {
                    Score += AutoModerator.SocialMediaSolicitation;
                    break;
                }
            }
            foreach (var p in AutoModerator.ShippingPatterns)
            {
                if (_text.Contains(p))
                {
                    Score += AutoModerator.Queershipping;
                    break;
                }
            }
            int SimpCount = 0;
            foreach (var p in AutoModerator.SimpPatterns)
            {
                if (_text.Contains(p)) SimpCount++;
            }
            Score += SimpCount * AutoModerator.SimpingPerTerm;
            if (_text.Contains("ryan gosling")) Score = Math.Max(0, Score + AutoModerator.GoslingianForgiveness);
            int BlasphemyCount = 0;
            foreach (var p in AutoModerator.BlasphemyPatterns)
            {
                if (_text.Contains(p)) BlasphemyCount++;
            }
            Score += BlasphemyCount * AutoModerator.BlasphemyPerTerm;
            int WordCount = _text.Split(new[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries).Length;
            if (WordCount <= 5) Score += AutoModerator.VeryShortReview;
            else if (WordCount <= 12) Score += AutoModerator.ShortReview;
            if (_text.Count(c => c == '!' || c == '?' || c == '.') > 4 && WordCount < 20) Score += AutoModerator.MemeyPunctuation;
            if (WordCount >= 80) Score += AutoModerator.LongThoughtfulBonus;

            return Math.Max(0, Score);
        }
    }
}
