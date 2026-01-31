using Heteroboxd.Data;
using Heteroboxd.Integrations;
using Heteroboxd.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Background
{
    public class UserPurgeService : BackgroundService
    {
        private readonly ILogger<UserPurgeService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly TimeSpan _scheduledTime = new TimeSpan(15, 0, 0);

        public UserPurgeService(ILogger<UserPurgeService> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken CancellationToken)
        {
            _logger.LogInformation("User Purging Service started.");
            while (!CancellationToken.IsCancellationRequested)
            {
                TimeSpan Delay = CalculateDelay();
                _logger.LogInformation($"Next run scheduled in {Delay.TotalHours:F2} hours.");

                await Task.Delay(Delay, CancellationToken);

                if (!CancellationToken.IsCancellationRequested) await ExecuteUserPurge(CancellationToken);
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

        private async Task ExecuteUserPurge(CancellationToken CancellationToken)
        {
            try
            {
                _logger.LogInformation($"Starting daily tasks at {DateTime.UtcNow}.");

                using (var _scope = _scopeFactory.CreateScope())
                {
                    UserManager<User> _manager = _scope.ServiceProvider.GetRequiredService<UserManager<User>>();
                    IR2Handler _r2Handler = _scope.ServiceProvider.GetRequiredService<IR2Handler>();

                    var CutoffDate = DateTime.UtcNow.AddHours(-24);

                    var UnverifiedUsers = await _manager.Users
                        .Where(u => !u.EmailConfirmed && u.DateJoined < CutoffDate)
                        .ToListAsync(CancellationToken);

                    foreach (var u in UnverifiedUsers)
                    {
                        await _r2Handler.DeleteByUser(u.Id);
                        await _manager.DeleteAsync(u);
                    }

                    _logger.LogInformation("User purge completed successfully.");
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error occurred while executing user purge.");
            }
        }
    }
}
