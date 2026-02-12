using Heteroboxd.Models.DTO;
using Newtonsoft.Json;

namespace Heteroboxd.Integrations
{
    public interface ITMDBClient
    {
        Task<TMDBInfoResponse> FilmDetailsCall(int? TmdbId);
        Task<TMDBCollectionResponse> CollectionDetailsCall(int? TmdbId);
        Task<TMDBCelebrityResponse> CelebrityDetailsCall(int? TmdbId);
        Task<List<TMDBCountryResponse>> CountryConfigurationCall();
    }
    public class TMDBClient : ITMDBClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<TMDBClient> _logger;
        private readonly IConfiguration _configuration;

        public TMDBClient(HttpClient httpClient, ILogger<TMDBClient> logger, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<TMDBInfoResponse> FilmDetailsCall(int? TmdbId)
        {
            _logger.LogInformation($"Calling the GET /details/ endpoint for Film of TmdbID: {TmdbId}");
            try
            {
                var Response = await _httpClient.GetAsync($"{_configuration["TMDB:BaseUrl"]}/movie/{TmdbId!}?append_to_response=credits");
                Response.EnsureSuccessStatusCode();

                var Json = await Response.Content.ReadAsStringAsync();
                var Result = JsonConvert.DeserializeObject<TMDBInfoResponse>(Json)!;

                //keep only top 50 cast members
                if (Result?.credits?.cast != null && Result.credits.cast.Count > 50)
                {
                    Result.credits.cast = Result.credits.cast
                                             .OrderBy(c => c.order)
                                             .Take(50)
                                             .ToList();
                }
                //filter and map crew members
                if (Result?.credits?.crew != null)
                {
                    var FilteredCrew = new List<CrewMember>();
                    foreach (var Crewer in Result.credits.crew)
                    {
                        if (Crewer == null || Crewer.id == null) continue;
                        switch (Crewer.job?.ToLower())
                        {
                            case "director":
                            case "producer":
                            case "screenplay":
                            case "writer":
                            case "story":
                            case "original music composer":
                                FilteredCrew.Add(Crewer);
                                break;
                            default:
                                continue;
                        }
                    }
                    Result.credits.crew = FilteredCrew;
                }
                return Result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex}");
                throw;
            }
        }

        public async Task<TMDBCollectionResponse> CollectionDetailsCall(int? TmdbId)
        {
            _logger.LogInformation($"Calling the GET /details/ endpoint for Collection of TmdbID: {TmdbId}");
            try
            {
                var Response = await _httpClient.GetAsync($"{_configuration["TMDB:BaseUrl"]}/collection/{TmdbId!}");
                Response.EnsureSuccessStatusCode();

                var Json = await Response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<TMDBCollectionResponse>(Json)!;
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex}");
                throw;
            }
        }

        public async Task<TMDBCelebrityResponse> CelebrityDetailsCall(int? TmdbId)
        {
            _logger.LogInformation($"Calling the GET /details/ endpoint for Celebrity of TmdbID: {TmdbId}");
            try
            {
                var Response = await _httpClient.GetAsync($"{_configuration["TMDB:BaseUrl"]}/person/{TmdbId!}");
                Response.EnsureSuccessStatusCode();

                var Json = await Response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<TMDBCelebrityResponse>(Json)!;
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex}");
                throw;
            }
        }

        public async Task<List<TMDBCountryResponse>> CountryConfigurationCall()
        {
            _logger.LogInformation($"Calling the GET /configuration/ endpoint for Countries");
            try
            {
                var Response = await _httpClient.GetAsync($"{_configuration["TMDB:BaseUrl"]}/configuration/countries?language=en-US");
                Response.EnsureSuccessStatusCode();

                var Json = await Response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<List<TMDBCountryResponse>>(Json)!;
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex}");
                throw;
            }
        }
    }
}
