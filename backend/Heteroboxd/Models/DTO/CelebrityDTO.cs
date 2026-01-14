namespace Heteroboxd.Models.DTO
{

    public class CelebrityInfoResponse
    {
        public int CelebrityId { get; set; }
        public string CelebrityName { get; set; }
        public string? CelebrityDescription { get; set; }
        public string? CelebrityPictureUrl { get; set; }

        public CelebrityInfoResponse(Celebrity Celebrity)
        {
            this.CelebrityId = Celebrity.Id;
            this.CelebrityName = Celebrity.Name;
            this.CelebrityDescription = Celebrity.Description;
            this.CelebrityPictureUrl = Celebrity.PictureUrl;
        }
    }

    public class CelebrityDelimitedResponse
    {
        public CelebrityInfoResponse BaseCeleb { get; set; }
        public PagedFilmResponse Starred { get; set; }
        public PagedFilmResponse Directed { get; set; }
        public PagedFilmResponse Produced { get; set; }
        public PagedFilmResponse Wrote { get; set; }
        public PagedFilmResponse Composed { get; set; }
    }

    public class CelebrityCreditInfoResponse
    {
        public int? CelebrityId { get; set; }
        public string? CelebrityName { get; set; }
        public string? CelebrityPictureUrl { get; set; }
        public string Role { get; set; }
        public string? Character { get; set; }
        public int? Order { get; set; }

        public CelebrityCreditInfoResponse(CelebrityCredit Role)
        {
            this.CelebrityId = Role.CelebrityId;
            this.CelebrityName = Role.CelebrityName;
            this.CelebrityPictureUrl = Role.CelebrityPictureUrl;
            this.Role = Role.Role.ToString();
            this.Character = Role.Character;
            this.Order = Role.Order;
        }
    }
}
