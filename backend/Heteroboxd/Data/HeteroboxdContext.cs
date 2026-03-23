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
        public DbSet<UserFavorites> UserFavorites { get; set; }
        public DbSet<UserWatchedFilm> UserWatchedFilms { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Trending> Trendings { get; set; }
        public DbSet<Country> Countries { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder); //let Identity configure itself

            //map Identity tables to preferred names
            modelBuilder.Entity<User>(b =>
            {
                b.ToTable("Users");
                b.HasIndex(u => u.Email).IsUnique();
                b.Property(u => u.Gender).HasConversion<string>();
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
                //Followers/Following (M:M)
                entity.HasMany(u => u.Following)
                      .WithMany(u => u.Followers)
                      .UsingEntity(j => j.ToTable("UserRelationships"));

                //Blocked (M:M)
                entity.HasMany(u => u.Blocked)
                      .WithMany()
                      .UsingEntity(j => j.ToTable("UserBlocked"));

                //LikedReviews (M:M)
                entity.HasMany(u => u.LikedReviews)
                    .WithMany()
                    .UsingEntity(j =>
                    {
                        j.ToTable("UserLikedReviews");
                        j.HasOne(typeof(Review))
                        .WithMany()
                        .OnDelete(DeleteBehavior.Cascade);
                    });

                //LikedLists (M:M)
                entity.HasMany(u => u.LikedLists)
                      .WithMany()
                      .UsingEntity(j =>
                      {
                          j.ToTable("UserLikedLists");
                          j.HasOne(typeof(UserList))
                          .WithMany()
                          .OnDelete(DeleteBehavior.Cascade);
                      });
            });

            //UserFavorites
            modelBuilder.Entity<UserFavorites>(entity =>
            {
                entity.HasKey(f => f.Id);

                entity.HasOne<User>()
                      .WithMany()
                      .HasForeignKey(uf => uf.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<Film>()
                      .WithMany()
                      .HasForeignKey(uf => uf.Film1)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne<Film>()
                      .WithMany()
                      .HasForeignKey(uf => uf.Film2)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne<Film>()
                      .WithMany()
                      .HasForeignKey(uf => uf.Film3)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne<Film>()
                      .WithMany()
                      .HasForeignKey(uf => uf.Film4)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            //Film
            modelBuilder.Entity<Film>(entity =>
            {
                entity.HasKey(f => f.Id);

                entity.Property(f => f.Collection)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                        v => JsonSerializer.Deserialize<Dictionary<int, string>>(v, (JsonSerializerOptions)null!)!
                    )
                    .HasColumnType("jsonb")
                    .Metadata.SetValueComparer(
                        new ValueComparer<Dictionary<int, string>>(
                            (d1, d2) => JsonSerializer.Serialize(d1, (JsonSerializerOptions)null!) ==
                                        JsonSerializer.Serialize(d2, (JsonSerializerOptions)null!),
                            d => d == null ? 0 : JsonSerializer.Serialize(d, (JsonSerializerOptions)null!).GetHashCode(),
                            d => d == null ? new Dictionary<int, string>()
                                : JsonSerializer.Deserialize<Dictionary<int, string>>(
                                        JsonSerializer.Serialize(d, (JsonSerializerOptions)null!),
                                        (JsonSerializerOptions)null!)!
                        )
                    );
            });

            //UserWatchedFilm
            modelBuilder.Entity<UserWatchedFilm>(entity =>
            {
                entity.HasKey(uwf => uwf.Id);

                entity.HasOne<User>()
                      .WithMany()
                      .HasForeignKey(uwf => uwf.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<Film>()
                      .WithMany()
                      .HasForeignKey(uwf => uwf.FilmId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            //Review
            modelBuilder.Entity<Review>(entity =>
            {
                entity.HasKey(r => r.Id);

                entity.HasOne<User>()
                      .WithMany()
                      .HasForeignKey(r => r.AuthorId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<Film>()
                      .WithMany()
                      .HasForeignKey(r => r.FilmId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            //Comment
            modelBuilder.Entity<Comment>(entity =>
            {
                entity.HasKey(c => c.Id);

                entity.HasOne<Review>()
                      .WithMany()
                      .HasForeignKey(c => c.ReviewId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<User>()
                      .WithMany()
                      .HasForeignKey(c => c.AuthorId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            //Celebrity
            modelBuilder.Entity<Celebrity>(entity =>
            {
                entity.HasKey(c => c.Id);
            });

            //CelebrityCredit
            modelBuilder.Entity<CelebrityCredit>(entity =>
            {
                entity.HasKey(cc => cc.Id);

                entity.HasOne<Celebrity>()
                      .WithMany()
                      .HasForeignKey(cc => cc.CelebrityId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<Film>()
                      .WithMany()
                      .HasForeignKey(cc => cc.FilmId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            //ListEntry
            modelBuilder.Entity<ListEntry>(entity =>
            {
                entity.HasKey(le => le.Id);

                entity.HasOne<UserList>()
                      .WithMany()
                      .HasForeignKey(le => le.UserListId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<Film>()
                      .WithMany()
                      .HasForeignKey(le => le.FilmId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            //WatchlistEntry
            modelBuilder.Entity<WatchlistEntry>(entity =>
            {
                entity.HasKey(wle => wle.Id);

                entity.HasOne<User>()
                      .WithMany()
                      .HasForeignKey(wle => wle.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<Film>()
                      .WithMany()
                      .HasForeignKey(wle => wle.FilmId)
                      .OnDelete(DeleteBehavior.Cascade);
            });


            //UserList
            modelBuilder.Entity<UserList>(entity =>
            {
                entity.HasKey(ul => ul.Id);

                entity.HasOne<User>()
                      .WithMany()
                      .HasForeignKey(ul => ul.AuthorId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            //Notification
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(n => n.Id);

                entity.HasOne<User>()
                      .WithMany()
                      .HasForeignKey(n => n.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            //RefreshToken
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(rt => rt.Id);
            });

            //Trending
            modelBuilder.Entity<Trending>(entity =>
            {
                entity.HasKey(t => t.FilmId);
            });

            //Country
            modelBuilder.Entity<Country>(entity =>
            {
                entity.HasKey(c => c.Code);
            });
        }
    }
}
