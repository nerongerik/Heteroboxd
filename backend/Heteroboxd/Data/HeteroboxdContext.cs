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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Tier).HasConversion<string>();

                // Watchlist
                entity.HasMany(u => u.Watchlist)
                      .WithOne()
                      .OnDelete(DeleteBehavior.Cascade);

                // Lists
                entity.HasMany(u => u.Lists)
                      .WithOne(l => l.Author)
                      .OnDelete(DeleteBehavior.Cascade);

                // Followers (who follows THIS user)
                entity.HasMany(u => u.Followers)
                      .WithMany()
                      .UsingEntity(j => j.ToTable("UserFollowers"));

                // Following (who THIS user follows)
                entity.HasMany(u => u.Following)
                      .WithMany()
                      .UsingEntity(j => j.ToTable("UserFollowing"));


                // Blocked users (many-to-many)
                entity.HasMany(u => u.Blocked)
                      .WithMany()
                      .UsingEntity(j => j.ToTable("UserBlocked"));

                // Notifications
                entity.HasMany(u => u.Notifications)
                      .WithOne(n => n.User)
                      .OnDelete(DeleteBehavior.Cascade);

                // Reviews
                entity.HasMany(u => u.Reviews)
                      .WithOne(r => r.Author)
                      .OnDelete(DeleteBehavior.Cascade);

                // Comments
                entity.HasMany(u => u.Comments)
                      .WithOne(c => c.Author)
                      .OnDelete(DeleteBehavior.Cascade);

                // LikedReviews (many-to-many)
                entity.HasMany(u => u.LikedReviews)
                      .WithMany()
                      .UsingEntity(j => j.ToTable("UserLikedReviews"));

                // LikedComments (many-to-many)
                entity.HasMany(u => u.LikedComments)
                      .WithMany()
                      .UsingEntity(j => j.ToTable("UserLikedComments"));

                // LikedLists (many-to-many)
                entity.HasMany(u => u.LikedLists)
                      .WithMany()
                      .UsingEntity(j => j.ToTable("UserLikedLists"));

                // Favorites
                entity.HasMany(u => u.Favorites)
                      .WithOne()
                      .OnDelete(DeleteBehavior.Cascade);
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

                entity.HasMany(f => f.CastAndCrew)
                      .WithOne()
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

                entity.HasMany(c => c.Credits)
                      .WithOne()
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // CelebrityCredit
            modelBuilder.Entity<CelebrityCredit>(entity =>
            {
                entity.HasKey(cc => cc.Id);

                entity.HasOne(cc => cc.Film)
                      .WithMany()
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
