using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Watchlist
    {
        [Key]
        public Guid Id { get; private set; }
        public ICollection<ListEntry> Films { get; private set; }
        public Guid UserId { get; private set; }

        public Watchlist(Guid UserId)
        {
            this.Id = Guid.NewGuid();
            this.Films = new List<ListEntry>();
            this.UserId = UserId;
        }
    }
}
