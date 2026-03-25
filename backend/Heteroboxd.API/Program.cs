using Heteroboxd.Shared.Data;
using Heteroboxd.Shared.Integrations;
using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Repository;
using Heteroboxd.API.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using EFCore.BulkExtensions;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Concurrent;
//using FirebaseAdmin;
//using Google.Apis.Auth.OAuth2;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";

builder.Services.AddHealthChecks();

//database config
builder.Services.AddDbContext<HeteroboxdContext>(options =>
    options.UseNpgsql(config.GetConnectionString("DefaultConnection"), npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(15),
            errorCodesToAdd: null
        );
    })
);

//identity config
builder.Services.AddIdentity<User, IdentityRole<Guid>>(options =>
{
    options.User.RequireUniqueEmail = true;
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = true;
    options.SignIn.RequireConfirmedEmail = true;
})
.AddEntityFrameworkStores<HeteroboxdContext>()
.AddDefaultTokenProviders();

//jwt config
var key = Convert.FromBase64String(config["Jwt:Key"]!);
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidIssuer = config["Jwt:Issuer"],
        ValidAudience = config["Jwt:Audience"],
        ClockSkew = TimeSpan.Zero
    };
});

//auth config
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdminTier", policy => policy.RequireClaim("admin_session", "true"));
});

//cors config
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", p => p
    .WithOrigins(config["Frontend:BaseUrl"]!)
    .AllowAnyHeader()
    .AllowCredentials()
    .AllowAnyMethod());
});

//repo config
builder.Services.AddScoped<IFilmRepository, FilmRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<ICelebrityRepository, CelebrityRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IUserListRepository, UserListRepository>();
builder.Services.AddScoped<IAuthRepository, AuthRepository>();

//service config
builder.Services.AddScoped<IFilmService, FilmService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<ICelebrityService, CelebrityService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IUserListService, UserListService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITMDBParser, TMDBParser>();
builder.Services.AddHttpClient<ITMDBClient, TMDBClient>(client =>
{
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config["TMDB:AccessToken"]}");
});
builder.Services.AddScoped<IR2Handler, R2Handler>();
builder.Services.AddTransient<IEmailSender, EmailSender>();

//controller config
builder.Services.AddControllers();

/*
//realtime notif config
FirebaseApp.Create(new AppOptions()
{
    Credential = GoogleCredential.FromFile("heteroboxd-firebase-adminsdk-fbsvc-25e265c424.json")
});
*/

var app = builder.Build();

app.UseHealthChecks("/health");

app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run($"http://0.0.0.0:{port}");

//one-time bulk import from tMDB
using var Scope = app.Services.CreateScope();
var _client = Scope.ServiceProvider.GetRequiredService<ITMDBClient>();
var FilePath = "C:/Code/Heteroboxd/ids.txt";

if (File.Exists(FilePath))
{
    var Processed = await Scope.ServiceProvider.GetRequiredService<HeteroboxdContext>()
        .Films.AsNoTracking().Select(f => f.Id).ToHashSetAsync();
    var Lines = File.ReadLines(FilePath).Where(l => !Processed.Contains(int.Parse(l.Trim()))).ToList();

    int Total = Lines.Count + Processed.Count;
    int Counter = Processed.Count;

    var ExistingCelebs = await Scope.ServiceProvider.GetRequiredService<HeteroboxdContext>()
        .Celebrities.AsNoTracking().Select(c => c.Id).ToListAsync();
    var ThreadsafeCelebs = new ConcurrentDictionary<int, byte>(ExistingCelebs.Select(id => new KeyValuePair<int, byte>(id, 0)));

    Console.WriteLine("=== IMPORT STARTED ===");

    await Parallel.ForEachAsync(Lines, new ParallelOptions { MaxDegreeOfParallelism = 20 }, async (l, _) =>
    {
        if (!int.TryParse(l.Trim(), out int TmdbId)) return;

        int Current = Interlocked.Increment(ref Counter);
        Console.WriteLine($"\n== PROCESSING FILM {Current}/{Total} (TMDB: {TmdbId}) ==\n");

        try
        {
            var Response = await _client.FilmDetailsCall(TmdbId);
            if (Response == null) return;

            using var _scope = app.Services.CreateScope();
            var _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();
            var _parser = _scope.ServiceProvider.GetRequiredService<ITMDBParser>();

            var (Film, Celebrities, Credits) = await _parser.ParseResponse(Response, ThreadsafeCelebs);

            _context.Films.Add(Film);
            await _context.SaveChangesAsync();
            if (Celebrities.Count != 0)
            {
                await _context.BulkInsertOrUpdateAsync(Celebrities, new BulkConfig
                {
                    SetOutputIdentity = false,
                    UpdateByProperties = new List<string> { nameof(Celebrity.Id) },
                    PropertiesToExcludeOnUpdate = new List<string>
                    {
                        nameof(Celebrity.Name),
                        nameof(Celebrity.Description),
                        nameof(Celebrity.HeadshotUrl)
                    }
                });
            }
            if (Credits.Count != 0)
            {
                await _context.BulkInsertOrUpdateAsync(Credits, new BulkConfig
                {
                    SetOutputIdentity = false,
                    UpdateByProperties = new List<string> { nameof(CelebrityCredit.Id) }
                });
            }

            Console.WriteLine($"SUCCESS: [{Current}/{Total}] Film {TmdbId} saved.");
        }
        catch (Exception e) 
        { 
            Console.WriteLine($"FAIL: [{Current}/{Total}] Error on {TmdbId}: {e.Message}");
        }
    });

    Console.WriteLine("=== IMPORT FINISHED ===");
    return;
}