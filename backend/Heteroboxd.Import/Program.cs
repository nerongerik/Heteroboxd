using Heteroboxd.Import.Background;
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

services.AddScoped<IR2Handler, R2Handler>();
services.AddScoped<HttpClient>();

var _provider = services.BuildServiceProvider();
var _logger = _provider.GetRequiredService<ILogger<ImportExecutor>>();
var _executor = new ImportExecutor();
var _cts = new CancellationTokenSource(TimeSpan.FromHours(3));
var _ct = _cts.Token;

_logger.LogInformation("=== Import service started at {Time} UTC ===", DateTime.UtcNow);

try
{
    _logger.LogInformation("READING QUEUE...");
    bool Proceed = await _executor.ExecuteReadQueue(_provider, _ct);

    if (!Proceed)
    {
        _logger.LogInformation("No jobs in queue.");
    }
    else
    {
        _logger.LogInformation("EXECUTING PENDING IMPORTS...");
        await _executor.ExecutePendingImports(_provider, _ct);
    }

    _logger.LogInformation("=== Import job finished at {Time} UTC ===", DateTime.UtcNow);
    Environment.Exit(0);
}
catch (Exception ex)
{
    _logger.LogError(ex, "Import job failed");
    Environment.Exit(1);
}
