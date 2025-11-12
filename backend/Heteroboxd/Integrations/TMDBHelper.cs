using Heteroboxd.Models;
using Heteroboxd.Models.DTO;

namespace Heteroboxd.Integrations
{
    public class TMDBHelper
    {
        //either inject or import and initialize the TMDBClient class instance here, as it is in charge of forming film, collection, and celebrity requests

        public static Film ParseFilm(TMDBInfoResponse Response)
        {
            //parses the main response from TMDB into Film

        }

        public static List<CelebrityCredit> ParseCreditsResponse(Credits Credits, Guid FilmId)
        {
            //parses the credits response from TMDB into list of CelebrityCredit
        }

        public static Celebrity ParseCelebrity(CastMember? CastResponse, CrewMember? CrewResponse)
        {
            //parses the celebrity response from TMDB into Celebrity, possibly making additional API calls for more details.
            //either CastResponse or CrewResponse will be provided, not both
        }

        public static string FormUrls(string Path, int type = 0)
        {
            /*
            parses different types of relative paths into full urls
            0 - poster
            1 - backdrop
            2 - trailer
            */
        }

        public static List<Guid> FormCollection(string CollectionTmdbId)
        {
            //makes another call to TMDB to get collection info, returns a list of films that we either take from our DB or create new entries for
        }

        public static string GenerateSlug(string Title, int ReleaseYear)
        {
            //generates a unique slug for the film based on title and release year
        }
    }
}
