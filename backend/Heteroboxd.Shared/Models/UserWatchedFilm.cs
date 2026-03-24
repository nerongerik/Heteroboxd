namespace Heteroboxd.Shared.Models
{
    public class UserWatchedFilm
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public int TimesWatched { get; set; }
        public Guid UserId { get; set; }
        public int FilmId { get; set; }

        public UserWatchedFilm(Guid UserId, int FilmId)
        {
            this.Id = Guid.NewGuid();
            this.UserId = UserId;
            this.FilmId = FilmId;
            Date = DateTime.UtcNow;
            TimesWatched = 1;
        }
    }
}
