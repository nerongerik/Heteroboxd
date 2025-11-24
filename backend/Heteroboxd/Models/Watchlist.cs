using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Watchlist
    {
        [Key]
        public Guid Id { get; set; }
        public ICollection<WatchlistEntry> Films { get; set; }
        public Guid UserId { get; set; }

        public Watchlist(Guid UserId)
        {
            this.Id = Guid.NewGuid();
            this.Films = new List<WatchlistEntry>();
            this.UserId = UserId;
        }
    }
}
