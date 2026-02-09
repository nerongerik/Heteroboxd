using Heteroboxd.Data;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Background
{
    public class ListPurgeService : BackgroundService
    {
        private readonly ILogger<ListPurgeService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly TimeSpan _scheduledTime = new TimeSpan(15, 0, 0);

        public ListPurgeService(ILogger<ListPurgeService> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken CancellationToken)
        {
            _logger.LogInformation("List Purging Service started.");
            while (!CancellationToken.IsCancellationRequested)
            {
                TimeSpan Delay = CalculateDelay();
                _logger.LogInformation($"Next run scheduled in {Delay.TotalHours:F2} hours.");

                await Task.Delay(Delay, CancellationToken);

                if (!CancellationToken.IsCancellationRequested) await ExecuteListPurge(CancellationToken);
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

        private async Task ExecuteListPurge(CancellationToken CancellationToken)
        {
            try
            {
                _logger.LogInformation($"Starting daily tasks at {DateTime.UtcNow}.");

                using (var _scope = _scopeFactory.CreateScope())
                {
                    HeteroboxdContext _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();

                    await _context.ListEntries
                        .Where(le => !_context.Films.Any(f => f.Id == le.FilmId))
                        .ExecuteDeleteAsync(CancellationToken);

                    await _context.UserLists
                        .Where(ul => !_context.ListEntries.Any(le => le.UserListId == ul.Id))
                        .ExecuteDeleteAsync(CancellationToken);

                    _logger.LogInformation("List purge completed successfully.");
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error occurred while executing list purge.");
            }
        }
    }
}