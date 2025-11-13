using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Film
    {
        [Key]
        public Guid Id { get; private set; }
        public string Title { get; set; }
        public string? OriginalTitle { get; set; }
        public string Tagline { get; set; }
        public string Synopsis { get; set; }
        public ICollection<string> Genres { get; set; }
        public string PosterUrl { get; set; }
        public string BackdropUrl { get; set; }
        public int Length { get; set; }
        public int ReleaseYear { get; set; }
        public string Slug { get; set; } //unique
        public ICollection<Guid>? Collection { get; set; }
        public int TmdbId { get; set; } //unique
        public DateTime? LastSync { get; set; } //if LastSync < tMDB's last update, resync
        public ICollection<CelebrityCredit> CastAndCrew { get; set; }
        public bool Deleted { get; set; }
        public ICollection<Review> Reviews { get; set; }
        public int FavoriteCount { get; set; }
        public ICollection<UserWatchedFilm> WatchedBy { get; set; }

        public Film(string Title, string? OriginalTitle, string Tagline, string Synopsis, string PosterUrl, string BackdropUrl, int Length, int ReleaseYear, string Slug, int TmdbId)
        {
            this.Id = Guid.NewGuid();
            this.Title = Title;
            this.OriginalTitle = OriginalTitle;
            this.Tagline = Tagline;
            this.Synopsis = Synopsis;
            this.Genres = []; //to be filled during sync
            this.PosterUrl = PosterUrl;
            this.BackdropUrl = BackdropUrl;
            this.Length = Length;
            this.ReleaseYear = ReleaseYear;
            this.Slug = Slug;
            this.TmdbId = TmdbId;
            this.LastSync = DateTime.UtcNow;
            this.CastAndCrew = [];
            this.Deleted = false;
            this.Reviews = [];
            this.FavoriteCount = 0;
            this.WatchedBy = [];
        }
    }
}
