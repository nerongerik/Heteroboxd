using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class ListEntry
    {
        [Key]
        public Guid Id { get; private set; }
        public Film Film { get; private set; }
        public DateTime DateAdded { get; private set; }
        public int? Position { get; private set; }
        public Guid? WatchlistId { get; private set; } //optional foreign key
        public Watchlist? Watchlist { get; private set; }
        public Guid? UserListId { get; private set; } //optional foreign key
        public UserList? UserList { get; private set; }

        public ListEntry()
        {
            this.Id = Guid.NewGuid();
            this.Film = new Film();
            this.DateAdded = DateTime.UtcNow;
        }

        public ListEntry(Film Film, int? Position, Watchlist? Watchlist, UserList? UserList)
        {
            this.Id = Guid.NewGuid();
            this.Film = Film;
            this.DateAdded = DateTime.UtcNow;
            this.Position = Position;
            if (Watchlist != null)
            {
                this.Watchlist = Watchlist;
                this.WatchlistId = Watchlist.Id;
            }
            if (UserList != null)
            {
                this.UserList = UserList;
                this.UserListId = UserList.Id;
            }
        }
    }
}
