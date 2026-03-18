using Heteroboxd.Models.DTO;

namespace Heteroboxd.Models
{
    public class Review
    {
        public Guid Id { get; set; }
        public double Rating { get; set; }
        public string? Text { get; set; }
        public DateTime Date { get; set; }
        public int Flags { get; set; }
        public bool Spoiler { get; set; }
        public bool NotificationsOn { get; set; }
        public int LikeCount { get; set; }
        public Guid AuthorId { get; set; }
        public int FilmId { get; set; }

        public Review(double Rating, string? Text, int Flags, bool Spoiler, Guid AuthorId, int FilmId)
        {
            this.Id = Guid.NewGuid();
            this.Rating = Rating;
            this.Text = Text;
            this.Date = DateTime.UtcNow;
            this.Flags = Flags;
            this.Spoiler = Spoiler;
            this.NotificationsOn = true;
            this.LikeCount = 0;
            this.AuthorId = AuthorId;
            this.FilmId = FilmId;
        }

        public void UpdateFields(UpdateReviewRequest ReviewRequest)
        {
            this.Rating = ReviewRequest.Rating ?? this.Rating;
            this.Text = ReviewRequest.Text ?? this.Text;
            this.Spoiler = ReviewRequest.Spoiler ?? this.Spoiler;
        }
    }
}
