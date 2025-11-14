using Heteroboxd.Models.DTO;

namespace Heteroboxd.Integrations
{
    public interface ITMDBClient
    {
        Task<TMDBInfoResponse> MovieDetailsCall(int? TmdbId);
        Task<TMDBCollectionResponse> CollectionDetailsCall(int? TmdbId);
        Task<TMDBCelebrityResponse> CelebrityDetailsCall(int? TmdbId);
    }
    public class TMDBClient : ITMDBClient
    {
        private readonly ILogger<TMDBClient> _logger;
        private readonly IConfiguration _configuration;

        public TMDBClient(ILogger<TMDBClient> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<TMDBInfoResponse> MovieDetailsCall(int? TmdbId)
        {
            // Implementation for calling TMDB API to get movie details
            throw new NotImplementedException();
        }

        public async Task<TMDBCollectionResponse> CollectionDetailsCall(int? TmdbId)
        {
            // Implementation for calling TMDB API to get collection details
            throw new NotImplementedException();
        }

        public async Task<TMDBCelebrityResponse> CelebrityDetailsCall(int? TmdbId)
        {
            // Implementation for calling TMDB API to get celebrity details
            throw new NotImplementedException();
        }
    }
}
