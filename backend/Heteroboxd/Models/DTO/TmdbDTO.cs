namespace Heteroboxd.Models.DTO
{
    /*
    MAIN TMDB RESPONSE CLASSES
    */

    public class TMDBInfoResponse
    {
        public bool? adult { get; set; }
        public string? backdrop_path { get; set; }
        public Collection? belongs_to_collection { get; set; }
        public int? budget { get; set; }
        public List<Genre>? genres { get; set; }
        public string? homepage { get; set; }
        public int? id { get; set; }
        public string? imdb_id { get; set; }
        public List<string>? origin_country { get; set; }
        public string? original_language { get; set; }
        public string? original_title { get; set; }
        public string? overview { get; set; }
        public double? popularity { get; set; }
        public string? poster_path { get; set; }
        public List<ProductionCompany>? production_companies { get; set; }
        public List<ProductionCountry>? production_countries { get; set; }
        public string? release_date { get; set; }
        public long? revenue { get; set; }
        public int? runtime { get; set; }
        public List<SpokenLanguage>? spoken_languages { get; set; }
        public string? status { get; set; }
        public string? tagline { get; set; }
        public string? title { get; set; }
        public bool? video { get; set; }
        public double? vote_average { get; set; }
        public int? vote_count { get; set; }

        //include credits
        public Credits? credits { get; set; }
    }

    public class TMDBCollectionResponse
    {
        public int? id { get; set; }
        public string? name { get; set; }
        public string? original_language { get; set; }
        public string? original_name { get; set; }
        public string? overview { get; set; }
        public string? poster_path { get; set; }
        public string? backdrop_path { get; set; }

        public List<CollectionPart>? parts { get; set; }
    }

    public class TMDBCelebrityResponse
    {
        public bool? adult { get; set; }
        public List<string>? also_known_as { get; set; }
        public string? biography { get; set; }
        public string? birthday { get; set; }
        public string? deathday { get; set; }
        public int? gender { get; set; }
        public string? homepage { get; set; }
        public int? id { get; set; }
        public string? imdb_id { get; set; }
        public string? known_for_department { get; set; }
        public string? name { get; set; }
        public string? place_of_birth { get; set; }
        public double? popularity { get; set; }
        public string? profile_path { get; set; }
    }

    /*
    HELPER CLASSES FOR TMDB INTEGRATION 
    */

    public class Genre
    {
        public int? id { get; set; }
        public string? name { get; set; }
    }

    public class ProductionCompany
    {
        public int? id { get; set; }
        public string? logo_path { get; set; }
        public string? name { get; set; }
        public string? origin_country { get; set; }
    }

    public class ProductionCountry
    {
        public string? iso_3166_1 { get; set; }
        public string? name { get; set; }
    }

    public class SpokenLanguage
    {
        public string? english_name { get; set; }
        public string? iso_639_1 { get; set; }
        public string? name { get; set; }
    }

    public class Collection
    {
        public int? id { get; set; }
        public string? name { get; set; }
        public string? poster_path { get; set; }
        public string? backdrop_path { get; set; }
    }

    /*
    WE WILL BE APPENDING CREDITS TO RESPONSE WHEN REQUESTING
    */

    public class Credits
    {
        public List<CastMember>? cast { get; set; }
        public List<CrewMember>? crew { get; set; }
    }

    public class CastMember
    {
        public bool? adult { get; set; }
        public int? gender { get; set; }
        public int? id { get; set; }
        public string? known_for_department { get; set; }
        public string? name { get; set; }
        public string? original_name { get; set; }
        public double? popularity { get; set; }
        public string? profile_path { get; set; }
        public int? cast_id { get; set; }
        public string? character { get; set; }
        public string? credit_id { get; set; }
        public int? order { get; set; }
    }

    public class CrewMember
    {
        public bool? adult { get; set; }
        public int? gender { get; set; }
        public int? id { get; set; }
        public string? known_for_department { get; set; }
        public string? name { get; set; }
        public string? original_name { get; set; }
        public double? popularity { get; set; }
        public string? profile_path { get; set; }
        public string? credit_id { get; set; }
        public string? department { get; set; }
        public string? job { get; set; }
    }

    public class CollectionPart
    {
        public bool? adult { get; set; }
        public string? backdrop_path { get; set; }
        public int? id { get; set; }
        public string? title { get; set; }
        public string? original_title { get; set; }
        public string? overview { get; set; }
        public string? poster_path { get; set; }
        public string? media_type { get; set; }
        public string? original_language { get; set; }
        public List<int>? genre_ids { get; set; }
        public double? popularity { get; set; }
        public string? release_date { get; set; }
        public bool? video { get; set; }
        public double? vote_average { get; set; }
        public int? vote_count { get; set; }
    }
}
