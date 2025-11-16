using Heteroboxd.Models.Enums;

namespace Heteroboxd.Models.DTO
{
    public class CelebrityInfoResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public string PictureUrl { get; set; }
        public List<CelebrityCreditInfoResponse> Credits { get; set; }

        //when viewed from film page, we don't need film info in credits (nor other films)
        public CelebrityInfoResponse(Celebrity Celebrity)
        {
            this.Id = Celebrity.Id;
            this.Name = Celebrity.Name;
            this.Description = Celebrity.Description;
            this.PictureUrl = Celebrity.PictureUrl;

            this.Credits = Celebrity.Credits
                .Select(c => new CelebrityCreditInfoResponse(c))
                .ToList();
        }

        //when viewed from celebrity page, we need full film info in credits (per role)
        public CelebrityInfoResponse(Celebrity Celebrity, IEnumerable<Film> Films)
        {
            this.Id = Celebrity.Id;
            this.Name = Celebrity.Name;
            this.Description = Celebrity.Description;
            this.PictureUrl = Celebrity.PictureUrl;

            var FilmDict = Films.ToDictionary(f => f.Id, f => f);
            this.Credits = Celebrity.Credits
                .Where(c => FilmDict.ContainsKey(c.FilmId))
                .Select(c => new CelebrityCreditInfoResponse(c, FilmDict[c.FilmId]))
                .ToList();
        }
    }

    public class CelebrityCreditInfoResponse
    {
        public int? CelebrityId { get; set; }
        public int? FilmId { get; set; }
        public string? FilmTitle { get; set; }
        public string? FilmPosterUrl { get; set; }
        public string? FilmReleaseDate { get; set; }
        public string Role { get; set; }
        public string? Character { get; set; }

        public CelebrityCreditInfoResponse(CelebrityCredit Credit, Film Film)
        {
            this.CelebrityId = Credit.CelebrityId;
            this.FilmId = Film.Id;
            this.FilmTitle = Film.Title;
            this.FilmPosterUrl = Film.PosterUrl;
            this.FilmReleaseDate = Film.ReleaseYear.ToString();
            this.Role = Credit.Role.ToString();
        }

        public CelebrityCreditInfoResponse(CelebrityCredit Role)
        {
            this.Role = Role.Role.ToString();
            this.Character = Role.Character;
        }
    }
}
