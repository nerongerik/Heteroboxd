using EFCore.BulkExtensions;
using Heteroboxd.Data;
using Heteroboxd.Integrations;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Background
{
    public class FilmSyncService : BackgroundService
    {
        private readonly ILogger<FilmSyncService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly TimeSpan _scheduledTime = new TimeSpan(14, 30, 0);

        public FilmSyncService(ILogger<FilmSyncService> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken CancellationToken)
        {
            _logger.LogInformation("Film Syncing Service started.");
            while (!CancellationToken.IsCancellationRequested)
            {
                TimeSpan Delay = CalculateDelay();
                _logger.LogInformation($"Next run scheduled in {Delay.TotalHours:F2} hours.");

                await Task.Delay(Delay, CancellationToken);

                if (!CancellationToken.IsCancellationRequested) await ExecuteFilmSync(CancellationToken);
            }
        }

        private TimeSpan CalculateDelay()
        {
            DateTime Now = DateTime.UtcNow;
            DateTime NextRun = Now.Date + _scheduledTime;

            if (Now > NextRun)
            {
                NextRun = NextRun.AddDays(1);
            }

            return NextRun - Now;
        }

        private async Task ExecuteFilmSync(CancellationToken CancellationToken)
        {
            try
            {
                _logger.LogInformation($"Starting daily tasks at {DateTime.UtcNow}.");

                using (var _scope = _scopeFactory.CreateScope())
                {
                    HeteroboxdContext _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();
                    ITMDBClient _client = _scope.ServiceProvider.GetRequiredService<ITMDBClient>();
                    ITMDBParser _parser = _scope.ServiceProvider.GetRequiredService<ITMDBParser>();

                    //fetch changes
                    int Page = 1;
                    var Responses = new List<TMDBChangesResponse>();
                    while (true)
                    {
                        var Response = await _client.ChangesListCall("movie", Page);
                        if (Response.results == null || Response.results.Count == 0) break;
                        Responses.Add(Response);
                        if (Page >= Response.total_pages) break;
                        Page++;
                    }
                    //process changes
                    var DeletedFilms = new List<int>();
                    var UpdatedFilms = new List<int>();
                    foreach (var r in Responses)
                    {
                        DeletedFilms.AddRange(r.results.Where(co => co.adult == null).Select(co => co.id));
                        UpdatedFilms.AddRange(r.results.Where(co => co.adult == false).Select(co => co.id));
                    }
                    //delete films
                    await _context.Films
                        .Where(f => DeletedFilms.Contains(f.Id))
                        .ExecuteDeleteAsync(CancellationToken);
                    //update films
                    var ExistingFilms = await _context.Films
                        .Where(f => UpdatedFilms.Contains(f.Id))
                        .ToListAsync(CancellationToken);

                    int Counter = 0;
                    int Total = UpdatedFilms.Count;
                    foreach (int uf in UpdatedFilms)
                    {
                        _logger.LogInformation($"\n== PROCESSING FILM {Counter}/{Total} ==\n");
                        try
                        {
                            var Details = await _client.FilmDetailsCall(uf);
                            if (Details == null) continue;

                            var NewCastIds = Details.credits?.cast?.Select(c => c.id!.Value).ToList() ?? new();
                            var NewCrewIds = Details.credits?.crew?.Select(c => c.id!.Value).ToList() ?? new();
                            var AllNewIds = NewCastIds.Concat(NewCrewIds).Distinct().ToHashSet();

                            var ExistingCelebs = await _context.Celebrities.Where(c => AllNewIds.Contains(c.Id)).ToListAsync(CancellationToken);
                            var (Film, Celebrities, Credits) = await _parser.ParseResponse(Details, ExistingCelebs);

                            var Existing = ExistingFilms.FirstOrDefault(ef => ef.Id == uf);
                            if (Existing == null) //create new film and handle the associated celebrities, collections, etc.
                            {
                                _context.Films.Add(Film);
                                await _context.SaveChangesAsync(CancellationToken);
                                if (Celebrities.Any())
                                {
                                    await _context.BulkInsertOrUpdateAsync(Celebrities, new BulkConfig
                                    {
                                        SetOutputIdentity = false,
                                        UpdateByProperties = new List<string> { nameof(Celebrity.Id) },
                                        PropertiesToExcludeOnUpdate = new List<string>
                                        {
                                            nameof(Celebrity.Name),
                                            nameof(Celebrity.Description),
                                            nameof(Celebrity.HeadshotUrl)
                                        }
                                    });
                                }
                                if (Credits.Any())
                                {
                                    await _context.BulkInsertOrUpdateAsync(Credits, new BulkConfig
                                    {
                                        SetOutputIdentity = false,
                                        UpdateByProperties = new List<string> { nameof(CelebrityCredit.Id) }
                                    });
                                }
                            }
                            else //carefully update existing film
                            {
                                Existing.UpdateFields(Film);
                                _context.Films.Update(Existing);
                                await _context.SaveChangesAsync(CancellationToken);
                                await _context.CelebrityCredits.Where(cc => cc.FilmId == Existing.Id).ExecuteDeleteAsync(CancellationToken);
                                if (Celebrities.Any())
                                {
                                    await _context.BulkInsertOrUpdateAsync(Celebrities, new BulkConfig
                                    {
                                        SetOutputIdentity = false,
                                        UpdateByProperties = new List<string> { nameof(Celebrity.Id) },
                                        PropertiesToExcludeOnUpdate = new List<string>
                                        {
                                            nameof(Celebrity.Name),
                                            nameof(Celebrity.Description),
                                            nameof(Celebrity.HeadshotUrl)
                                        }
                                    });
                                }
                                if (Credits.Any())
                                {
                                    await _context.BulkInsertOrUpdateAsync(Credits, new BulkConfig
                                    {
                                        SetOutputIdentity = false,
                                        UpdateByProperties = new List<string> { nameof(CelebrityCredit.Id) }
                                    });
                                }
                            }
                        }
                        catch (Exception e)
                        {
                            _logger.LogError(e, $"Error processing film with TMDB ID {uf}.");
                            continue; //silent fail
                        }
                        finally
                        {
                            Counter++;
                        }
                    }

                    _logger.LogInformation("Film sync completed successfully.");
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error occurred while executing film sync.");
            }
        }
    }
}