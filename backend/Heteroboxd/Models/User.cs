using Heteroboxd.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; private set; }
        public string Name { get; set; }
        public string Email { get; private set; } //unique
        public string PasswordHash { get; set; }
        public string PictureUrl { get; set; }
        public string? Bio { get; set; }
        public Tier Tier { get; set; }
        public DateTime DateJoined { get; private set; }
        public bool Verified { get; set; }
        public bool Deleted { get; set; }
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
            this.Watchlist = new Watchlist(this.Id);
            this.Favorites = new UserFavorites(this.Id);
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
