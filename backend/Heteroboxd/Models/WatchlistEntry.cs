using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class WatchlistEntry
    {
        [Key]
        public Guid Id { get; set; }
        public DateTime DateAdded { get; set; }
        public string FilmPosterUrl { get; set; } //simplifies display
        public int FilmId { get; set; }
        public Guid UserId { get; set; } //since every user has only one watchlist, we can store the UserId here for easier querying
        public Guid WatchlistId { get; set; } //foreign key

        public WatchlistEntry(string FilmPosterUrl, int FilmId, Guid UserId, Guid WatchlistId)
        {
            this.Id = Guid.NewGuid();
            this.DateAdded = DateTime.UtcNow;
            this.FilmPosterUrl = FilmPosterUrl;
            this.FilmId = FilmId;
            this.UserId = UserId;
            this.WatchlistId = WatchlistId;
        }
    }
}
