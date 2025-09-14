using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Review
    {
        [Key]
        public Guid Id { get; private set; }
        public double Rating { get; set; }
        public string? Text { get; set; }
        public DateTime Date { get; private set; }
        public int Flags { get; set; }
        public bool Spoiler { get; set; }
        public bool NotificationsOn { get; set; }
        public bool Deleted { get; set; }
        public User Author { get; private set; }
        public Film Film { get; private set; }
        public ICollection<Comment> Comments { get; private set; }
        public int LikeCount { get; set; }

        public Review()
        {
            this.Id = Guid.NewGuid();
            this.Rating = 0.0;
            this.Text = null;
            this.Date = DateTime.UtcNow;
            this.Flags = 0;
            this.Spoiler = false;
            this.NotificationsOn = true;
            this.Deleted = false;
            this.Author = new User();
            this.Film = new Film();
            this.Comments = new List<Comment>();
            this.LikeCount = 0;
        }

        public Review(double Rating, string? Text, int Flags, bool Spoiler, User Author, Film Film)
        {
            this.Id = Guid.NewGuid();
            this.Rating = Rating;
            this.Text = Text;
            this.Date = DateTime.UtcNow;
            this.Flags = Flags;
            this.Spoiler = Spoiler;
            this.NotificationsOn = true;
            this.Deleted = false;
            this.Author = Author;
            this.Film = Film;
            this.Comments = new List<Comment>();
            this.LikeCount = 0;
        }
    }
}
