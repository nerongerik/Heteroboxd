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
        public string? BackdropUrl { get; set; }
        public int Length { get; set; }
        public int ReleaseYear { get; set; }
        public string Slug { get; set; } //unique
        public ICollection<Guid> Collection { get; set; }
        public string TmdbId { get; set; } //unique
        public DateTime? LastSync { get; set; } //if LastSync < tMDB's last update, resync
        public ICollection<CelebrityCredit> CastAndCrew { get; set; }
        public bool Deleted { get; set; }
        public ICollection<Review> Reviews { get; set; }
        public int FavoriteCount { get; set; }
        public ICollection<UserWatchedFilm> WatchedBy { get; set; }

        public Film(string Title, string? OriginalTitle, string Synopsis, List<string> Genres, string? PosterUrl, string? BackdropUrl, int Length, int ReleaseYear, string Slug, string TmdbId)
        {
            this.Id = Guid.NewGuid();
            this.Title = Title;
            this.OriginalTitle = OriginalTitle;
            this.Synopsis = Synopsis;
            this.Genres = Genres;
            this.PosterUrl = PosterUrl ?? "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/681px-Placeholder_view_vector.svg.png?20220519031949";
            this.BackdropUrl = BackdropUrl;
            this.Length = Length;
            this.ReleaseYear = ReleaseYear;
            this.Slug = Slug;
            this.Collection = [];
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
