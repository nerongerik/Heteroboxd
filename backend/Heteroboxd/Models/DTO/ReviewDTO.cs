namespace Heteroboxd.Models.DTO
{
    public class ReviewInfoResponse
    {
        public string Id { get; set; }
        public double Rating { get; set; }
        public string? Text { get; set; }
        public string Date { get; set; }
        public int Flags { get; set; }
        public bool Spoiler { get; set; }
        public bool NotificationsOn { get; set; }
        public int LikeCount { get; set; }
        public string AuthorId { get; set; } //necessary navigation quality
        public string? AuthorName { get; set; } //optional decorative
        public string? AuthorProfilePictureUrl { get; set; } //optional decorative
        public string? AuthorTier { get; set; }
        public bool? AuthorPatron { get; set; }
        public int FilmId { get; set; } //necessary navigation quality
        public string? FilmTitle { get; set; } //optional decorative
        public string? FilmPosterUrl { get; set; } //optional decorative

        public ReviewInfoResponse(Review Review, User Author, Film Film)
        {
            this.Id = Review.Id.ToString();
            this.Rating = Review.Rating;
            this.Text = Review.Text;
            this.Date = Review.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Review.Flags;
            this.Spoiler = Review.Spoiler;
            this.NotificationsOn = Review.NotificationsOn;
            this.LikeCount = Review.LikeCount;

            this.AuthorId = Author.Id.ToString();
            this.AuthorName = Author.Name;
            this.AuthorProfilePictureUrl = Author.PictureUrl;
            this.AuthorPatron = Author.IsPatron;
            this.AuthorTier = Author.Tier.ToString().ToLower();

            this.FilmId = Film.Id;
            this.FilmTitle = Film.Title;
            this.FilmPosterUrl = Film.PosterUrl;
        }

        public ReviewInfoResponse(Review Review, User Author)
        {
            this.Id = Review.Id.ToString();
            this.Rating = Review.Rating;
            this.Text = Review.Text;
            this.Date = Review.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Review.Flags;
            this.Spoiler = Review.Spoiler;
            this.NotificationsOn = Review.NotificationsOn;
            this.LikeCount = Review.LikeCount;

            this.AuthorId = Author.Id.ToString();
            this.AuthorName = Author.Name;
            this.AuthorProfilePictureUrl = Author.PictureUrl;
            this.AuthorPatron = Author.IsPatron;
            this.AuthorTier = Author.Tier.ToString().ToLower();

            this.FilmId = Review.FilmId;
        }

        public ReviewInfoResponse(Review Review, Film Film)
        {
            this.Id = Review.Id.ToString();
            this.Rating = Review.Rating;
            this.Text = Review.Text;
            this.Date = Review.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Review.Flags;
            this.Spoiler = Review.Spoiler;
            this.NotificationsOn = Review.NotificationsOn;
            this.LikeCount = Review.LikeCount;

            this.AuthorId = Review.AuthorId.ToString();

            this.FilmId = Film.Id;
            this.FilmTitle = Film.Title;
            this.FilmPosterUrl = Film.PosterUrl;
        }

        public ReviewInfoResponse(Review Review)
        {
            this.Id = Review.Id.ToString();
            this.Rating = Review.Rating;
            this.Text = Review.Text;
            this.Date = Review.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Review.Flags;
            this.Spoiler = Review.Spoiler;
            this.NotificationsOn = Review.NotificationsOn;
            this.LikeCount = Review.LikeCount;

            this.AuthorId = Review.AuthorId.ToString();

            this.FilmId = Review.FilmId;
        }
    }

    public class PagedReviewResponse { }

    public class CreateReviewRequest
    {
        public double Rating { get; set; }
        public string? Text { get; set; }
        public bool Spoiler { get; set; }
        public string AuthorId { get; set; }
        public int FilmId { get; set; }
    }

    public class UpdateReviewRequest
    {
        public string ReviewId { get; set; }
        public double? Rating { get; set; }
        public string? Text { get; set; }
        public bool? Spoiler { get; set; }
    }
}
