using Heteroboxd.Background;
using Heteroboxd.Data;
using Heteroboxd.Integrations;
using Heteroboxd.Models;
using Heteroboxd.Repository;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using EFCore.BulkExtensions;
using Microsoft.IdentityModel.Tokens;
//using FirebaseAdmin;
//using Google.Apis.Auth.OAuth2;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// --- DATABASE CONTEXT ---
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

// --- IDENTITY CONFIGURATION ---
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

// --- JWT AUTHENTICATION ---
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

// --- AUTHORIZATION ---
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdminTier", policy =>
        policy.RequireClaim("admin_session", "true"));
});

// --- CORS ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", p => p
    .WithOrigins(config["Frontend:BaseUrl"]!)
    .AllowAnyHeader()
    .AllowCredentials()
    .AllowAnyMethod());
});

// --- REPOSITORIES ---
builder.Services.AddScoped<IFilmRepository, FilmRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<ICelebrityRepository, CelebrityRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IUserListRepository, UserListRepository>();
builder.Services.AddScoped<IAuthRepository, AuthRepository>();

// --- SERVICES ---
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

builder.Services.AddHostedService<TrendingSyncService>();
builder.Services.AddHostedService<RefreshPurgeService>();
builder.Services.AddHostedService<NotificationPurgeService>();
builder.Services.AddHostedService<UserPurgeService>();
builder.Services.AddHostedService<FilmSyncService>();
builder.Services.AddHostedService<CelebritySyncService>();
builder.Services.AddHostedService<CountrySyncService>();

// --- CONTROLLERS ---
builder.Services.AddControllers();

/*
// --- REAL-TIME NOTIFICATIONS SERVICE (Firebase) ---
FirebaseApp.Create(new AppOptions()
{
    Credential = GoogleCredential.FromFile("heteroboxd-firebase-adminsdk-fbsvc-25e265c424.json")
});
*/

var app = builder.Build();

// --- MIDDLEWARE PIPELINE ---
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

/*//database population script - comment out in prod

using var Scope = app.Services.CreateScope();
var _client = Scope.ServiceProvider.GetRequiredService<ITMDBClient>();
var FilePath = "D:/Code/Heteroboxd/ids.txt";

if (File.Exists(FilePath))
{
    Console.WriteLine("=== IMPORT STARTED ===");

    var Lines = File.ReadLines(FilePath).ToList();
    int Total = Lines.Count;
    int Counter = 0;

    await Parallel.ForEachAsync(Lines, new ParallelOptions { MaxDegreeOfParallelism = 20 }, async (l, _) =>
    {
        if (!int.TryParse(l.Trim(), out int TmdbId)) return;

        int Current = Interlocked.Increment(ref Counter);
        Console.WriteLine($"\n== PROCESSING FILM {Current}/{Total} (TMDB: {TmdbId}) ==\n");

        try
        {
            var Response = await _client.FilmDetailsCall(TmdbId);
            if (Response == null) return;

            var AllNewIds = (Response.credits?.cast?.Select(c => c.id!.Value) ?? []).Concat(Response.credits?.crew?.Select(c => c.id!.Value) ?? []).Distinct().ToHashSet();

            using var _scope = app.Services.CreateScope();
            var _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();
            var _parser = _scope.ServiceProvider.GetRequiredService<ITMDBParser>();

            var ExistingCelebs = await _context.Celebrities.Where(c => AllNewIds.Contains(c.Id)).ToListAsync();

            var (Film, Celebrities, Credits) = await _parser.ParseResponse(Response, ExistingCelebs, true);

            _context.Films.Add(Film);
            await _context.SaveChangesAsync();
            if (Celebrities.Any())
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
            if (Credits.Any())
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
}*/

app.Run();