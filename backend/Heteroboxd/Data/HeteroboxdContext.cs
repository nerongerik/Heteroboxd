using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Data
{
    public class HeteroboxdContext : DbContext
    {
        public HeteroboxdContext(DbContextOptions<HeteroboxdContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
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
        public DbSet<Report> Reports { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Tier).HasConversion<string>();

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

                // Followers (M:M)
                entity.HasMany(u => u.Followers)
                      .WithMany()
                      .UsingEntity(j => j.ToTable("UserFollowers"));

                // Following (M:M)
                entity.HasMany(u => u.Following)
                      .WithMany()
                      .UsingEntity(j => j.ToTable("UserFollowing"));

                // Blocked users (M:M)
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

                // Comments (1:M)
                entity.HasMany(u => u.Comments)
                      .WithOne()
                      .HasForeignKey(c => c.AuthorId)
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

            // Report
            modelBuilder.Entity<Report>(entity =>
            {
                entity.HasKey(r => r.Id);
                entity.Property(r => r.Reason).HasConversion<string>();
            });
        }
    }
}
