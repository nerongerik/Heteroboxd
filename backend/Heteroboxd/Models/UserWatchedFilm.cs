using Heteroboxd.Models;
using System.ComponentModel.DataAnnotations;

public class UserWatchedFilm
{
    [Key]
    public Guid Id { get; set; }
    public DateTime DateWatched { get; set; }
    public int TimesWatched { get; set; }
    public Guid UserId { get; set; }
    public int FilmId { get; set; }

    public UserWatchedFilm(Guid UserId, int FilmId)
    {
        this.Id = Guid.NewGuid();
        this.UserId = UserId;
        this.FilmId = FilmId;
        DateWatched = DateTime.UtcNow;
        TimesWatched = 1;
    }
}
