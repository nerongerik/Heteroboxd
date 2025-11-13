

namespace Heteroboxd.Integrations
{
    public interface ITMDBClient
    {
        //forms and sends tMDB API requests, handles the returned responses (are they in-memory or do we need to deserialize JSON?????)
    }
    public class TMDBClient : ITMDBClient
    {
        private readonly ILogger<TMDBClient> _logger;
        private readonly IConfiguration _configuration;
        //private readonly ITMDBHelper _tmdbHelper;

        public TMDBClient(ILogger<TMDBClient> logger, IConfiguration configuration/*, ITMDBHelper tmdbHelper*/)
        {
            _logger = logger;
            _configuration = configuration;
            //_tmdbHelper = tmdbHelper;
        }

        //forms and sends tMDB API requests, handles the returned responses (are they in-memory or do we need to deserialize JSON?????)
    }
}
