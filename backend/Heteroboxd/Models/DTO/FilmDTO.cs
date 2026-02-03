namespace Heteroboxd.Models.DTO
{
    public class FilmInfoResponse
    {
        public int FilmId { get; set; }
        public string Title { get; set; }
        public string? OriginalTitle { get; set; }
        public Dictionary<string, string> Country { get; set; }
        public List<string> Genres { get; set; }
        public string Tagline { get; set; }
        public string Synopsis { get; set; }
        public string PosterUrl { get; set; }
        public string? BackdropUrl { get; set; }
        public int Length { get; set; }
        public int ReleaseYear { get; set; }
        public int WatchCount { get; set; }
        public Dictionary<int, string>? Collection { get; set; }
        public int ReviewCount { get; set; }
        public List<CelebrityCreditInfoResponse>? CastAndCrew { get; set; }

        public FilmInfoResponse(Film Film, bool IncludeCredits = false)
        {
            this.FilmId = Film.Id;
            this.Title = Film.Title;
            this.OriginalTitle = Film.OriginalTitle;
            this.Country = Film.Country;
            this.Genres = Film.Genres.ToList();
            this.Tagline = Film.Tagline;
            this.Synopsis = Film.Synopsis;
            this.PosterUrl = Film.PosterUrl;
            this.BackdropUrl = Film.BackdropUrl;
            this.Length = Film.Length;
            this.ReleaseYear = Film.ReleaseYear;
            this.WatchCount = Film.WatchCount;
            this.Collection = Film.Collection;
            this.ReviewCount = Film.Reviews.Count();

            if (IncludeCredits && Film.CastAndCrew != null)
            {
                this.CastAndCrew = Film.CastAndCrew
                    .Select(c => new CelebrityCreditInfoResponse(c))
                    .ToList();
            }
            else this.CastAndCrew = null;
        }
    }

    public class WatchlistEntryInfoResponse
    {
        public string Id { get; set; }
        public string DateAdded { get; set; }
        public int FilmId { get; set; }
        public string FilmPosterUrl { get; set; }

        public WatchlistEntryInfoResponse(WatchlistEntry Entry)
        {
            this.Id = Entry.Id.ToString();
            this.DateAdded = Entry.DateAdded.ToString("dd/MM/yyyy HH:mm");
            this.FilmId = Entry.FilmId;
            this.FilmPosterUrl = Entry.FilmPosterUrl;
        }
    }

    public class UserWatchedFilmResponse
    {
        public string DateWatched { get; set; }
        public int TimesWatched { get; set; }

        public UserWatchedFilmResponse(UserWatchedFilm UWF)
        {
            this.DateWatched = UWF.DateWatched.ToString("dd/MM/yyyy HH:mm");
            this.TimesWatched = UWF.TimesWatched;
        }
    }
}
