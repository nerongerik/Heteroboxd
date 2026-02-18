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
        private readonly TimeSpan _scheduledTime = new TimeSpan(14, 30, 0);

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
                    ITMDBSerializer _parser = _scope.ServiceProvider.GetRequiredService<ITMDBSerializer>();

                    //fetch changes
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
                    //process changes
                    List<int> DeletedCelebs = new List<int>();
                    List<int> UpdatedCelebs = new List<int>();
                    foreach (var r in Responses)
                    {
                        DeletedCelebs.AddRange(r.results.Where(co => co.adult == null).Select(co => co.id));
                        UpdatedCelebs.AddRange(r.results.Where(co => co.adult == false).Select(co => co.id));
                    }
                    //delete celebrities
                    await _context.Celebrities
                        .Where(c => DeletedCelebs.Contains(c.Id))
                        .ExecuteDeleteAsync(CancellationToken);
                    //update celebrities
                    var ExistingCelebs = await _context.Celebrities
                        .Where(f => UpdatedCelebs.Contains(f.Id))
                        .ToListAsync(CancellationToken);

                    int Counter = 0;
                    int Total = UpdatedCelebs.Count;
                    foreach (int uc in UpdatedCelebs)
                    {
                        _logger.LogInformation($"\n== PROCESSING CELEBRITY {Counter}/{Total} ==\n");
                        try
                        {
                            var Details = await _client.CelebrityDetailsCall(uc);

                            Celebrity Celebrity = _parser.ParseCelebrity(Details);

                            Celebrity? Existing = ExistingCelebs.FirstOrDefault(ec => ec.Id == uc);
                            if (Existing == null) //create new celebrity
                            {
                                _context.Celebrities.Add(Celebrity);
                            }
                            else //update existing celebrity
                            {
                                Existing.UpdateFields(Celebrity);
                                _context.Celebrities.Update(Existing);
                            }
                            await _context.SaveChangesAsync();
                        }
                        catch (Exception e)
                        {
                            _logger.LogError(e, $"Error processing celebrity with TMDB ID {uc}.");
                            continue; //silent fail
                        }
                        finally
                        {
                            Counter++;
                        }
                    }

                    _logger.LogInformation("Celebrity sync completed successfully.");
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error occurred while executing celebrity sync.");
            }
        }
    }
}
