namespace Heteroboxd.Models.DTO
{
    public class ReviewInfoResponse
    {
        public string Id { get; set; }
        public double Rating { get; set; }
        public string? Text { get; set; }
        public DateTime Date { get; set; }
        public int Flags { get; set; }
        public bool Spoiler { get; set; }
        public bool NotificationsOn { get; set; }
        public UserInfoResponse Author { get; set; }
        public FilmInfoResponse Film { get; set; }
        public int LikeCount { get; set; }

        public ReviewInfoResponse(Review Review)
        {
            this.Id = Review.Id.ToString();
            this.Rating = Review.Rating;
            this.Text = Review.Text;
            this.Date = Review.Date;
            this.Flags = Review.Flags;
            this.Spoiler = Review.Spoiler;
            this.NotificationsOn = Review.NotificationsOn;
            this.Author = new UserInfoResponse(Review.Author);
            this.Film = new FilmInfoResponse(Review.Film);
            this.LikeCount = Review.LikeCount;
        }
    }
    public class CreateReviewRequest
    {
        public double Rating { get; set; }
        public string? Text { get; set; }
        public int Flags { get; set; }
        public bool Spoiler { get; set; }
        public string AuthorId { get; set; }
        public string FilmId { get; set; }
    }

    public class UpdateReviewRequest
    {
        public string ReviewId { get; set; }
        public double? Rating { get; set; }
        public string? Text { get; set; }
        public bool? Spoiler { get; set; }
    }
}
