using Heteroboxd.Models.Enums;
using Microsoft.AspNetCore.Identity;

namespace Heteroboxd.Models
{
    public class User : IdentityUser<Guid>
    {
        public string Name { get; set; }
        public string PictureUrl { get; set; }
        public string? Bio { get; set; }
        public Tier Tier { get; set; } //current tier
        public DateTime? TierExpiry { get; set; } //null if free tier
        public bool IsPatron { get; set; } //indicates if user ever donated >$50 at once
        public DateTime DateJoined { get; private set; }
        public bool Deleted { get; set; }
        public Watchlist? Watchlist { get; set; }
        public UserFavorites? Favorites { get; set; }
        public ICollection<UserList> Lists { get; set; }
        public ICollection<User> Followers { get; set; }
        public ICollection<User> Following { get; set; }
        public ICollection<User> Blocked { get; set; }
        public ICollection<Notification> Notifications { get; set; }
        public ICollection<Review> Reviews { get; set; }
        public ICollection<Review> LikedReviews { get; set; }
        public ICollection<Comment> LikedComments { get; set; }
        public ICollection<UserList> LikedLists { get; set; }
        public ICollection<UserWatchedFilm> WatchedFilms { get; set; }

        public User()
        {
            Tier = Tier.Free;
            TierExpiry = null;
            IsPatron = false;
            DateJoined = DateTime.UtcNow;
            Deleted = false;
            Watchlist = null; //to be set after user creation
            Favorites = null; //to be set after user creation
            Lists = [];
            Followers = [];
            Following = [];
            Blocked = [];
            Notifications = [];
            Reviews = [];
            LikedReviews = [];
            LikedComments = [];
            LikedLists = [];
            WatchedFilms = [];
        }

        public User(string Name, string Email, string? PictureUrl, string? Bio) : this()
        {
            this.UserName = Email;
            this.Email = Email;
            this.Name = Name;
            this.PictureUrl = PictureUrl ?? "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/681px-Placeholder_view_vector.svg.png?20220519031949";
            this.Bio = Bio;
        }
    }
}
