using Heteroboxd.Shared.Data;
using Heteroboxd.Shared.Integrations;
using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Repository;
using Heteroboxd.API.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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
builder.Services.AddScoped<IImportJobRepository, ImportJobRepository>();

//service config
builder.Services.AddScoped<IFilmService, FilmService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<ICelebrityService, CelebrityService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IUserListService, UserListService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IImportJobService, ImportJobService>();
builder.Services.AddScoped<ITMDBParser, TMDBParser>();

builder.Services.AddHttpClient<ITMDBClient, TMDBClient>(client =>
{
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config["TMDB:AccessToken"]}");
});
builder.Services.AddScoped<IR2Handler, R2Handler>();

builder.Services.AddHttpClient("Brevo", client =>
{
    client.BaseAddress = new Uri("https://api.brevo.com/");
    client.Timeout = TimeSpan.FromSeconds(15);
});
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