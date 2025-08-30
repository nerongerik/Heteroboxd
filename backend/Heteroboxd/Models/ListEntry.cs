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

        public ListEntry()
        {
            this.Id = Guid.NewGuid();
            this.Film = new Film();
            this.DateAdded = DateTime.UtcNow;
        }
    }
}
