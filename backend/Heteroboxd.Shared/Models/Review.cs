using Heteroboxd.Shared.Models.DTO;

namespace Heteroboxd.Shared.Models
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
        public int CommentCount { get; set; }
        public Guid AuthorId { get; set; }
        public int FilmId { get; set; }
        public bool FromLetterboxd { get; set; }

        protected Review() { }

        public Review(double Rating, string? Text, bool Spoiler, Guid AuthorId, int FilmId)
        {
            this.Id = Guid.NewGuid();
            this.Rating = Rating;
            this.Text = Text;
            this.Date = DateTime.UtcNow;
            this.Flags = 0;
            this.Spoiler = Spoiler;
            this.NotificationsOn = true;
            this.LikeCount = 0;
            this.CommentCount = 0;
            this.AuthorId = AuthorId;
            this.FilmId = FilmId;
            this.FromLetterboxd = false;
        }

        public Review(double Rating, string? Text, DateTime Date, Guid AuthorId, int FilmId)
        {
            this.Id = Guid.NewGuid();
            this.Rating = Rating;
            this.Text = Text;
            this.Date = Date;
            this.Flags = 0;
            this.Spoiler = false;
            this.NotificationsOn = true;
            this.LikeCount = 0;
            this.CommentCount = 0;
            this.AuthorId = AuthorId;
            this.FilmId = FilmId;
            this.FromLetterboxd = true;
        }

        public void UpdateFields(UpdateReviewRequest ReviewRequest)
        {
            this.Rating = ReviewRequest.Rating ?? this.Rating;
            this.Text = ReviewRequest.Text ?? this.Text;
            this.Spoiler = ReviewRequest.Spoiler ?? this.Spoiler;
        }
    }
}
