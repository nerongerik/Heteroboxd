namespace Heteroboxd.Models
{
    public class WatchlistEntry
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public int FilmId { get; set; }
        public Guid UserId { get; set; }

        public WatchlistEntry(int FilmId, Guid UserId)
        {
            this.Id = Guid.NewGuid();
            this.Date = DateTime.UtcNow;
            this.FilmId = FilmId;
            this.UserId = UserId;
        }
    }
}
