namespace Heteroboxd.Shared.Models
{
    public class ListEntry
    {
        public Guid Id { get; set; }
        public int Position { get; set; }
        public int FilmId { get; set; }
        public Guid UserListId { get; set; }

        public ListEntry(int Position, int FilmId, Guid UserListId)
        {
            this.Id = Guid.NewGuid();
            this.Position = Position;
            this.FilmId = FilmId;
            this.UserListId = UserListId;
        }
    }
}
