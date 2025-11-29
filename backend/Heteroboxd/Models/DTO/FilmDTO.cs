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
        public string Slug { get; set; }
        public int FavoriteCount { get; set; }
        public int? WatchCount { get; set; }
        public Dictionary<int, string>? Collection { get; set; }

        //BIG PROPERTY -> used ONLY on the film details page, NOWHERE ELSE!!!
        public List<CelebrityCreditInfoResponse>? CastAndCrew { get; set; }

        public FilmInfoResponse(Film Film, bool IncludeWatchCount = true, bool IncludeCredits = false)
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
            this.Slug = Film.Slug;
            this.FavoriteCount = Film.FavoriteCount;
            if (IncludeWatchCount) this.WatchCount = Film.WatchedBy.Count();
            else this.WatchCount = null;
            this.Collection = Film.Collection;

            if (IncludeCredits && Film.CastAndCrew != null)
            {
                this.CastAndCrew = Film.CastAndCrew
                    .Select(c => new CelebrityCreditInfoResponse(c))
                    .ToList();
            }
            else this.CastAndCrew = null;
        }
    }

    public class PagedFilmInfoResponse
    {
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public List<FilmInfoResponse> Films { get; set; }
    }

    public class PagedWatchlistResponse
    {
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public List<WatchlistEntryInfoResponse> Entries { get; set; }
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
