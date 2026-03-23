namespace Heteroboxd.Background
{
    public class MaintanenceScheduler : BackgroundService
    {
        private readonly ILogger<MaintanenceScheduler> _logger;
        private readonly TimeSpan _scheduledTime = new TimeSpan(15, 0, 0);
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IMaintanenceExecutor _executor;

        public MaintanenceScheduler(ILogger<MaintanenceScheduler> logger, IServiceScopeFactory serviceScopeFactory, IMaintanenceExecutor executor)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
            _executor = executor;
        }

        protected override async Task ExecuteAsync(CancellationToken CancellationToken)
        {
            _logger.LogInformation("Background services started.");
            while (!CancellationToken.IsCancellationRequested)
            {
                TimeSpan Delay = CalculateDelay();
                _logger.LogInformation($"Next run scheduled in {Delay.TotalHours:F2} hours.");

                await Task.Delay(Delay, CancellationToken);

                if (!CancellationToken.IsCancellationRequested)
                {
                    _logger.LogInformation($"Starting daily tasks at {DateTime.UtcNow}.");
                    _logger.LogInformation("REMOVING INVALID REFRESH TOKENS...");
                    await _executor.ExecuteRefreshPurge(_serviceScopeFactory, CancellationToken);
                    _logger.LogInformation("REMOVING UNVERIFIED USERS...");
                    await _executor.ExecuteUserPurge(_serviceScopeFactory, CancellationToken);
                    _logger.LogInformation("REMOVING OLD NOTIFICATIONS...");
                    await _executor.ExecuteNotificationPurge(_serviceScopeFactory, CancellationToken);
                    if (DateTime.UtcNow.Date.Day == 1)
                    {
                        _logger.LogInformation("SYNCING COUNTRIES FROM TMDB...");
                        await _executor.ExecuteCountrySync(_serviceScopeFactory, CancellationToken);
                    }
                    _logger.LogInformation("SYNCING TRENDING FILMS FROM TMDB...");
                    await _executor.ExecuteTrendingSync(_serviceScopeFactory, CancellationToken);
                    _logger.LogInformation("SYNCING CELEBRITY CHANGES FROM TMDB...");
                    await _executor.ExecuteCelebritySync(_serviceScopeFactory, CancellationToken);
                    _logger.LogInformation("SYNCING FILM CHANGES FROM TMDB...");
                    await _executor.ExecuteFilmSync(_serviceScopeFactory, CancellationToken);
                    _logger.LogInformation($"Daily tasks finished at {DateTime.UtcNow}.");
                }
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
    }
}
