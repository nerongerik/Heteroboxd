using Heteroboxd.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Text.Json;

namespace Heteroboxd.Data
{
    public class HeteroboxdContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
    {
        public HeteroboxdContext(DbContextOptions<HeteroboxdContext> options) : base(options) { }

        public DbSet<Film> Films { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Celebrity> Celebrities { get; set; }
        public DbSet<CelebrityCredit> CelebrityCredits { get; set; }
        public DbSet<ListEntry> ListEntries { get; set; }
        public DbSet<WatchlistEntry> WatchlistEntries { get; set; }
        public DbSet<UserList> UserLists { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Watchlist> Watchlists { get; set; }
        public DbSet<UserFavorites> UserFavorites { get; set; }
        public DbSet<UserWatchedFilm> UserWatchedFilms { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Trending> Trendings { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasPostgresExtension("pg_trgm");

            base.OnModelCreating(modelBuilder); //let Identity configure itself

            //map Identity tables to preferred names
            modelBuilder.Entity<User>(b =>
            {
                b.ToTable("Users");
                b.HasIndex(u => u.Email).IsUnique();
                b.Property(u => u.Gender).HasConversion<string>();
                b.Property(u => u.Tier).HasConversion<string>();
            });

            //rename Identity tables so they don't get AspNet* names
            modelBuilder.Entity<IdentityRole<Guid>>().ToTable("Roles");
            modelBuilder.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
            modelBuilder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
            modelBuilder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
            modelBuilder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");
            modelBuilder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");

            modelBuilder.Entity<User>(entity =>
            {
                // Watchlist (1:1)
                entity.HasOne(u => u.Watchlist)
                      .WithOne()
                      .HasForeignKey<Watchlist>(w => w.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Favorites (1:1)
                entity.HasOne(u => u.Favorites)
                      .WithOne()
                      .HasForeignKey<UserFavorites>(f => f.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Lists (1:M)
                entity.HasMany(u => u.Lists)
                      .WithOne()
                      .HasForeignKey(ul => ul.AuthorId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Followers/Following (M:M)
                entity.HasMany(u => u.Following)
                      .WithMany(u => u.Followers)
                      .UsingEntity(j => j.ToTable("UserRelationships"));

                // Blocked (M:M)
                entity.HasMany(u => u.Blocked)
                      .WithMany()
                      .UsingEntity(j => j.ToTable("UserBlocked"));

                // Notifications (1:M)
                entity.HasMany(u => u.Notifications)
                      .WithOne()
                      .HasForeignKey(n => n.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Reviews (1:M)
                entity.HasMany(u => u.Reviews)
                      .WithOne()
                      .HasForeignKey(r => r.AuthorId)
                      .OnDelete(DeleteBehavior.Cascade);

                // LikedReviews (M:M)
                entity.HasMany(u => u.LikedReviews)
                      .WithMany()
                      .UsingEntity(j => j.ToTable("UserLikedReviews"));

                // LikedLists (M:M)
                entity.HasMany(u => u.LikedLists)
                      .WithMany()
                      .UsingEntity(j => j.ToTable("UserLikedLists"));

                // WatchedFilms (1:M)
                entity.HasMany(u => u.WatchedFilms)
                      .WithOne()
                      .HasForeignKey(uwf => uwf.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Watchlist
            modelBuilder.Entity<Watchlist>(entity =>
            {
                entity.HasKey(w => w.Id);

                entity.HasMany(w => w.Films)
                      .WithOne()
                      .HasForeignKey(le => le.WatchlistId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // UserFavorites
            modelBuilder.Entity<UserFavorites>(entity =>
            {
                entity.HasKey(f => f.Id);

                modelBuilder.Entity<User>()
                    .HasOne(u => u.Favorites)
                    .WithOne()
                    .HasForeignKey<UserFavorites>(f => f.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Film
            modelBuilder.Entity<Film>(entity =>
            {
                entity.HasKey(f => f.Id);

                entity.HasMany(f => f.Reviews)
                      .WithOne()
                      .HasForeignKey(r => r.FilmId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(f => f.CastAndCrew)
                      .WithOne()
                      .HasForeignKey(cc => cc.FilmId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(f => f.WatchedBy)
                      .WithOne()
                      .HasForeignKey(uwf => uwf.FilmId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.Property(f => f.Collection)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<Dictionary<int, string>>(v, (JsonSerializerOptions)null)
                    )
                    .HasColumnType("jsonb")
                    .Metadata.SetValueComparer(
                        new ValueComparer<Dictionary<int, string>>(
                            (d1, d2) => JsonSerializer.Serialize(d1, (JsonSerializerOptions)null) ==
                                        JsonSerializer.Serialize(d2, (JsonSerializerOptions)null),
                            d => d == null ? 0 : JsonSerializer.Serialize(d, (JsonSerializerOptions)null).GetHashCode(),
                            d => d == null ? new Dictionary<int, string>()
                                : JsonSerializer.Deserialize<Dictionary<int, string>>(
                                        JsonSerializer.Serialize(d, (JsonSerializerOptions)null),
                                        (JsonSerializerOptions)null)
                        )
                    );

                entity.Property(f => f.Country)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions)null)
                    )
                    .HasColumnType("jsonb")
                    .Metadata.SetValueComparer(
                        new ValueComparer<Dictionary<string, string>>(
                            (d1, d2) => JsonSerializer.Serialize(d1, (JsonSerializerOptions)null) ==
                                        JsonSerializer.Serialize(d2, (JsonSerializerOptions)null),
                            d => d == null ? 0 : JsonSerializer.Serialize(d, (JsonSerializerOptions)null).GetHashCode(),
                            d => d == null ? new Dictionary<string, string>()
                                : JsonSerializer.Deserialize<Dictionary<string, string>>(
                                        JsonSerializer.Serialize(d, (JsonSerializerOptions)null),
                                        (JsonSerializerOptions)null)
                        )
                    );
            });

            // UserWatchedFilm
            modelBuilder.Entity<UserWatchedFilm>(entity =>
            {
                entity.HasKey(uwf => uwf.Id);
            });

            // Review
            modelBuilder.Entity<Review>(entity =>
            {
                entity.HasKey(r => r.Id);

                entity.HasMany(r => r.Comments)
                      .WithOne()
                      .HasForeignKey(c => c.ReviewId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Comment
            modelBuilder.Entity<Comment>(entity =>
            {
                entity.HasKey(c => c.Id);
            });

            // Celebrity
            modelBuilder.Entity<Celebrity>(entity =>
            {
                entity.HasKey(c => c.Id);

                entity.HasMany(c => c.Credits)
                      .WithOne()
                      .HasForeignKey(cc => cc.CelebrityId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // CelebrityCredit
            modelBuilder.Entity<CelebrityCredit>(entity =>
            {
                entity.HasKey(cc => cc.Id);
            });

            // ListEntry
            modelBuilder.Entity<ListEntry>(entity =>
            {
                entity.HasKey(le => le.Id);

                entity.HasOne<UserList>()
                      .WithMany(ul => ul.Films)
                      .HasForeignKey(le => le.UserListId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // WatchlistEntry
            modelBuilder.Entity<WatchlistEntry>(entity =>
            {
                entity.HasKey(le => le.Id);

                entity.HasOne<Watchlist>()
                      .WithMany(wl => wl.Films)
                      .HasForeignKey(wle => wle.WatchlistId)
                      .OnDelete(DeleteBehavior.Cascade);
            });


            // UserList
            modelBuilder.Entity<UserList>(entity =>
            {
                entity.HasKey(ul => ul.Id);

                entity.HasMany(ul => ul.Films)
                      .WithOne()
                      .HasForeignKey(le => le.UserListId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Notification
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(n => n.Id);
            });

            // RefreshToken
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(rt => rt.Id);
            });

            // Trending
            modelBuilder.Entity<Trending>(entity =>
            {
                entity.HasKey(t => t.FilmId);
            });
        }
    }
}
