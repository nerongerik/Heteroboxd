using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Film
    {
        [Key]
        public Guid Id { get; private set; }
        public string Title { get; private set; }
        public string? OriginalTitle { get; private set; }
        public string Synopsis { get; private set; }
        public string PosterUrl { get; private set; }
        public string? BackdropUrl { get; private set; }
        public string? TrailerUrl { get; private set; }
        public int Length { get; private set; }
        public int ReleaseYear { get; private set; }
        public string Slug { get; private set; } //unique
        public string TmdbId { get; private set; } //unique
        public DateTime? LastSync { get; private set; }
        public ICollection<Celebrity> CastAndCrew { get; private set; }
        public bool Deleted { get; private set; }
        public ICollection<Review> Reviews { get; private set; }
        public int FavoriteCount { get; private set; }

        //a film SHOULD know which lists it was featured in, but for mobility and performance reasons I won't include that here

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
            this.CastAndCrew = new List<Celebrity>();
            this.Deleted = false;
            this.Reviews = new List<Review>();
            this.FavoriteCount = 0;
        }

        public Film(string Title, string? OriginalTitle, string Synopsis, string? PosterUrl, string? BackdropUrl, string? TrailerUrl, int Length, int ReleaseYear, string Slug, string TmdbId)
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
            this.LastSync = DateTime.UtcNow;
            this.CastAndCrew = new List<Celebrity>();
            this.Deleted = false;
            this.Reviews = new List<Review>();
            this.FavoriteCount = 0;
        }
    }
}
