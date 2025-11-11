using Heteroboxd.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

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
        public DbSet<UserList> UserLists { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Watchlist> Watchlists { get; set; }
        public DbSet<UserFavorites> UserFavorites { get; set; }
        public DbSet<UserWatchedFilm> UserWatchedFilms { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
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

                // LikedComments (M:M)
                entity.HasMany(u => u.LikedComments)
                      .WithMany()
                      .UsingEntity(j => j.ToTable("UserLikedComments"));

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
                entity.HasIndex(f => f.Slug).IsUnique();
                entity.HasIndex(f => f.TmdbId).IsUnique();

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
        }
    }
}
