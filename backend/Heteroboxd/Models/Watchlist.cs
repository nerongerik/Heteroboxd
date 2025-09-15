using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Watchlist
    {
        [Key]
        public Guid Id { get; private set; }
        public ICollection<ListEntry> Films { get; private set; }
        public Guid UserId { get; private set; }
        public User User { get; private set; }

        public Watchlist()
        {
            this.Id = Guid.NewGuid();
            this.Films = new List<ListEntry>();
            this.User = new User();
            this.UserId = this.User.Id;
        }

        public Watchlist(User User)
        {
            this.Id = Guid.NewGuid();
            this.Films = new List<ListEntry>();
            this.User = User;
            this.UserId = User.Id;
        }
    }
}
