using Heteroboxd.Models;
using System.ComponentModel.DataAnnotations;

public class UserWatchedFilm
{
    [Key]
    public Guid Id { get; private set; }
    public User User { get; private set; }
    public Film Film { get; private set; }

    public DateTime DateWatched { get; private set; }
    public int TimesWatched { get; private set; }

    public UserWatchedFilm()
    {
        this.Id = Guid.NewGuid();
        this.User = new User();
        this.Film = new Film();
        this.DateWatched = DateTime.UtcNow;
        this.TimesWatched = 0;
    }

    public UserWatchedFilm(User User, Film Film)
    {
        this.Id = Guid.NewGuid();
        this.User = User;
        this.Film = Film;
        DateWatched = DateTime.UtcNow;
        TimesWatched = 1;
    }
}
