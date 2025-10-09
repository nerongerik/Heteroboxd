using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Comment
    {
        [Key]
        public Guid Id { get; private set; }
        public string Text { get; set; }
        public DateTime Date { get; private set; }
        public int Flags { get; set; }
        public bool NotificationsOn { get; set; }
        public bool Deleted { get; set; }
        public int LikeCount { get; set; }
        public Guid AuthorId { get; private set; }
        public Guid ReviewId { get; private set; }

        public Comment(string Text, int Flags, Guid AuthorId, Guid ReviewId)
        {
            this.Id = Guid.NewGuid();
            this.Text = Text;
            this.Date = DateTime.UtcNow;
            this.Flags = Flags;
            this.NotificationsOn = true;
            this.Deleted = false;
            this.LikeCount = 0;
            this.AuthorId = AuthorId;
            this.ReviewId = ReviewId;
        }
    }
}
