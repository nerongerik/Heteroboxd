namespace Heteroboxd.Models.DTO
{
    public class FilmInfoResponse
    {
        public string FilmId { get; set; }
        public string Title { get; set; }
        public string? OriginalTitle { get; set; }
        public string Synopsis { get; set; }
        public string PosterUrl { get; set; }
        public string? BackdropUrl { get; set; }
        public string? TrailerUrl { get; set; }
        public int Length { get; set; }
        public int ReleaseYear { get; set; }
        public string Slug { get; set; }
        public int FavoriteCount { get; set; }
        public int? WatchCount { get; set; }

        public FilmInfoResponse(Film Film, bool IncludeWatchCount = true)
        {
            this.FilmId = Film.Id.ToString();
            this.Title = Film.Title;
            this.OriginalTitle = Film.OriginalTitle;
            this.Synopsis = Film.Synopsis;
            this.PosterUrl = Film.PosterUrl;
            this.BackdropUrl = Film.BackdropUrl;
            this.Length = Film.Length;
            this.ReleaseYear = Film.ReleaseYear;
            this.Slug = Film.Slug;
            this.FavoriteCount = Film.FavoriteCount;
            if (IncludeWatchCount) this.WatchCount = Film.WatchedBy.Count();
            else this.WatchCount = null;
        }
    }

    public class UpdateFilmRequest
    {
        public string FilmId { get; set; }
        public string? Title { get; set; }
        public string? Synopsis { get; set; }
        public string? PosterUrl { get; set; }
        public string? BackdropUrl { get; set; }
    }

    public class FilmSearchRequest
    {
        public string? Title { get; set; }
        public string? OriginalTitle { get; set; }
    }

    public class PagedFilmInfoResponse
    {
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public List<FilmInfoResponse> Films { get; set; }
    }
}
