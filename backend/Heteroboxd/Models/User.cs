using Heteroboxd.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; private set; }
        public string Name { get; private set; }
        public string Email { get; private set; } //unique
        public string PasswordHash { get; private set; }
        public string PictureUrl { get; private set; }
        public string? Bio { get; private set; }
        public Tier Tier { get; private set; }
        public DateTime DateJoined { get; private set; }
        public bool Verified { get; set; }
        public bool Deleted { get; private set; }
        public Watchlist Watchlist { get; private set; }
        public UserFavorites Favorites { get; private set; }
        public ICollection<UserList> Lists { get; private set; }
        public ICollection<User> Followers { get; private set; }
        public ICollection<User> Following { get; private set; }
        public ICollection<User> Blocked { get; private set; }
        public ICollection<Report> Reports { get; private set; }
        public ICollection<Notification> Notifications { get; private set; }
        public ICollection<Review> Reviews { get; private set; }
        public ICollection<Comment> Comments { get; private set; }
        public ICollection<Review> LikedReviews { get; private set; }
        public ICollection<Comment> LikedComments { get; private set; }
        public ICollection<UserList> LikedLists { get; private set; }
        public ICollection<UserWatchedFilm> WatchedFilms { get; private set; }

        public User()
        {
            this.Id = Guid.NewGuid();
            this.Name = string.Empty;
            this.Email = this.Id.ToString() + "@example.com";
            this.PasswordHash = string.Empty;
            this.PictureUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/681px-Placeholder_view_vector.svg.png?20220519031949";
            this.Bio = null;
            this.Tier = Tier.Free;
            this.DateJoined = DateTime.UtcNow;
            this.Verified = false;
            this.Deleted = false;
            this.Watchlist = new Watchlist();
            this.Favorites = new UserFavorites();
            this.Lists = new List<UserList>();
            this.Followers = new List<User>();
            this.Following = new List<User>();
            this.Blocked = new List<User>();
            this.Reports = new List<Report>();
            this.Notifications = new List<Notification>();
            this.Reviews = new List<Review>();
            this.Comments = new List<Comment>();
            this.LikedReviews = new List<Review>();
            this.LikedComments = new List<Comment>();
            this.LikedLists = new List<UserList>();
            this.WatchedFilms = new List<UserWatchedFilm>();
        }

        public User(string Name, string Email, string PasswordHash, string? PictureUrl, string Bio)
        {
            this.Id = Guid.NewGuid();
            this.Name = Name;
            this.Email = Email;
            this.PasswordHash = PasswordHash;
            this.PictureUrl = PictureUrl ?? "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/681px-Placeholder_view_vector.svg.png?20220519031949";
            this.Bio = Bio;
            this.Tier = Tier.Free;
            this.DateJoined = DateTime.UtcNow;
            this.Verified = false;
            this.Deleted = false;
            this.Watchlist = new Watchlist();
            this.Favorites = new UserFavorites();
            this.Lists = new List<UserList>();
            this.Followers = new List<User>();
            this.Following = new List<User>();
            this.Blocked = new List<User>();
            this.Reports = new List<Report>();
            this.Notifications = new List<Notification>(); //user should get a welcome notification
            this.Reviews = new List<Review>();
            this.Comments = new List<Comment>();
            this.LikedReviews = new List<Review>();
            this.LikedComments = new List<Comment>();
            this.LikedLists = new List<UserList>();
            this.WatchedFilms = new List<UserWatchedFilm>();
        }
    }
}
