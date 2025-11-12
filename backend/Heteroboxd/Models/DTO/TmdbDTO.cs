namespace Heteroboxd.Models.DTO
{
    /*
    MAIN TMDB RESPONSE CLASS  
    */

    public class TMDBInfoResponse
    {
        public bool? Adult { get; set; }
        public string? BackdropPath { get; set; }
        public object? BelongsToCollection { get; set; }
        public int? Budget { get; set; }
        public List<Genre>? Genres { get; set; }
        public string? Homepage { get; set; }
        public int? Id { get; set; }
        public string? ImdbId { get; set; }
        public string? OriginalLanguage { get; set; }
        public string? OriginalTitle { get; set; }
        public string? Overview { get; set; }
        public double? Popularity { get; set; }
        public string? PosterPath { get; set; }
        public List<ProductionCompany>? ProductionCompanies { get; set; }
        public List<ProductionCountry>? ProductionCountries { get; set; }
        public string? ReleaseDate { get; set; }
        public long? Revenue { get; set; }
        public int? Runtime { get; set; }
        public List<SpokenLanguage>? SpokenLanguages { get; set; }
        public string? Status { get; set; }
        public string? Tagline { get; set; }
        public string? Title { get; set; }
        public bool? Video { get; set; }
        public double? VoteAverage { get; set; }
        public int? VoteCount { get; set; }

        //include credits
        public Credits? Credits { get; set; }
        //include videos for trailer
        public Videos? Videos { get; set; }
    }

    /*
    HELPER CLASSES FOR TMDB INTEGRATION 
    */

    public class Genre
    {
        public int? Id { get; set; }
        public string? Name { get; set; }
    }

    public class ProductionCompany
    {
        public int? Id { get; set; }
        public string? LogoPath { get; set; }
        public string? Name { get; set; }
        public string? OriginCountry { get; set; }
    }

    public class ProductionCountry
    {
        public string? Iso31661 { get; set; }
        public string? Name { get; set; }
    }

    public class SpokenLanguage
    {
        public string? EnglishName { get; set; }
        public string? Iso6391 { get; set; }
        public string? Name { get; set; }
    }

    /*
    WE WILL BE APPENDING CREDITS TO RESPONSE WHEN REQUESTING
    */

    public class Credits
    {
        public List<CastMember>? Cast { get; set; }
        public List<CrewMember>? Crew { get; set; }
    }

    public class CastMember
    {
        public int? CastId { get; set; }
        public string? Character { get; set; }
        public string? CreditId { get; set; }
        public int? Gender { get; set; }
        public int? Id { get; set; }
        public string? Name { get; set; }
        public int? Order { get; set; }
        public string? ProfilePath { get; set; }
    }

    public class CrewMember
    {
        public string? CreditId { get; set; }
        public string? Department { get; set; }
        public int? Gender { get; set; }
        public int? Id { get; set; }
        public string? Job { get; set; }
        public string? Name { get; set; }
        public string? ProfilePath { get; set; }
    }

    /*
    WE WILL BE APPENDING VIDEOS TO RESPONSE WHEN REQUESTING
    */

    public class Videos
    {
        public string? Id { get; set; }
        public string? Key { get; set; }
        public string? Name { get; set; }
        public string? Site { get; set; }
        public string? Type { get; set; }
        public bool? Official { get; set; }
    }
}
