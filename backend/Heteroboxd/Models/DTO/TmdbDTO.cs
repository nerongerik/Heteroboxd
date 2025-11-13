namespace Heteroboxd.Models.DTO
{
    /*
    MAIN TMDB RESPONSE CLASSES
    */

    public class TMDBInfoResponse
    {
        public bool? Adult { get; set; }
        public string? BackdropPath { get; set; }
        public Collection? BelongsToCollection { get; set; }
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
    }

    public class TMDBCollectionResponse
    {
        public int? Id { get; set; }
        public string? Name { get; set; }
        public string? OriginalLanguage { get; set; }
        public string? OriginalName { get; set; }
        public string? Overview { get; set; }
        public string? PosterPath { get; set; }
        public string? BackdropPath { get; set; }

        public List<CollectionPart>? Parts { get; set; }
    }

    public class TMDBCelebrityResponse
    {
        public bool? Adult { get; set; }
        public List<string>? AlsoKnownAs { get; set; }
        public string? Biography { get; set; }
        public string? Birthday { get; set; }
        public string? Deathday { get; set; }
        public int? Gender { get; set; }
        public string? Homepage { get; set; }
        public int? Id { get; set; }
        public string? ImdbId { get; set; }
        public string? KnownForDepartment { get; set; }
        public string? Name { get; set; }
        public string? PlaceOfBirth { get; set; }
        public double? Popularity { get; set; }
        public string? ProfilePath { get; set; }
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

    public class Collection
    {
        public int? Id { get; set; }
        public string? Name { get; set; }
        public string? PosterPath { get; set; }
        public string? BackdropPath { get; set; }
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

    public class CollectionPart
    {
        public bool? Adult { get; set; }
        public string? BackdropPath { get; set; }
        public int? Id { get; set; }
        public string? Title { get; set; }
        public string? OriginalTitle { get; set; }
        public string? Overview { get; set; }
        public string? PosterPath { get; set; }
        public string? MediaType { get; set; }
        public string? OriginalLanguage { get; set; }
        public List<int>? GenreIds { get; set; }
        public double? Popularity { get; set; }
        public string? ReleaseDate { get; set; }
        public bool? Video { get; set; }
        public double? VoteAverage { get; set; }
        public int? VoteCount { get; set; }
    }
}
