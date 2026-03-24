using Heteroboxd.Shared.Models.DTO;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace Heteroboxd.Shared.Integrations
{
    public sealed class RateLimiter
    {
        private readonly SemaphoreSlim _semaphore;
        private readonly TimeSpan _window;

        public RateLimiter(int maxPerWindow, TimeSpan window)
        {
            _semaphore = new SemaphoreSlim(maxPerWindow, maxPerWindow);
            _window = window;
        }

        public async Task ThrottleAsync()
        {
            await _semaphore.WaitAsync();
            _ = Task.Delay(_window).ContinueWith(_ => _semaphore.Release());
        }
    }
    public interface ITMDBClient
    {
        Task<TMDBInfoResponse?> FilmDetailsCall(int? TmdbId);
        Task<TMDBCollectionResponse> CollectionDetailsCall(int? TmdbId);
        Task<TMDBCelebrityResponse> CelebrityDetailsCall(int? TmdbId);
        Task<List<TMDBCountryResponse>> CountryConfigurationCall();
        Task<TMDBChangesResponse> ChangesListCall(string Path, int Page);
        Task<TMDBTrendingResponse> TrendingFilmsCall();
    }
    public class TMDBClient : ITMDBClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<TMDBClient> _logger;
        private readonly IConfiguration _configuration;
        private static readonly RateLimiter _rateLimiter = new(40, TimeSpan.FromSeconds(1));

        public TMDBClient(HttpClient httpClient, ILogger<TMDBClient> logger, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<TMDBInfoResponse?> FilmDetailsCall(int? TmdbId)
        {
            try
            {
                await _rateLimiter.ThrottleAsync();
                _logger.LogInformation($"Calling the GET /details/ endpoint for Film of TmdbID: {TmdbId}");
                var Response = await _httpClient.GetAsync($"{_configuration["TMDB:BaseUrl"]}/movie/{TmdbId!}?append_to_response=credits");
                try
                {
                    Response.EnsureSuccessStatusCode();
                }
                catch
                {
                    return null;
                }

                var Json = await Response.Content.ReadAsStringAsync();
                var Result = JsonConvert.DeserializeObject<TMDBInfoResponse>(Json)!;

                if (Result == null || string.IsNullOrEmpty(Result.poster_path) || (Result.runtime < 40 && Result.vote_count < 500)) return null;
                if (Result.credits?.cast?.Any() != true || Result.credits?.crew?.Any() != true) return null;

                //scale kept cast according to popularity
                int Count = Math.Min(Result.credits.cast.Count, Result.vote_count > 5000 ? 50 : 25);
                Result.credits.cast = Result.credits.cast
                    .OrderBy(c => c.order)
                    .Take(Count)
                    .ToList();
                //filter and map crew members
                var FilteredCrew = new List<CrewMember>();
                foreach (var Crewer in Result.credits.crew)
                {
                    if (Crewer?.id == null) continue;
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

                return Result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex}");
                return null;
            }
        }

        public async Task<TMDBCollectionResponse> CollectionDetailsCall(int? TmdbId)
        {
            try
            {
                await _rateLimiter.ThrottleAsync();
                _logger.LogInformation($"Calling the GET /details/ endpoint for Collection of TmdbID: {TmdbId}");
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
            try
            {
                await _rateLimiter.ThrottleAsync();
                _logger.LogInformation($"Calling the GET /details/ endpoint for Celebrity of TmdbID: {TmdbId}");
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
            try
            {
                await _rateLimiter.ThrottleAsync();
                _logger.LogInformation($"Calling the GET /configuration/ endpoint for Countries");
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

        public async Task<TMDBChangesResponse> ChangesListCall(string Path, int Page)
        {
            try
            {
                await _rateLimiter.ThrottleAsync();
                _logger.LogInformation($"Calling the GET /changes/ endpoint for {Path} at Page: {Page}");
                var Response = await _httpClient.GetAsync($"{_configuration["TMDB:BaseUrl"]}/{Path}/changes?page={Page}");
                Response.EnsureSuccessStatusCode();

                var Json = await Response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<TMDBChangesResponse>(Json)!;
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex}");
                throw;
            }
        }

        public async Task<TMDBTrendingResponse> TrendingFilmsCall()
        {
            try
            {
                await _rateLimiter.ThrottleAsync();
                _logger.LogInformation("Calling the GET /trending/ endpoint");
                var Response = await _httpClient.GetAsync($"{_configuration["TMDB:BaseUrl"]}/movie/popular");
                Response.EnsureSuccessStatusCode();

                var Json = await Response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<TMDBTrendingResponse>(Json)!;
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex}");
                throw;
            }
        }
    }
}
