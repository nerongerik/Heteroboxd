using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Film
    {
        [Key]
        public Guid Id { get; private set; }
        public string Title { get; set; }
        public string? OriginalTitle { get; private set; }
        public string Synopsis { get; set; }
        public string PosterUrl { get; set; }
        public string? BackdropUrl { get; set; }
        public string? TrailerUrl { get; private set; }
        public int Length { get; private set; }
        public int ReleaseYear { get; private set; }
        public string Slug { get; private set; } //unique
        public string TmdbId { get; private set; } //unique
        public DateTime? LastSync { get; private set; } //if LastSync < tMDB's last update, resync
        public bool TitleLocked { get; set; } //if true, title won't be updated during sync
        public bool SynopsisLocked { get; set; } //if true, synopsis won't be updated during sync
        public bool PosterUrlLocked { get; set; } //if true, poster url won't be updated during sync
        public bool BackdropUrlLocked { get; set; } //if true, backdrop url won't be updated during sync
        public ICollection<CelebrityCredit> CastAndCrew { get; private set; }
        public bool Deleted { get; set; }
        public ICollection<Review> Reviews { get; private set; }
        public int FavoriteCount { get; set; }
        public ICollection<UserWatchedFilm> WatchedBy { get; private set; }

        public Film()
        {
            this.Id = Guid.NewGuid();
            this.Title = string.Empty;
            this.OriginalTitle = null;
            this.Synopsis = string.Empty;
            this.PosterUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/681px-Placeholder_view_vector.svg.png?20220519031949";
            this.BackdropUrl = null;
            this.TrailerUrl = null;
            this.Length = 0;
            this.ReleaseYear = 0;
            this.Slug = "Slug" + this.Id.ToString();
            this.TmdbId = "TMDB" + this.Id.ToString();
            this.LastSync = null;
            this.TitleLocked = false;
            this.SynopsisLocked = false;
            this.PosterUrlLocked = false;
            this.BackdropUrlLocked = false;
            this.CastAndCrew = new List<CelebrityCredit>();
            this.Deleted = false;
            this.Reviews = new List<Review>();
            this.FavoriteCount = 0;
            this.WatchedBy = new List<UserWatchedFilm>();
        }

        public Film(string Title, string? OriginalTitle, string Synopsis, string? PosterUrl, string? BackdropUrl, string? TrailerUrl, int Length, int ReleaseYear, string Slug, string TmdbId, List<CelebrityCredit> CastAndCrew)
        {
            this.Id = Guid.NewGuid();
            this.Title = Title;
            this.OriginalTitle = OriginalTitle;
            this.Synopsis = Synopsis;
            this.PosterUrl = PosterUrl ?? "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/681px-Placeholder_view_vector.svg.png?20220519031949";
            this.BackdropUrl = BackdropUrl;
            this.TrailerUrl = TrailerUrl;
            this.Length = Length;
            this.ReleaseYear = ReleaseYear;
            this.Slug = Slug;
            this.TmdbId = TmdbId;
            this.TitleLocked = false;
            this.SynopsisLocked = false;
            this.PosterUrlLocked = false;
            this.BackdropUrlLocked = false;
            this.LastSync = DateTime.UtcNow;
            this.CastAndCrew = CastAndCrew;
            this.Deleted = false;
            this.Reviews = new List<Review>();
            this.FavoriteCount = 0;
            this.WatchedBy = new List<UserWatchedFilm>();
        }
    }
}
