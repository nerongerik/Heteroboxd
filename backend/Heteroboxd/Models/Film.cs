using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Heteroboxd.Models
{
    public class Film
    {
        [Key]
        public int Id { get; set; } //unique
        public string Title { get; set; }
        public string? OriginalTitle { get; set; }
        public Dictionary<string, string> Country { get; set; }
        public string Tagline { get; set; }
        public string Synopsis { get; set; }
        public ICollection<string> Genres { get; set; }
        public string PosterUrl { get; set; }
        public string? BackdropUrl { get; set; }
        public int Length { get; set; }
        public int ReleaseYear { get; set; }
        public string Slug { get; set; } //unique
        public Dictionary<int, string> Collection { get; set; }
        public DateTime? LastSync { get; set; } //if LastSync < tMDB's last update, resync

        [JsonIgnore]
        public ICollection<CelebrityCredit> CastAndCrew { get; set; }
        public bool Deleted { get; set; }

        [JsonIgnore]
        public ICollection<Review> Reviews { get; set; }
        public int FavoriteCount { get; set; }

        [JsonIgnore]
        public ICollection<UserWatchedFilm> WatchedBy { get; set; }

        public Film(int Id, string Title, string? OriginalTitle, Dictionary<string, string> Country, string Tagline, string Synopsis, string PosterUrl, string BackdropUrl, int Length, int ReleaseYear, string Slug)
        {
            this.Id = Id;
            this.Title = Title;
            this.OriginalTitle = OriginalTitle;
            this.Country = Country;
            this.Tagline = Tagline;
            this.Synopsis = Synopsis;
            this.Genres = new List<string>(); //to be filled during sync
            this.PosterUrl = string.IsNullOrEmpty(PosterUrl) ? "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg" : PosterUrl;
            this.BackdropUrl = string.IsNullOrEmpty(BackdropUrl) ? null : BackdropUrl;
            this.Length = Length;
            this.ReleaseYear = ReleaseYear;
            this.Slug = Slug;
            this.Collection = new Dictionary<int, string>();
            this.LastSync = DateTime.UtcNow;
            this.CastAndCrew = new List<CelebrityCredit>();
            this.Deleted = false;
            this.Reviews = new List<Review>();
            this.FavoriteCount = 0;
            this.WatchedBy = new List<UserWatchedFilm>();
        }
    }
}
