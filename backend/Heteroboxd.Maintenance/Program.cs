using Heteroboxd.Maintenance.Background;
using Heteroboxd.Shared.Data;
using Heteroboxd.Shared.Integrations;
using Heteroboxd.Shared.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

var config = new ConfigurationBuilder()
    .SetBasePath(AppContext.BaseDirectory)
    .AddJsonFile("appsettings.json", optional: true)
    .AddEnvironmentVariables()
    .Build();

var services = new ServiceCollection();

services.AddLogging(b => b.AddConsole());
services.AddSingleton<IConfiguration>(config);

services.AddDbContext<HeteroboxdContext>(options =>
    options.UseNpgsql(config.GetConnectionString("DefaultConnection"), o =>
        o.EnableRetryOnFailure(5, TimeSpan.FromSeconds(15), null)));

services.AddIdentity<User, IdentityRole<Guid>>(options =>
{
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = true;
})
.AddEntityFrameworkStores<HeteroboxdContext>()
.AddDefaultTokenProviders();

services.AddHttpClient<ITMDBClient, TMDBClient>(client =>
{
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config["TMDB:AccessToken"]}");
});

services.AddScoped<ITMDBParser, TMDBParser>();
services.AddScoped<IR2Handler, R2Handler>();

var _provider = services.BuildServiceProvider();
var _logger = _provider.GetRequiredService<ILogger<MaintanenceExecutor>>();
var _executor = new MaintanenceExecutor();
var _cts = new CancellationTokenSource(TimeSpan.FromHours(3));
var _ct = _cts.Token;

_logger.LogInformation("=== Maintenance job started at {Time} UTC ===", DateTime.UtcNow);

try
{
    /*_logger.LogInformation("UPDATING STALE COUNTRIES...");
    await _executor.ExecuteCountryUpdate(_provider, _ct);*/

    _logger.LogInformation("REMOVING INVALID REFRESH TOKENS...");
    await _executor.ExecuteRefreshPurge(_provider, _ct);

    _logger.LogInformation("REMOVING UNVERIFIED USERS...");
    await _executor.ExecuteUserPurge(_provider, _ct);

    _logger.LogInformation("REMOVING OLD NOTIFICATIONS...");
    await _executor.ExecuteNotificationPurge(_provider, _ct);

    if (DateTime.UtcNow.Day == 1)
    {
        _logger.LogInformation("SYNCING COUNTRIES FROM TMDB...");
        await _executor.ExecuteCountrySync(_provider, _ct);
    }

    _logger.LogInformation("SYNCING TRENDING FILMS FROM TMDB...");
    await _executor.ExecuteTrendingSync(_provider, _ct);

    _logger.LogInformation("SYNCING CELEBRITY CHANGES FROM TMDB...");
    await _executor.ExecuteCelebritySync(_provider, _ct);

    _logger.LogInformation("SYNCING FILM CHANGES FROM TMDB...");
    await _executor.ExecuteFilmSync(_provider, _ct);

    _logger.LogInformation("=== Maintenance job finished at {Time} UTC ===", DateTime.UtcNow);
    Environment.Exit(0);
}
catch (Exception ex)
{
    _logger.LogError(ex, "Maintenance job failed");
    Environment.Exit(1);
}
