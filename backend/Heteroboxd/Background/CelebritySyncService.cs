using EFCore.BulkExtensions;
using Heteroboxd.Data;
using Heteroboxd.Integrations;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Background
{
    public class CelebritySyncService : BackgroundService
    {
        private readonly ILogger<CelebritySyncService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly TimeSpan _scheduledTime = new TimeSpan(13, 15, 0);
        private const int BatchSize = 100;

        public CelebritySyncService(ILogger<CelebritySyncService> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken CancellationToken)
        {
            _logger.LogInformation("Celebrity Syncing Service started.");
            while (!CancellationToken.IsCancellationRequested)
            {
                TimeSpan Delay = CalculateDelay();
                _logger.LogInformation($"Next run scheduled in {Delay.TotalHours:F2} hours.");

                await Task.Delay(Delay, CancellationToken);

                if (!CancellationToken.IsCancellationRequested) await ExecuteCelebritySync(CancellationToken);
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

        private async Task ExecuteCelebritySync(CancellationToken CancellationToken)
        {
            try
            {
                _logger.LogInformation($"Starting daily tasks at {DateTime.UtcNow}.");

                using (var _scope = _scopeFactory.CreateScope())
                {
                    HeteroboxdContext _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();
                    ITMDBClient _client = _scope.ServiceProvider.GetRequiredService<ITMDBClient>();
                    ITMDBParser _parser = _scope.ServiceProvider.GetRequiredService<ITMDBParser>();

                    int Page = 1;
                    List<TMDBChangesResponse> Responses = new List<TMDBChangesResponse>();
                    while (true)
                    {
                        TMDBChangesResponse Response = await _client.ChangesListCall("person", Page);
                        if (Response.results == null || Response.results.Count == 0) break;
                        Responses.Add(Response);
                        if (Page >= Response.total_pages) break;
                        Page++;
                    }

                    var DeletedCelebs = new List<int>();
                    var UpdatedCelebs = new List<int>();
                    foreach (var r in Responses)
                    {
                        DeletedCelebs.AddRange(r.results.Where(co => co.adult == null).Select(co => co.id));
                        UpdatedCelebs.AddRange(r.results.Where(co => co.adult == false).Select(co => co.id));
                    }
                    UpdatedCelebs = UpdatedCelebs.Distinct().ToList();

                    await _context.Celebrities
                        .Where(c => DeletedCelebs.Contains(c.Id))
                        .ExecuteDeleteAsync(CancellationToken);

                    // fetch and parse all updated celebrities first, accumulating into a list
                    int Counter = 0;
                    int Total = UpdatedCelebs.Count;
                    var ParsedCelebrities = new List<Celebrity>();

                    foreach (int uc in UpdatedCelebs)
                    {
                        Counter++;
                        _logger.LogInformation($"\n== PROCESSING CELEBRITY {Counter}/{Total} ==\n");
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
                        catch (Exception e)
                        {
                            _logger.LogError(e, $"Error processing celebrity with TMDB ID {uc}.");
                            continue; //faily silently
                        }

                        if (ParsedCelebrities.Count >= BatchSize)
                        {
                            await BulkUpsertCelebritiesAsync(_context, ParsedCelebrities);
                            ParsedCelebrities.Clear();
                        }
                    }

                    if (ParsedCelebrities.Any())
                    {
                        await BulkUpsertCelebritiesAsync(_context, ParsedCelebrities);
                    }

                    _logger.LogInformation("Celebrity sync completed successfully.");
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error occurred while executing celebrity sync.");
            }
        }

        private static async Task BulkUpsertCelebritiesAsync(HeteroboxdContext _context, List<Celebrity> Celebrities)
        {
            await _context.BulkInsertOrUpdateAsync(Celebrities, new BulkConfig
            {
                SetOutputIdentity = false,
                UpdateByProperties = new List<string> { nameof(Celebrity.Id) }
            });
        }
    }
}