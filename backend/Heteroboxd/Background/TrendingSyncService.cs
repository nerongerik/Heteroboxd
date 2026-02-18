using Heteroboxd.Data;
using Heteroboxd.Integrations;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Background
{
    public class TrendingSyncService : BackgroundService
    {
        private readonly ILogger<TrendingSyncService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly TimeSpan _scheduledTime = new TimeSpan(14, 00, 0);

        public TrendingSyncService(ILogger<TrendingSyncService> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken CancellationToken)
        {
            _logger.LogInformation("Trending Syncing Service started.");
            while (!CancellationToken.IsCancellationRequested)
            {
                TimeSpan Delay = CalculateDelay();
                _logger.LogInformation($"Next run scheduled in {Delay.TotalHours:F2} hours.");

                await Task.Delay(Delay, CancellationToken);

                if (!CancellationToken.IsCancellationRequested) await ExecuteTrendingSync(CancellationToken);
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

        private async Task ExecuteTrendingSync(CancellationToken CancellationToken)
        {
            try
            {
                _logger.LogInformation($"Starting daily tasks at {DateTime.UtcNow}.");

                using (var _scope = _scopeFactory.CreateScope())
                {
                    HeteroboxdContext _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();
                    ITMDBClient _client = _scope.ServiceProvider.GetRequiredService<ITMDBClient>();
                    ITMDBSerializer _parser = _scope.ServiceProvider.GetRequiredService<ITMDBSerializer>();

                    await _context.Trendings.ExecuteDeleteAsync(CancellationToken);

                    var Response = await _client.TrendingFilmsCall();
                    int Rank = 1;
                    foreach (var tf in Response!.results!.OrderByDescending(r => r.popularity).Select(r => r.id))
                    {
                        var Existing = await _context.Films.FirstOrDefaultAsync(f => f.Id == tf);
                        if (Existing == null)
                        {
                            var Details = await _client.FilmDetailsCall(tf);

                            var NewCastIds = Details.credits?.cast?.Select(c => c.id!.Value).ToList() ?? new();
                            var NewCrewIds = Details.credits?.crew?.Select(c => c.id!.Value).ToList() ?? new();
                            var AllNewIds = NewCastIds.Concat(NewCrewIds).Distinct().ToHashSet();

                            var ExistingCelebs = await _context.Celebrities.Where(c => AllNewIds.Contains(c.Id)).ToListAsync(CancellationToken);
                            var (Film, Celebrities, Credits) = await _parser.ParseResponseInMemory(Details, ExistingCelebs);

                            _context.Films.Add(Film);
                            _context.Celebrities.AddRange(Celebrities);
                            await _context.SaveChangesAsync();
                            _context.CelebrityCredits.AddRange(Credits);
                            _context.Trendings.Add(new Trending(Film, Rank));
                        }
                        else
                        {
                            _context.Trendings.Add(new Trending(Existing, Rank));
                        }
                        await _context.SaveChangesAsync(CancellationToken);

                        Rank++;
                        if (Rank == 11) break;
                    }

                    _logger.LogInformation("Trending sync completed successfully.");
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error occurred while executing trending sync.");
            }
        }
    }
}
