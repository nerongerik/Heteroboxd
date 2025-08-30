using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Review
    {
        [Key]
        public Guid Id { get; private set; }
        public double Rating { get; private set; }
        public string? Text { get; private set; }
        public DateTime Date { get; private set; }
        public int Flags { get; private set; }
        public bool Spoiler { get; private set; }
        public bool NotificationsOn { get; private set; }
        public bool Deleted { get; private set; }
        public User Author { get; private set; }
        public Film Film { get; private set; }
        public ICollection<Comment> Comments { get; private set; }
        public int LikeCount { get; private set; }

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
    }
}
