using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class ListEntry
    {
        [Key]
        public Guid Id { get; private set; }
        public DateTime DateAdded { get; private set; }
        public int? Position { get; set; }
        public Guid FilmId { get; private set; } //required foreign key
        public Guid? WatchlistId { get; private set; } //optional foreign key
        public Guid? UserListId { get; private set; } //optional foreign key

        public ListEntry(Guid FilmId, int? Position, Guid? WatchlistId, Guid? UserListId)
        {
            this.Id = Guid.NewGuid();
            this.DateAdded = DateTime.UtcNow;
            this.Position = Position;
            this.FilmId = FilmId;
            if (WatchlistId != null) this.WatchlistId = WatchlistId;
            if (UserListId != null) this.UserListId = UserListId;
        }
    }
}
