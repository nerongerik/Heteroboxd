using Heteroboxd.Import.Background;
using Heteroboxd.Shared.Data;
using Heteroboxd.Shared.Integrations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

var config = new ConfigurationBuilder()
    .SetBasePath(AppContext.BaseDirectory)
    .AddJsonFile("appsettings.json", optional: true)
    .AddEnvironmentVariables()
    .Build();

var services = new ServiceCollection();

services.AddSingleton<IConfiguration>(config);
services.AddDbContext<HeteroboxdContext>(options =>
    options.UseNpgsql(config.GetConnectionString("DefaultConnection"), o =>
        o.EnableRetryOnFailure(5, TimeSpan.FromSeconds(15), null)));
services.AddScoped<IR2Handler, R2Handler>();

var _provider = services.BuildServiceProvider();
var _executor = new ImportExecutor();
var _cts = new CancellationTokenSource(TimeSpan.FromHours(3));
var _ct = _cts.Token;

Console.WriteLine($"=== Import service started at {DateTime.UtcNow} UTC ===");

try
{
    Console.WriteLine("READING QUEUE...");
    bool Proceed = await _executor.ExecuteReadQueue(_provider, _ct);

    if (!Proceed)
    {
        Console.WriteLine("No jobs in queue.");
    }
    else
    {
        Console.WriteLine("EXECUTING PENDING IMPORTS...");
        await _executor.ExecutePendingImports(_provider, _ct);
    }

    Console.WriteLine($"=== Import job finished at {DateTime.UtcNow} UTC ===");
    Environment.Exit(0);
}
catch (Exception ex)
{
    Console.WriteLine($"Import job failed: {ex.Message}");
    Environment.Exit(1);
}
