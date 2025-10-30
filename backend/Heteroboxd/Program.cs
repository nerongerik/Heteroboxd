using Heteroboxd.Data;
using Heteroboxd.Models;
using Heteroboxd.Repository;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// --- DATABASE CONTEXT ---
builder.Services.AddDbContext<HeteroboxdContext>(options =>
    options.UseNpgsql(config.GetConnectionString("DefaultConnection")));

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
var key = Encoding.UTF8.GetBytes(config["Jwt:Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // set to true in production
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
        policy.RequireClaim("tier", "Admin", "Owner"));
});

// --- CORS ---
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
    });
}
else
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", p => p
            .WithOrigins(config["Frontend:BaseUrl"]!)
            .AllowAnyHeader()
            .AllowAnyMethod());
    });
}

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
builder.Services.AddTransient<IEmailSender, EmailSender>();

// --- CONTROLLERS ---
builder.Services.AddControllers();

var app = builder.Build();

// --- MIDDLEWARE PIPELINE ---
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseCors(builder.Environment.IsDevelopment() ? "AllowAll" : "AllowFrontend");
app.MapControllers();

app.Run();