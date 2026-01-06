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
            maxRetryDelay: TimeSpan.FromSeconds(10),
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
        policy.RequireClaim("tier", "Admin"));
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
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

// --- SERVICES ---
builder.Services.AddScoped<IFilmService, FilmService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<ICelebrityService, CelebrityService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IUserListService, UserListService>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddScoped<ITMDBSerializer, TMDBSerializer>();
builder.Services.AddScoped<ITMDBLoader, TMDBLoader>();
builder.Services.AddHttpClient<ITMDBClient, TMDBClient>(client =>
{
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config["TMDB:AccessToken"]}");
});

builder.Services.AddTransient<IEmailSender, EmailSender>();

builder.Services.AddHostedService<RefreshPurgeService>();
builder.Services.AddHostedService<NotificationPurgeService>();

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

/*
using var Scope = app.Services.CreateScope();
var TmdbClient = Scope.ServiceProvider.GetRequiredService<ITMDBClient>();
var TmdbService = Scope.ServiceProvider.GetRequiredService<ITMDBSerializer>();

var FilePath = "C:/Code/Heteroboxd/ids.txt";

if (File.Exists(FilePath))
{
    Console.WriteLine("=== DOWNLOAD STARTED ===");

    foreach (var Line in File.ReadLines(FilePath))
    {
        if (!int.TryParse(Line, out int TmdbId)) continue;

        Console.WriteLine($"Importing film {TmdbId}...");

        try
        {
            var Response = await TmdbClient.FilmDetailsCall(TmdbId);
            await TmdbService.ParseResponse(Response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"FAILED {TmdbId}: {ex.Message}");
        }
    }

    Console.WriteLine("=== DOWNLOAD FINISHED ===");
    return;
}
*/
/*
using var Scope = app.Services.CreateScope();
var Loader = Scope.ServiceProvider.GetRequiredService<ITMDBLoader>();

Console.WriteLine("=== IMPORT STARTED ===");

try
{
    // Step size determines how many JSON files per batch
    int Step = 50;

    Console.WriteLine("Loading Films...");
    Loader.LoadFilms(Step);
    Console.WriteLine("Films loaded.");

    Console.WriteLine("Loading Celebrities...");
    Loader.LoadCelebs(Step);
    Console.WriteLine("Celebrities loaded.");

    Console.WriteLine("Loading Credits...");
    Loader.LoadCredits(Step);
    Console.WriteLine("Credits loaded.");
}
catch (Exception ex)
{
    Console.WriteLine($"IMPORT FAILED: {ex.Message}");
}

Console.WriteLine("=== IMPORT FINISHED ===");
return;
*/

app.Run();