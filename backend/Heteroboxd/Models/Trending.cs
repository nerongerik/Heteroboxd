using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Trending
    {
        [Key]
        public int FilmId { get; set; }
        public string Title { get; set; }
        public string PosterUrl { get; set; }
        public int Rank { get; set; }

        public Trending() { }
        public Trending(Film Film, int Rank)
        {
            this.FilmId = Film.Id;
            this.Title = Film.Title;
            this.PosterUrl = Film.PosterUrl;
            this.Rank = Rank;
        }
    }
}