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
                      .WithOne(w => w.User)
                      .HasForeignKey<Watchlist>(w => w.Id)
                      .OnDelete(DeleteBehavior.Cascade);

                // Favorites (1:1)
                entity.HasOne(u => u.Favorites)
                      .WithOne(f => f.User)
                      .HasForeignKey<UserFavorites>(f => f.Id)
                      .OnDelete(DeleteBehavior.Cascade);

                // Lists (1:M)
                entity.HasMany(u => u.Lists)
                      .WithOne(l => l.Author)
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
                      .WithOne(n => n.User)
                      .OnDelete(DeleteBehavior.Cascade);

                // Reviews (1:M)
                entity.HasMany(u => u.Reviews)
                      .WithOne(r => r.Author)
                      .OnDelete(DeleteBehavior.Cascade);

                // Comments (1:M)
                entity.HasMany(u => u.Comments)
                      .WithOne(c => c.Author)
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
                      .WithOne(uwf => uwf.User)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Watchlist
            modelBuilder.Entity<Watchlist>(entity =>
            {
                entity.HasKey(w => w.Id);

                entity.HasMany(w => w.Films)
                      .WithOne()
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // UserFavorites
            modelBuilder.Entity<UserFavorites>(entity =>
            {
                entity.HasKey(f => f.Id);

                entity.HasOne(f => f.Film1).WithMany().OnDelete(DeleteBehavior.SetNull);
                entity.HasOne(f => f.Film2).WithMany().OnDelete(DeleteBehavior.SetNull);
                entity.HasOne(f => f.Film3).WithMany().OnDelete(DeleteBehavior.SetNull);
                entity.HasOne(f => f.Film4).WithMany().OnDelete(DeleteBehavior.SetNull);
                entity.HasOne(f => f.Film5).WithMany().OnDelete(DeleteBehavior.SetNull);
            });

            // Film
            modelBuilder.Entity<Film>(entity =>
            {
                entity.HasKey(f => f.Id);
                entity.HasIndex(f => f.Slug).IsUnique();
                entity.HasIndex(f => f.TmdbId).IsUnique();

                entity.HasMany(f => f.Reviews)
                      .WithOne(r => r.Film)
                      .OnDelete(DeleteBehavior.Cascade);

                // Film -> CelebrityCredits
                entity.HasMany(f => f.CastAndCrew)
                      .WithOne(cc => cc.Film)
                      .OnDelete(DeleteBehavior.Cascade);

                // WatchedBy (1:M)
                entity.HasMany(f => f.WatchedBy)
                      .WithOne(uwf => uwf.Film)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // UserWatchedFilm (join entity)
            modelBuilder.Entity<UserWatchedFilm>(entity =>
            {
                entity.HasKey(uwf => uwf.Id);

                entity.HasOne(uwf => uwf.User)
                      .WithMany(u => u.WatchedFilms)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(uwf => uwf.Film)
                      .WithMany(f => f.WatchedBy)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Review
            modelBuilder.Entity<Review>(entity =>
            {
                entity.HasKey(r => r.Id);

                entity.HasOne(r => r.Author)
                      .WithMany(u => u.Reviews)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(r => r.Film)
                      .WithMany(f => f.Reviews)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(r => r.Comments)
                      .WithOne(c => c.Review)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Comment
            modelBuilder.Entity<Comment>(entity =>
            {
                entity.HasKey(c => c.Id);

                entity.HasOne(c => c.Author)
                      .WithMany(u => u.Comments)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(c => c.Review)
                      .WithMany(r => r.Comments)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Celebrity
            modelBuilder.Entity<Celebrity>(entity =>
            {
                entity.HasKey(c => c.Id);

                // Celebrity -> CelebrityCredits
                entity.HasMany(c => c.Credits)
                      .WithOne(cc => cc.Celebrity)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // CelebrityCredit (join entity)
            modelBuilder.Entity<CelebrityCredit>(entity =>
            {
                entity.HasKey(cc => cc.Id);

                entity.HasOne(cc => cc.Celebrity)
                      .WithMany(c => c.Credits)
                      .HasForeignKey("CelebrityId") //shadow property
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(cc => cc.Film)
                      .WithMany(f => f.CastAndCrew)
                      .HasForeignKey("FilmId") //shadow property
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ListEntry
            modelBuilder.Entity<ListEntry>(entity =>
            {
                entity.HasKey(le => le.Id);

                entity.HasOne(le => le.Film)
                      .WithMany()
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // UserList
            modelBuilder.Entity<UserList>(entity =>
            {
                entity.HasKey(ul => ul.Id);

                entity.HasOne(ul => ul.Author)
                      .WithMany(u => u.Lists)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(ul => ul.Films)
                      .WithOne()
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Notification
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(n => n.Id);

                entity.HasOne(n => n.User)
                      .WithMany(u => u.Notifications)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
