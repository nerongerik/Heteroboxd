using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Background
{
    public class FlagPurgeService : BackgroundService
    {

        private readonly int Treshold = 25000;

        private readonly ILogger<FlagPurgeService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly TimeSpan _scheduledTime = new TimeSpan(15, 0, 0);

        public FlagPurgeService(ILogger<FlagPurgeService> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken CancellationToken)
        {
            _logger.LogInformation("Flag Purging Service started.");
            while (!CancellationToken.IsCancellationRequested)
            {
                TimeSpan Delay = CalculateDelay();
                _logger.LogInformation($"Next run scheduled in {Delay.TotalHours:F2} hours.");

                await Task.Delay(Delay, CancellationToken);

                if (!CancellationToken.IsCancellationRequested) await ExecuteFlagPurge(CancellationToken);
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

        private async Task ExecuteFlagPurge(CancellationToken CancellationToken)
        {
            try
            {
                _logger.LogInformation($"Starting daily tasks at {DateTime.UtcNow}.");

                using (var _scope = _scopeFactory.CreateScope())
                {
                    HeteroboxdContext _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();

                    List<Review> FlaggedReviews = await _context.Reviews
                        .Where(r => r.Flags >= Treshold)
                        .ToListAsync(CancellationToken);

                    List<Comment> FlaggedComments = await _context.Comments
                        .Where(c => c.Flags >= Treshold / 10)
                        .ToListAsync(CancellationToken);

                    List<User> FlaggedUsers = await _context.Users
                        .Where(u => u.Flags >= Treshold / 100)
                        .ToListAsync(CancellationToken);

                    _context.Reviews.RemoveRange(FlaggedReviews);
                    _context.Comments.RemoveRange(FlaggedComments);
                    _context.Users.RemoveRange(FlaggedUsers);
                    await _context.SaveChangesAsync(CancellationToken);

                    _logger.LogInformation("Flag purge completed successfully.");
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error occurred while executing flag purge.");
            }
        }
    }
}
