namespace Heteroboxd.Models.DTO
{

    public class CelebrityInfoResponse
    {
        public int CelebrityId { get; set; }
        public string CelebrityName { get; set; }
        public string? CelebrityDescription { get; set; }
        public string? CelebrityPictureUrl { get; set; }
        public List<string>? Roles { get; set; } //Enum.ToString() for all the Roles appearing in their credits

        public CelebrityInfoResponse(Celebrity Celebrity, List<string>? Roles = null)
        {
            this.CelebrityId = Celebrity.Id;
            this.CelebrityName = Celebrity.Name;
            this.CelebrityDescription = Celebrity.Description;
            this.CelebrityPictureUrl = Celebrity.PictureUrl;
            this.Roles = Roles;
        }
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
