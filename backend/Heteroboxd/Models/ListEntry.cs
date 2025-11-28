using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class ListEntry
    {
        [Key]
        public Guid Id { get; set; }
        public DateTime DateAdded { get; set; }
        public int Position { get; set; } //keep nullable for now but may constrain later
        public string FilmPosterUrl { get; set; } //simplifies display
        public int FilmId { get; set; }
        public Guid AuthorId { get; set; } //for easier querying, it may be useful to include who added entry into their list
        public Guid UserListId { get; set; } //foreign key

        public ListEntry(int Position, string FilmPosterUrl, int FilmId, Guid AuthorId, Guid UserListId)
        {
            this.Id = Guid.NewGuid();
            this.DateAdded = DateTime.UtcNow;
            this.Position = Position;
            this.FilmPosterUrl = FilmPosterUrl;
            this.FilmId = FilmId;
            this.AuthorId = AuthorId;
            this.UserListId = UserListId;
        }
    }
}
