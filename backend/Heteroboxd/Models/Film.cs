using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Heteroboxd.Models
{
    public class Film
    {
        [Key]
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
        public int ReleaseYear { get; set; }
        public Dictionary<int, string> Collection { get; set; }
        public DateTime LastSync { get; set; }

        [JsonIgnore]
        public ICollection<CelebrityCredit> CastAndCrew { get; set; }

        [JsonIgnore]
        public ICollection<Review> Reviews { get; set; }
        public int WatchCount { get; set; }

        [JsonIgnore]
        public ICollection<UserWatchedFilm> WatchedBy { get; set; }

        public Film(int Id, string Title, string? OriginalTitle, string Tagline, string Synopsis, string PosterUrl, string BackdropUrl, int Length, int ReleaseYear)
        {
            this.Id = Id;
            this.Title = Title;
            this.OriginalTitle = OriginalTitle;
            this.Country = new List<string>();
            this.Tagline = Tagline;
            this.Synopsis = Synopsis;
            this.Genres = new List<string>();
            this.PosterUrl = string.IsNullOrEmpty(PosterUrl) ? "noposter" : PosterUrl;
            this.BackdropUrl = string.IsNullOrEmpty(BackdropUrl) ? null : BackdropUrl;
            this.Length = Length;
            this.ReleaseYear = ReleaseYear;
            this.Collection = new Dictionary<int, string>();
            this.LastSync = DateTime.UtcNow;
            this.CastAndCrew = new List<CelebrityCredit>();
            this.Reviews = new List<Review>();
            this.WatchCount = 0;
            this.WatchedBy = new List<UserWatchedFilm>();
        }

        public void UpdateFields(Film Film)
        {
            this.Title = Film.Title;
            this.OriginalTitle = Film.OriginalTitle;
            this.Country = Film.Country;
            this.Tagline = Film.Tagline;
            this.Synopsis = Film.Synopsis;
            this.Genres = Film.Genres;
            this.PosterUrl = string.IsNullOrEmpty(Film.PosterUrl) ? "noposter" : Film.PosterUrl;
            this.BackdropUrl = string.IsNullOrEmpty(Film.BackdropUrl) ? null : Film.BackdropUrl;
            this.Length = Film.Length;
            this.ReleaseYear = Film.ReleaseYear;
            this.Collection = Film.Collection;
            this.LastSync = DateTime.UtcNow;
        }
    }
}
