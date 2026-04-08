using EFCore.BulkExtensions;
using Heteroboxd.Shared.Data;
using Heteroboxd.Shared.Integrations;
using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Models.DTO;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Collections.Concurrent;

namespace Heteroboxd.Maintenance.Background
{
    public interface IMaintanenceExecutor
    {
        /*Task ExecuteCountryUpdate(IServiceProvider _provider, CancellationToken CT);*/
        Task ExecuteRefreshPurge(IServiceProvider _provider, CancellationToken CT);
        Task ExecuteUserPurge(IServiceProvider _provider, CancellationToken CT);
        Task ExecuteNotificationPurge(IServiceProvider _provider, CancellationToken CT);
        Task ExecuteCountrySync(IServiceProvider _provider, CancellationToken CT);
        Task ExecuteTrendingSync(IServiceProvider _provider, CancellationToken CT);
        Task ExecuteCelebritySync(IServiceProvider _provider, CancellationToken CT);
        Task ExecuteFilmSync(IServiceProvider _provider, CancellationToken CT);
    }

    public class MaintanenceExecutor : IMaintanenceExecutor
    {
        /*public async Task ExecuteCountryUpdate(IServiceProvider _provider, CancellationToken CT)
        {
            using var _scope = _provider.CreateScope();
            var _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();

            var Stale = new HashSet<string>()
            {
                "XK", "AN", "BU", "CS", "SU", "TP", "XC", "XG", "XI", "YU", "ZR"
            };

            var ToBeUpdated = await _context.Films
                .AsNoTracking()
                .Where(f => f.Country.Any(c => Stale.Contains(c)))
                .ToListAsync(CT);

            foreach (var Film in ToBeUpdated)
            {
                var NewCodes = new List<string>();
                foreach (var Country in Film.Country)
                {
                    var NewCode = "";
                    switch (Country)
                    {
                        case null:
                            NewCode = "XX";
                            break;
                        case "XK":
                        case "YU":
                        case "CS":
                            NewCode = "RS";
                            break;
                        case "AN":
                            NewCode = "NL";
                            break;
                        case "BU":
                            NewCode = "MM";
                            break;
                        case "SU":
                            NewCode = "RU";
                            break;
                        case "TP":
                            NewCode = "TL";
                            break;
                        case "XC":
                            NewCode = "CZ";
                            break;
                        case "XG":
                            NewCode = "DE";
                            break;
                        case "XI":
                            NewCode = "IE";
                            break;
                        case "ZR":
                            NewCode = "CD";
                            break;
                        default:
                            NewCode = Country;
                            break;
                    }
                    if (!NewCodes.Contains(NewCode)) NewCodes.Add(NewCode);
                }
                Film.Country = NewCodes;
            }
            await _context.BulkUpdateAsync(ToBeUpdated, new BulkConfig
            {
                UpdateByProperties = [nameof(Film.Id)],
                PropertiesToIncludeOnUpdate = [nameof(Film.Country)]
            });
        }*/

        public async Task ExecuteRefreshPurge(IServiceProvider _provider, CancellationToken CT)
        {
            using var _scope = _provider.CreateScope();
            var _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();

            await _context.RefreshTokens
                .Where(r => r.Used || r.Revoked || r.Expires < DateTime.UtcNow)
                .ExecuteDeleteAsync(CT);
        }

        public async Task ExecuteUserPurge(IServiceProvider _provider, CancellationToken CT)
        {
            using var scope = _provider.CreateScope();
            var _manager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
            var _r2 = scope.ServiceProvider.GetRequiredService<IR2Handler>();

            var Cutoff = DateTime.UtcNow.AddHours(-24);

            var UnverifiedIds = await _manager.Users
                .Where(u => !u.EmailConfirmed && u.Date < Cutoff)
                .Select(u => u.Id)
                .ToListAsync(CT);

            if (UnverifiedIds.Count == 0) return;

            await _manager.Users
                .Where(u => UnverifiedIds.Contains(u.Id))
                .ExecuteDeleteAsync(CT);

            foreach (var id in UnverifiedIds) await _r2.DeleteByUser(id);
        }

        public async Task ExecuteNotificationPurge(IServiceProvider _provider, CancellationToken CT)
        {
            using var _scope = _provider.CreateScope();
            var _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();

            await _context.Notifications
                .Where(n => n.Date.AddDays(30) < DateTime.UtcNow)
                .ExecuteDeleteAsync(CT);
        }

        public async Task ExecuteCountrySync(IServiceProvider _provider, CancellationToken CT)
        {
            using var _scope = _provider.CreateScope();
            var _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();
            var _client = _scope.ServiceProvider.GetRequiredService<ITMDBClient>();

            var DontInclude = new HashSet<string>()
            {
                "XK", "AN", "BU", "CS", "SU", "TP", "XC", "XG", "XI", "YU", "ZR"
            };

            var Response = await _client.CountryConfigurationCall();
            var Countries = Response
                .Select(r => new Country(r.english_name!, r.iso_3166_1!))
                .Where(c => !DontInclude.Contains(c.Code));

            await _context.Countries.ExecuteDeleteAsync(CT);
            await _context.Countries.AddRangeAsync(Countries, CT);
            await _context.SaveChangesAsync(CT);
        }

        public async Task ExecuteTrendingSync(IServiceProvider _provider, CancellationToken CT)
        {
            using var _scope = _provider.CreateScope();
            var _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();
            var _client = _scope.ServiceProvider.GetRequiredService<ITMDBClient>();
            var _parser = _scope.ServiceProvider.GetRequiredService<ITMDBParser>();

            var Response = await _client.TrendingFilmsCall();
            var TrendingIds = Response?.results?
                .OrderByDescending(r => r.popularity)
                .Select(r => r.id)
                .Take(10)
                .ToList() ?? new();

            if (TrendingIds.Count == 0) return;

            var ExistingFilms = await _context.Films
                .Where(f => TrendingIds.Contains(f.Id))
                .ToListAsync(CT);

            var ExistingFilmIds = ExistingFilms.Select(f => f.Id).ToHashSet();
            var MissingIds = TrendingIds.Where(id => !ExistingFilmIds.Contains(id!.Value)).ToList();

            var FetchedDetails = new List<(int Id, TMDBInfoResponse Details)>();
            foreach (var id in MissingIds)
            {
                var Details = await _client.FilmDetailsCall(id!.Value);
                if (Details != null) FetchedDetails.Add((id!.Value, Details));
            }

            if (FetchedDetails.Count > 0)
            {
                var AllCelebIds = FetchedDetails
                    .SelectMany(fd => (fd.Details.credits?.cast?.Select(c => c.id!.Value) ?? []).Concat(fd.Details.credits?.crew?.Select(c => c.id!.Value) ?? []))
                    .Distinct();

                var ExistingCelebIds = await _context.Celebrities
                    .Where(c => AllCelebIds.Contains(c.Id))
                    .Select(c => c.Id)
                    .ToListAsync(CT);

                var ThreadsafeCelebs = new ConcurrentDictionary<int, byte>(ExistingCelebIds.Select(id => new KeyValuePair<int, byte>(id, 0)));

                foreach (var (id, details) in FetchedDetails)
                {
                    try
                    {
                        var (Film, Celebrities, Credits) = await _parser.ParseResponse(details, ThreadsafeCelebs);

                        _context.Films.Add(Film);
                        await _context.SaveChangesAsync(CT);

                        if (Celebrities.Count != 0)
                            await _context.BulkInsertOrUpdateAsync(Celebrities, new BulkConfig
                            {
                                SetOutputIdentity = false,
                                UpdateByProperties = [nameof(Celebrity.Id)],
                                PropertiesToExcludeOnUpdate = [nameof(Celebrity.Name), nameof(Celebrity.Description), nameof(Celebrity.HeadshotUrl)]
                            });

                        if (Credits.Count != 0)
                            await _context.BulkInsertOrUpdateAsync(Credits, new BulkConfig
                            {
                                SetOutputIdentity = false,
                                UpdateByProperties = [nameof(CelebrityCredit.Id)]
                            });

                        ExistingFilms.Add(Film);
                    }
                    catch { continue; }
                }
            }

            await _context.Trendings.ExecuteDeleteAsync(CT);

            int Rank = 1;
            foreach (var id in TrendingIds)
            {
                var Film = ExistingFilms.FirstOrDefault(f => f.Id == id);
                if (Film == null) continue;
                _context.Trendings.Add(new Trending(Film, Rank++));
            }

            await _context.SaveChangesAsync(CT);
        }

        public async Task ExecuteCelebritySync(IServiceProvider _provider, CancellationToken CT)
        {
            using var _scope = _provider.CreateScope();
            var _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();
            var _client = _scope.ServiceProvider.GetRequiredService<ITMDBClient>();
            var _parser = _scope.ServiceProvider.GetRequiredService<ITMDBParser>();

            int Page = 1;
            var DeletedCelebs = new List<int>();
            var UpdatedCelebs = new List<int>();

            while (true)
            {
                var Response = await _client.ChangesListCall("person", Page);
                if (Response.results == null || Response.results.Count == 0) break;
                DeletedCelebs.AddRange(Response.results.Where(co => co.adult == null).Select(co => co.id));
                UpdatedCelebs.AddRange(Response.results.Where(co => co.adult == false).Select(co => co.id));
                if (Page >= Response.total_pages) break;
                Page++;
            }

            UpdatedCelebs = UpdatedCelebs.Distinct().ToList();

            await _context.Celebrities
                .Where(c => DeletedCelebs.Contains(c.Id))
                .ExecuteDeleteAsync(CT);

            var ParsedCelebrities = new ConcurrentBag<Celebrity>();

            await Parallel.ForEachAsync(UpdatedCelebs, new ParallelOptions { MaxDegreeOfParallelism = 20, CancellationToken = CT }, async (uc, _) =>
            {
                try
                {
                    TMDBCelebrityResponse? Details = null;
                    for (int Attempt = 1; Attempt <= 3; Attempt++)
                    {
                        try
                        {
                            Details = await _client.CelebrityDetailsCall(uc);
                            break;
                        }
                        catch
                        {
                            if (Attempt == 3) throw;
                            await Task.Delay(1000 * Attempt, CT);
                        }
                    }
                    if (Details == null) return;

                    var Celeb = _parser.ParseCelebrity(Details);
                    ParsedCelebrities.Add(Celeb);
                }
                catch { }
            });

            if (ParsedCelebrities.IsEmpty) return;

            var PCL = ParsedCelebrities.ToList();

            //flush in batches of 100
            for (int i = 0; i < PCL.Count; i += 100)
            {
                var Batch = PCL.Skip(i).Take(100);
                await _context.BulkInsertOrUpdateAsync(Batch, new BulkConfig
                {
                    SetOutputIdentity = false,
                    UpdateByProperties = [nameof(Celebrity.Id)]
                });
            }
        }

        public async Task ExecuteFilmSync(IServiceProvider _provider, CancellationToken CT)
        {
            using var _scope = _provider.CreateScope();
            var _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();
            var _client = _scope.ServiceProvider.GetRequiredService<ITMDBClient>();
            var _parser = _scope.ServiceProvider.GetRequiredService<ITMDBParser>();

            int Page = 1;
            var DeletedFilms = new List<int>();
            var UpdatedFilms = new List<int>();

            while (true)
            {
                var Response = await _client.ChangesListCall("movie", Page);
                if (Response.results == null || Response.results.Count == 0) break;
                DeletedFilms.AddRange(Response.results.Where(co => co.adult == null).Select(co => co.id));
                UpdatedFilms.AddRange(Response.results.Where(co => co.adult == false).Select(co => co.id));
                if (Page >= Response.total_pages) break;
                Page++;
            }

            await _context.Films
                .Where(f => DeletedFilms.Contains(f.Id))
                .ExecuteDeleteAsync(CT);

            var FilmDetails = new ConcurrentBag<(int id, TMDBInfoResponse Details)>();
            await Parallel.ForEachAsync(UpdatedFilms, new ParallelOptions { MaxDegreeOfParallelism = 20, CancellationToken = CT }, async (uf, _) =>
            {
                var Details = await _client.FilmDetailsCall(uf);
                if (Details != null) FilmDetails.Add((uf, Details));
            });

            if (FilmDetails.IsEmpty) return;

            var FilmDetailsList = FilmDetails.ToList();

            var AllCelebIds = FilmDetailsList
                .SelectMany(fd => (fd.Details.credits?.cast?.Select(c => c.id!.Value) ?? []).Concat(fd.Details.credits?.crew?.Select(c => c.id!.Value) ?? []))
                .Distinct();

            var ExistingCelebIds = await _context.Celebrities
                .Where(c => AllCelebIds.Contains(c.Id))
                .Select(c => c.Id)
                .ToListAsync(CT);

            var ThreadsafeCelebs = new ConcurrentDictionary<int, byte>(ExistingCelebIds.Select(id => new KeyValuePair<int, byte>(id, 0)));

            var ExistingFilms = await _context.Films
                .Where(f => UpdatedFilms.Contains(f.Id))
                .ToListAsync(CT);

            foreach (var (uf, details) in FilmDetailsList)
            {
                try
                {
                    var (Film, Celebrities, Credits) = await _parser.ParseResponse(details, ThreadsafeCelebs);

                    var Existing = ExistingFilms.FirstOrDefault(ef => ef.Id == uf);
                    if (Existing == null)
                    {
                        _context.Films.Add(Film);
                    }
                    else
                    {
                        Existing.UpdateFields(Film);
                        _context.Films.Update(Existing);
                        await _context.CelebrityCredits
                            .Where(cc => cc.FilmId == Existing.Id)
                            .ExecuteDeleteAsync(CT);
                    }

                    await _context.SaveChangesAsync(CT);

                    if (Celebrities.Count != 0)
                        await _context.BulkInsertOrUpdateAsync(Celebrities, new BulkConfig
                        {
                            SetOutputIdentity = false,
                            UpdateByProperties = [nameof(Celebrity.Id)],
                            PropertiesToExcludeOnUpdate = [nameof(Celebrity.Name), nameof(Celebrity.Description), nameof(Celebrity.HeadshotUrl)]
                        });

                    if (Credits.Count != 0)
                        await _context.BulkInsertOrUpdateAsync(Credits, new BulkConfig
                        {
                            SetOutputIdentity = false,
                            UpdateByProperties = [nameof(CelebrityCredit.Id)]
                        });
                }
                catch { continue; }
            }
        }
    }
}