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

                try
                {
                    await ParseLetterboxdProfile(await ParseCsv(Zip.Entries.FirstOrDefault(e => e.FullName == "profile.csv")), uid, _context, CT);
                    await ParseLetterboxdWatchlist(await ParseCsv(Zip.Entries.FirstOrDefault(e => e.FullName == "watchlist.csv")), uid, _context, CT);
                    await ParseLetterboxdWatched(await ParseCsv(Zip.Entries.FirstOrDefault(e => e.FullName == "watched.csv")), uid, _context, CT);
                    await ParseLetterboxdRatingsAndReviews(await ParseCsv(Zip.Entries.FirstOrDefault(e => e.FullName == "ratings.csv")), await ParseCsv(Zip.Entries.FirstOrDefault(e => e.FullName == "reviews.csv")), uid, _context, CT);
                    foreach (var e in Zip.Entries.Where(ze => ze.FullName.StartsWith("lists/")))
                    {
                        var (Header, Entries) = await ParseListCsv(e);
                        await ParseLetterboxdList(Header, Entries, uid, _context, CT);
                    }

                    await _context.ImportJobs
                        .Where(ij => PendingJobs.Contains(ij.UserId))
                        .ExecuteUpdateAsync(s => s.SetProperty(
                            ij => ij.Status,
                            ij => ImportJobStatus.Completed
                        ));

                    await _context.Users
                        .Where(u => u.Id == uid)
                        .ExecuteUpdateAsync(s => s.SetProperty(
                            u => u.FromLetterboxd,
                            u => true
                        ));
                }
                catch
                {
                    await _context.ImportJobs
                        .Where(ij => PendingJobs.Contains(ij.UserId))
                        .ExecuteUpdateAsync(s => s.SetProperty(
                            ij => ij.Status,
                            ij => ImportJobStatus.Failed
                        ));
                }
            }
        }

        private async Task ParseLetterboxdProfile(Dictionary<string, List<string>>? Profile, Guid UserId, HeteroboxdContext _context, CancellationToken CT)
        {
            if (Profile == null) return;
            var User = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == UserId);
            if (User == null) return;

            Console.WriteLine($"{UserId}: Parsing Letterboxd Profile...");

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

            Console.WriteLine($"{UserId}: Parsing {Watchlist["Date"].Count} Watchlist Entries...");

            var Lookup = new Dictionary<(string Name, int Year), (string Date, int FilmId)>();
            for (int i = 0; i < Watchlist["Date"].Count; i++)
            {
                var Year = int.TryParse(Watchlist["Year"][i], out int Temp) ? Temp : 0;
                var FilmId = await FuzzyMatchFilm(Watchlist["Name"][i], Year, _context, CT);
                Lookup[(Watchlist["Name"][i], Year)] = (Watchlist["Date"][i], FilmId ?? 0);
            }

            var WatchlistEntries = new List<WatchlistEntry>();
            Lookup.Values.Where(l => l.FilmId != 0).DistinctBy(l => l.FilmId).ToList().ForEach(l =>
            {
                var Date = DateTime.UtcNow;
                try { Date = DateTime.SpecifyKind(DateTime.ParseExact(l.Date.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture), DateTimeKind.Utc); }
                catch { }
                WatchlistEntries.Add(new WatchlistEntry(Date, l.FilmId, UserId));
            });

            if (WatchlistEntries.Count == 0) return;

            await _context.BulkInsertOrUpdateAsync(WatchlistEntries, new BulkConfig
            {
                SetOutputIdentity = false,
                UpdateByProperties = [nameof(WatchlistEntry.FilmId), nameof(WatchlistEntry.UserId)],
                PropertiesToExcludeOnUpdate = [nameof(WatchlistEntry.Id), nameof(WatchlistEntry.Date)]
            });
        }
        
        private async Task ParseLetterboxdWatched(Dictionary<string, List<string>>? Watched, Guid UserId, HeteroboxdContext _context, CancellationToken CT)
        {
            if (Watched == null) return;

            Console.WriteLine($"{UserId}: Parsing {Watched["Date"].Count} Watched Films...");

            var Lookup = new Dictionary<(string Name, int Year), (string Date, int TimesWatched, int FilmId)>();
            for (int i = 0; i < Watched["Date"].Count; i++)
            {
                var Year = int.TryParse(Watched["Year"][i], out int Temp) ? Temp : 0;
                var FilmId = await FuzzyMatchFilm(Watched["Name"][i], Year, _context, CT);

                if (!Lookup.TryAdd((Watched["Name"][i], Year), (Watched["Date"][i], 1, FilmId ?? 0)))
                {
                    Lookup[(Watched["Name"][i], Year)] = (Watched["Date"][i], Lookup[(Watched["Name"][i], Year)].TimesWatched + 1, FilmId ?? 0);
                }
            }
            
            var UserWatchedFilms = new List<UserWatchedFilm>();
            var UserWatchedFilmIds = new List<int>();
            Lookup.Values.Where(tlv => tlv.FilmId != 0).DistinctBy(tlv => tlv.FilmId).ToList().ForEach(tlv =>
            {
                var Date = DateTime.UtcNow;
                try { Date = DateTime.SpecifyKind(DateTime.ParseExact(tlv.Date.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture), DateTimeKind.Utc); }
                catch { }
                UserWatchedFilms.Add(new UserWatchedFilm(UserId, tlv.FilmId, Date, tlv.TimesWatched));
                UserWatchedFilmIds.Add(tlv.FilmId);
            });

            if (UserWatchedFilms.Count == 0) return;

            await _context.BulkInsertOrUpdateAsync(UserWatchedFilms, new BulkConfig
            {
                SetOutputIdentity = false,
                UpdateByProperties = [nameof(UserWatchedFilm.FilmId), nameof(UserWatchedFilm.UserId)],
                PropertiesToExcludeOnUpdate = [nameof(UserWatchedFilm.Id)]
            });

            foreach (var nuwf in UserWatchedFilms)
            {
                await _context.Films
                .Where(f => nuwf.FilmId == f.Id)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(f => f.WatchCount, f => f.WatchCount + nuwf.TimesWatched)
                );
            }
        }

        private async Task ParseLetterboxdRatingsAndReviews(Dictionary<string, List<string>>? Ratings, Dictionary<string, List<string>>? Reviews, Guid UserId, HeteroboxdContext _context, CancellationToken CT)
        {
            if (Ratings == null && Reviews == null) return;

            Console.WriteLine($"{UserId}: Parsing {Ratings?["Date"].Count ?? 0 + Reviews?["Date"].Count ?? 0} Ratings and Reviews...");

            var Lookup = new Dictionary<(string Name, int Year), (string Date, double Rating, string? Text, int FilmId)>();
            for (int i = 0; i < (Ratings?["Date"].Count ?? 0); i++)
            {
                var Year = int.TryParse(Ratings!["Year"][i], out int Temp) ? Temp : 0;
                var FilmId = await FuzzyMatchFilm(Ratings!["Name"][i], Year, _context, CT);
                Lookup[(Ratings!["Name"][i], Year)] = (Ratings!["Date"][i], double.TryParse(Ratings!["Rating"][i], out double Rating) ? Rating : 0.0, null, FilmId ?? 0);
            }

            for (int i = 0; i < (Reviews?["Date"].Count ?? 0); i++)
            {
                try
                {
                    string Date = Reviews!["Date"][i];
                    string Name = Reviews!["Name"][i];
                    int Year = int.Parse(Reviews!["Year"][i]);
                    double Rating = double.Parse(Reviews!["Rating"][i]);
                    string Text = Reviews!["Review"][i].Trim();

                    if (!Lookup.TryGetValue((Name, Year), out var Existing))
                    {
                        var FilmId = await FuzzyMatchFilm(Name, Year, _context, CT);
                        Lookup[(Name, Year)] = (Date, Rating, Text, FilmId ?? 0);
                    }
                    else
                    {
                        Lookup[(Name, Year)] = (Date, Rating, Text, Existing.FilmId);
                    }
                }
                catch
                {
                    continue;
                }
            }

            var UserReviews = new List<Review>();
            var UserReviewIds = new List<int>();
            Lookup.Values.Where(tlv => tlv.FilmId != 0).DistinctBy(tlv => tlv.FilmId).ToList().ForEach(tlv =>
            {
                var Date = DateTime.UtcNow;
                try { Date = DateTime.SpecifyKind(DateTime.ParseExact(tlv.Date.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture), DateTimeKind.Utc); }
                catch { }
                UserReviews.Add(new Review(tlv.Rating, tlv.Text, Date, UserId, tlv.FilmId));
                UserReviewIds.Add(tlv.FilmId);
            });

            if (UserReviews.Count == 0) return;

            await _context.BulkInsertOrUpdateAsync(UserReviews, new BulkConfig
            {
                SetOutputIdentity = false,
                UpdateByProperties = [nameof(Review.FilmId), nameof(Review.AuthorId)],
                PropertiesToExcludeOnUpdate = [nameof(Review.Id), nameof(Review.LikeCount), nameof(Review.CommentCount), nameof(Review.NotificationsOn), nameof(Review.Spoiler)]
            });

            foreach (var ur in UserReviews)
            {
                await _context.Films
                    .Where(f => ur.FilmId == f.Id)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(f => f.AverageRating, f => ((f.AverageRating * f.RatingCount) + ur.Rating) / (f.RatingCount + 1))
                        .SetProperty(f => f.RatingCount, f => f.RatingCount + 1)
                    );
            }
        }

        private async Task ParseLetterboxdList(Dictionary<string, string>? Header, Dictionary<string, List<string>>? Entries, Guid UserId, HeteroboxdContext _context, CancellationToken CT)
        {
            if (Header == null || Entries == null) return;

            Console.WriteLine($"{UserId}: Parsing List {Header["Name"]} with {Entries["Position"].Count} Entries...");

            DateTime Date = DateTime.UtcNow;
            try { Date = DateTime.SpecifyKind(DateTime.ParseExact(Header["Date"], "yyyy-MM-dd", CultureInfo.InvariantCulture), DateTimeKind.Utc); }
            catch { }

            var UserList = new UserList(Header["Name"], string.IsNullOrEmpty(Header["Description"].Trim()) ? null : Header["Description"].Trim(), Date, 0, UserId);
            
            _context.UserLists.Add(UserList);
            await _context.SaveChangesAsync(CT);

            var Lookup = new Dictionary<(string Name, int Year), (int Position, int FilmId)>();
            for (int i = 0; i < Entries["Position"].Count; i++)
            {
                var Year = int.TryParse(Entries["Year"][i], out int Temp) ? Temp : 0;
                var FilmId = await FuzzyMatchFilm(Entries["Name"][i], Year, _context, CT);

                Lookup[(Entries["Name"][i], Year)] = (FilmId == null ? -1 : i + 1, FilmId ?? 0);
            }

            var ListEntries = new List<ListEntry>();
            Lookup.Values.Where(l => l.FilmId != 0).DistinctBy(l => l.FilmId).ToList().ForEach(l =>
            {
                ListEntries.Add(new ListEntry(l.Position, l.FilmId, UserList.Id));
            });

            _context.ListEntries.AddRange(ListEntries);
            UserList.Size = ListEntries.Count;
            _context.UserLists.Update(UserList);
            await _context.SaveChangesAsync(CT);
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

        private async Task<(Dictionary<string, string>? Header, Dictionary<string, List<string>>? Entries)> ParseListCsv(ZipArchiveEntry? ZippedCsv)
        {
            if (ZippedCsv == null) return (null, null);

            var Config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true,
                MissingFieldFound = null,
                BadDataFound = null
            };

            var HeaderRecords = new Dictionary<string, string>();
            var EntryRecords = new Dictionary<string, List<string>>();

            using var Csv = new CsvReader(new StreamReader(ZippedCsv.Open()), Config);

            await Csv.ReadAsync(); await Csv.ReadAsync(); Csv.ReadHeader();
            if (Csv.HeaderRecord == null) return (null, null);

            await Csv.ReadAsync();
            foreach (var Header in Csv.HeaderRecord) HeaderRecords[Header] = Csv.GetField(Header) ?? "";

            await Csv.ReadAsync(); Csv.ReadHeader();
            if (Csv.HeaderRecord == null) return (HeaderRecords, null);

            Csv.HeaderRecord.ToList().ForEach(h => EntryRecords[h] = new List<string>());

            while (await Csv.ReadAsync())
            {
                foreach (var Header in Csv.HeaderRecord) EntryRecords[Header].Add(Csv.GetField(Header) ?? "");
            }

            return (HeaderRecords, EntryRecords);
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
    }
}