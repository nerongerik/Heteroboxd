using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Comment
    {
        [Key]
        public Guid Id { get; private set; }
        public string Text { get; private set; }
        public DateTime Date { get; private set; }
        public int Flags { get; private set; }
        public bool NotificationsOn { get; private set; }
        public bool Deleted { get; private set; }
        public User Author { get; private set; }
        public Review Review { get; private set; }
        public int LikeCount { get; private set; }

        public Comment()
        {
            this.Id = Guid.NewGuid();
            this.Text = string.Empty;
            this.Date = DateTime.UtcNow;
            this.Flags = 0;
            this.NotificationsOn = true;
            this.Deleted = false;
            this.Author = new User();
            this.Review = new Review();
            this.LikeCount = 0;
        }

        public Comment(string Text, int Flags, User Author, Review Review)
        {
            this.Id = Guid.NewGuid();
            this.Text = Text;
            this.Date = DateTime.UtcNow;
            this.Flags = Flags;
            this.NotificationsOn = true;
            this.Deleted = false;
            this.Author = Author;
            this.Review = Review;
            this.LikeCount = 0;
        }
    }
}
