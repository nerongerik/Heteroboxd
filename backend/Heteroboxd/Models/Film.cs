namespace Heteroboxd.Models
{
    public class Film
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string? OriginalTitle { get; set; }
        public ICollection<string> Country { get; set; }
        public string Tagline { get; set; }
        public string Synopsis { get; set; }
        public ICollection<string> Genres { get; set; }
        public string PosterUrl { get; set; }
        public string? BackdropUrl { get; set; }
        public int Length { get; set; }
        public DateTime Date { get; set; }
        public Dictionary<int, string> Collection { get; set; }
        public int WatchCount { get; set; }
        public double AverageRating { get; set; }
        public int RatingCount { get; set; }

        public Film(int Id, string Title, string? OriginalTitle, string Tagline, string Synopsis, string PosterUrl, string BackdropUrl, int Length, DateTime Date)
        {
            this.Id = Id;
            this.Title = Title;
            this.OriginalTitle = OriginalTitle;
            this.Country = new List<string>();
            this.Tagline = Tagline;
            this.Synopsis = Synopsis;
            this.Genres = new List<string>();
            this.PosterUrl = PosterUrl;
            this.BackdropUrl = string.IsNullOrEmpty(BackdropUrl) ? null : BackdropUrl;
            this.Length = Length;
            this.Date = Date;
            this.Collection = new Dictionary<int, string>();
            this.WatchCount = 0;
            this.AverageRating = 0.0;
            this.RatingCount = 0;
        }

        public void UpdateFields(Film Film)
        {
            this.Title = Film.Title;
            this.OriginalTitle = Film.OriginalTitle;
            this.Country = Film.Country;
            this.Tagline = Film.Tagline;
            this.Synopsis = Film.Synopsis;
            this.Genres = Film.Genres;
            this.PosterUrl = Film.PosterUrl;
            this.BackdropUrl = string.IsNullOrEmpty(Film.BackdropUrl) ? null : Film.BackdropUrl;
            this.Length = Film.Length;
            this.Date = Film.Date;
            this.Collection = Film.Collection;
            this.AverageRating = Film.AverageRating;
            this.RatingCount = Film.RatingCount;
        }
    }
}
