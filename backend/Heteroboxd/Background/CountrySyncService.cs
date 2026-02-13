using Heteroboxd.Data;
using Heteroboxd.Integrations;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Background
{
    public class CountrySyncService : BackgroundService
    {
        private readonly ILogger<CountrySyncService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly TimeSpan _scheduledTime = new TimeSpan(15, 0, 0);

        public CountrySyncService(ILogger<CountrySyncService> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken CancellationToken)
        {
            _logger.LogInformation("Country Sync Service started.");
            while (!CancellationToken.IsCancellationRequested)
            {
                TimeSpan Delay = CalculateDelay();
                _logger.LogInformation($"Next run scheduled in {Delay.TotalHours:F2} hours.");

                await Task.Delay(Delay, CancellationToken);

                if (!CancellationToken.IsCancellationRequested) await ExecuteCountrySync(CancellationToken);
            }
        }

        private TimeSpan CalculateDelay()
        {
            DateTime Now = DateTime.UtcNow;
            DateTime NextRun = Now.Date + _scheduledTime;

            if (Now > NextRun)
            {
                NextRun = NextRun.AddDays(30);
            }

            return NextRun - Now;
        }

        private async Task ExecuteCountrySync(CancellationToken CancellationToken)
        {
            try
            {
                _logger.LogInformation($"Starting monthly tasks at {DateTime.UtcNow}.");

                using (var _scope = _scopeFactory.CreateScope())
                {
                    HeteroboxdContext _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();
                    ITMDBClient _client = _scope.ServiceProvider.GetRequiredService<TMDBClient>();

                    List<TMDBCountryResponse> Response = await _client.CountryConfigurationCall();
                    List<Country> Countries = Response.Select(r => new Country(r.english_name!, r.iso_3166_1!)).ToList();
                    await _context.Countries.ExecuteDeleteAsync(CancellationToken);
                    await _context.Countries.AddRangeAsync(Countries, CancellationToken);
                    await _context.SaveChangesAsync(CancellationToken);

                    _logger.LogInformation("Country sync completed successfully.");
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error occurred while executing country sync.");
            }
        }
    }
}
