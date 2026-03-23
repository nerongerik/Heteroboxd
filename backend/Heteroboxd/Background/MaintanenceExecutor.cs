using Amazon.S3.Model;
using EFCore.BulkExtensions;
using Heteroboxd.Data;
using Heteroboxd.Integrations;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace Heteroboxd.Background
{
    public interface IMaintanenceExecutor
    {
        Task ExecuteRefreshPurge(IServiceScopeFactory _scopeFactory, CancellationToken CancellationToken);
        Task ExecuteUserPurge(IServiceScopeFactory _scopeFactory, CancellationToken CancellationToken);
        Task ExecuteNotificationPurge(IServiceScopeFactory _scopeFactory, CancellationToken CancellationToken);
        Task ExecuteCountrySync(IServiceScopeFactory _scopeFactory, CancellationToken CancellationToken);
        Task ExecuteTrendingSync(IServiceScopeFactory _scopeFactory, CancellationToken CancellationToken);
        Task ExecuteCelebritySync(IServiceScopeFactory _scopeFactory, CancellationToken CancellationToken);
        Task ExecuteFilmSync(IServiceScopeFactory _scopeFactory, CancellationToken CancellationToken);
    }

    public class MaintanenceExecutor : IMaintanenceExecutor
    {
        public MaintanenceExecutor() {}

        public async Task ExecuteRefreshPurge(IServiceScopeFactory _scopeFactory, CancellationToken CancellationToken)
        {
            using (var _scope = _scopeFactory.CreateScope())
            {
                HeteroboxdContext _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();

                await _context.RefreshTokens
                    .Where(r => r.Used || r.Revoked || r.Expires < DateTime.UtcNow)
                    .ExecuteDeleteAsync(CancellationToken);
            }
        }

        public async Task ExecuteUserPurge(IServiceScopeFactory _scopeFactory, CancellationToken CancellationToken)
        {
            using (var _scope = _scopeFactory.CreateScope())
            {
                UserManager<User> _manager = _scope.ServiceProvider.GetRequiredService<UserManager<User>>();
                IR2Handler _r2Handler = _scope.ServiceProvider.GetRequiredService<IR2Handler>();

                var CutoffDate = DateTime.UtcNow.AddHours(-24);

                var UnverifiedIds = await _manager.Users
                    .Where(u => !u.EmailConfirmed && u.Date < CutoffDate)
                    .Select(u => u.Id)
                    .ToListAsync(CancellationToken);

                if (UnverifiedIds.Count != 0)
                {
                    await _manager.Users
                        .Where(u => UnverifiedIds.Contains(u.Id))
                        .ExecuteDeleteAsync(CancellationToken);

                    foreach (var id in UnverifiedIds)
                    {
                        await _r2Handler.DeleteByUser(id);
                    }
                }
            }
        }

        public async Task ExecuteNotificationPurge(IServiceScopeFactory _scopeFactory, CancellationToken CancellationToken)
        {
            using (var _scope = _scopeFactory.CreateScope())
            {
                HeteroboxdContext _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();

                await _context.Notifications
                    .Where(n => n.Date.AddDays(30) < DateTime.UtcNow)
                    .ExecuteDeleteAsync(CancellationToken);
            }
        }

        public async Task ExecuteCountrySync(IServiceScopeFactory _scopeFactory, CancellationToken CancellationToken)
        {
            using (var _scope = _scopeFactory.CreateScope())
            {
                HeteroboxdContext _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();
                ITMDBClient _client = _scope.ServiceProvider.GetRequiredService<ITMDBClient>();

                var Response = await _client.CountryConfigurationCall();
                var Countries = Response.Select(r => new Country(r.english_name!, r.iso_3166_1!)).Where(c => c.Code != "XK");
                await _context.Countries.ExecuteDeleteAsync(CancellationToken);
                await _context.Countries.AddRangeAsync(Countries, CancellationToken);
                await _context.SaveChangesAsync(CancellationToken);
            }
        }

        public async Task ExecuteTrendingSync(IServiceScopeFactory _scopeFactory, CancellationToken CancellationToken)
        {
            using (var _scope = _scopeFactory.CreateScope())
            {
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
                    .ToListAsync(CancellationToken);

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
                        .Distinct()
                        .ToHashSet();

                    var ExistingCelebIds = await _context.Celebrities
                        .Where(c => AllCelebIds.Contains(c.Id))
                        .Select(c => c.Id)
                        .ToListAsync(CancellationToken);

                    var ThreadsafeCelebs = new ConcurrentDictionary<int, byte>(ExistingCelebIds.Select(id => new KeyValuePair<int, byte>(id, 0)));

                    foreach (var (id, Details) in FetchedDetails)
                    {
                        try
                        {
                            var (Film, Celebrities, Credits) = await _parser.ParseResponse(Details, ThreadsafeCelebs);

                            _context.Films.Add(Film);
                            await _context.SaveChangesAsync(CancellationToken);

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
                        catch
                        {
                            continue;
                        }
                    }
                }

                await _context.Trendings.ExecuteDeleteAsync(CancellationToken);

                int Rank = 1;
                foreach (int id in TrendingIds)
                {
                    var Film = ExistingFilms.FirstOrDefault(f => f.Id == id);
                    if (Film == null) continue;
                    _context.Trendings.Add(new Trending(Film, Rank++));
                }

                await _context.SaveChangesAsync(CancellationToken);
            }
        }

        public async Task ExecuteCelebritySync(IServiceScopeFactory _scopeFactory, CancellationToken CancellationToken)
        {
            using (var _scope = _scopeFactory.CreateScope())
            {
                HeteroboxdContext _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();
                ITMDBClient _client = _scope.ServiceProvider.GetRequiredService<ITMDBClient>();
                ITMDBParser _parser = _scope.ServiceProvider.GetRequiredService<ITMDBParser>();

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
                    .ExecuteDeleteAsync(CancellationToken);

                var ParsedCelebrities = new List<Celebrity>();
                foreach (int uc in UpdatedCelebs)
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
                                await Task.Delay(1000 * Attempt, CancellationToken);
                            }
                        }
                        if (Details == null) continue;
                        ParsedCelebrities.Add(_parser.ParseCelebrity(Details));
                    }
                    catch
                    {
                        continue;
                    }

                    if (ParsedCelebrities.Count >= 100)
                    {
                        await _context.BulkInsertOrUpdateAsync(ParsedCelebrities, new BulkConfig
                        {
                            SetOutputIdentity = false,
                            UpdateByProperties = new List<string> { nameof(Celebrity.Id) }
                        });
                        ParsedCelebrities.Clear();
                    }
                }

                if (ParsedCelebrities.Count != 0)
                {
                    await _context.BulkInsertOrUpdateAsync(ParsedCelebrities, new BulkConfig
                    {
                        SetOutputIdentity = false,
                        UpdateByProperties = new List<string> { nameof(Celebrity.Id) }
                    });
                }
            }
        }

        public async Task ExecuteFilmSync(IServiceScopeFactory _scopeFactory, CancellationToken CancellationToken)
        {
            using (var _scope = _scopeFactory.CreateScope())
            {
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
                    .ExecuteDeleteAsync(CancellationToken);

                var FilmDetails = new List<(int Id, TMDBInfoResponse Details)>();
                foreach (int uf in UpdatedFilms)
                {
                    var Details = await _client.FilmDetailsCall(uf);
                    if (Details != null) FilmDetails.Add((uf, Details));
                }

                var AllCelebIds = FilmDetails
                    .SelectMany(fd => (fd.Details.credits?.cast?.Select(c => c.id!.Value) ?? []).Concat(fd.Details.credits?.crew?.Select(c => c.id!.Value) ?? []))
                    .Distinct()
                    .ToHashSet();

                var ExistingCelebIds = await _context.Celebrities
                    .Where(c => AllCelebIds.Contains(c.Id))
                    .Select(c => c.Id)
                    .ToListAsync(CancellationToken);

                var ThreadsafeCelebs = new ConcurrentDictionary<int, byte>(ExistingCelebIds.Select(id => new KeyValuePair<int, byte>(id, 0)));

                var ExistingFilms = await _context.Films
                    .Where(f => UpdatedFilms.Contains(f.Id))
                    .ToListAsync(CancellationToken);

                foreach (var (uf, Details) in FilmDetails)
                {
                    try
                    {
                        var (Film, Celebrities, Credits) = await _parser.ParseResponse(Details, ThreadsafeCelebs);

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
                                .ExecuteDeleteAsync(CancellationToken);
                        }

                        await _context.SaveChangesAsync(CancellationToken);

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
                    catch
                    {
                        continue;
                    }
                }
            }
        }
    }
}
