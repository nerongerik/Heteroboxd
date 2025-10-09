using Heteroboxd.Data;
using Heteroboxd.Service;
using Heteroboxd.Repository;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

//add services here if needed
builder.Services.AddDbContext<HeteroboxdContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

//repos
builder.Services.AddScoped<IFilmRepository, FilmRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

//services
builder.Services.AddScoped<IFilmService, FilmService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IUserService, UserService>();

//controllers
builder.Services.AddControllers();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();
    db.Database.Migrate();
}

//configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage(); //optional for dev
}

app.UseHttpsRedirection();

//map controllers
app.MapControllers();

//run the application
app.Run();

/*
DON'T FORGET TO GET NOTIFICATIONS DONE
*/
