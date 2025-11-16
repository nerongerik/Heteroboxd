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
        public ICollection<Comment> Comments { get; private set; }
        public int LikeCount { get; set; }
        public Guid AuthorId { get; private set; }
        public int FilmId { get; private set; }

        public Review(double Rating, string? Text, int Flags, bool Spoiler, Guid AuthorId, int FilmId)
        {
            this.Id = Guid.NewGuid();
            this.Rating = Rating;
            this.Text = Text;
            this.Date = DateTime.UtcNow;
            this.Flags = Flags;
            this.Spoiler = Spoiler;
            this.NotificationsOn = true;
            this.Deleted = false;
            this.Comments = new List<Comment>();
            this.LikeCount = 0;
            this.AuthorId = AuthorId;
            this.FilmId = FilmId;
        }
    }
}
