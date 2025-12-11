using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Comment
    {
        [Key]
        public Guid Id { get; set; }
        public string Text { get; set; }
        public DateTime Date { get; set; }
        public int Flags { get; set; }
        public bool NotificationsOn { get; set; }
        public int LikeCount { get; set; }
        public Guid AuthorId { get; set; }
        public Guid ReviewId { get; set; }

        public Comment(string Text, int Flags, Guid AuthorId, Guid ReviewId)
        {
            this.Id = Guid.NewGuid();
            this.Text = Text;
            this.Date = DateTime.UtcNow;
            this.Flags = Flags;
            this.NotificationsOn = true;
            this.LikeCount = 0;
            this.AuthorId = AuthorId;
            this.ReviewId = ReviewId;
        }
    }
}
