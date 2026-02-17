using Heteroboxd.Data;
using Heteroboxd.Integrations;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Background
{
    public class FilmSyncService : BackgroundService
    {
        private readonly ILogger<FilmSyncService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly TimeSpan _scheduledTime = new TimeSpan(15, 0, 0);

        public FilmSyncService(ILogger<FilmSyncService> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken CancellationToken)
        {
            _logger.LogInformation("Film Syncing Service started.");
            while (!CancellationToken.IsCancellationRequested)
            {
                TimeSpan Delay = CalculateDelay();
                _logger.LogInformation($"Next run scheduled in {Delay.TotalHours:F2} hours.");

                await Task.Delay(Delay, CancellationToken);

                if (!CancellationToken.IsCancellationRequested) await ExecuteFilmSync(CancellationToken);
            }
        }

        private TimeSpan CalculateDelay()
        {
            DateTime Now = DateTime.UtcNow;
            DateTime NextRun = Now.Date + _scheduledTime;

            if (Now > NextRun)
            {
                NextRun = NextRun.AddDays(1);
            }

            return NextRun - Now;
        }

        private async Task ExecuteFilmSync(CancellationToken CancellationToken)
        {
            try
            {
                _logger.LogInformation($"Starting daily tasks at {DateTime.UtcNow}.");

                using (var _scope = _scopeFactory.CreateScope())
                {
                    HeteroboxdContext _context = _scope.ServiceProvider.GetRequiredService<HeteroboxdContext>();
                    ITMDBClient _client = _scope.ServiceProvider.GetRequiredService<ITMDBClient>();
                    ITMDBSerializer _parser = _scope.ServiceProvider.GetRequiredService<ITMDBSerializer>();

                    //fetch changes
                    int Page = 1;
                    List<TMDBChangesResponse> Responses = new List<TMDBChangesResponse>();
                    while (true)
                    {
                        TMDBChangesResponse Response = await _client.ChangesListCall("movie", Page);
                        if (Response.results == null || Response.results.Count == 0) break;
                        Responses.Add(Response);
                        if (Page >= Response.total_pages) break;
                        Page++;
                    }
                    //process changes
                    List<int> DeletedFilms = new List<int>();
                    List<int> UpdatedFilms = new List<int>();
                    foreach (var r in Responses)
                    {
                        DeletedFilms.AddRange(r.results.Where(co => co.adult == null).Select(co => co.id));
                        UpdatedFilms.AddRange(r.results.Where(co => co.adult == false).Select(co => co.id));
                    }
                    //delete films
                    await _context.Films
                        .Where(f => DeletedFilms.Contains(f.Id))
                        .ExecuteDeleteAsync(CancellationToken);
                    //update films
                    var ExistingFilms = await _context.Films
                        .Where(f => UpdatedFilms.Contains(f.Id))
                        .ToListAsync(CancellationToken);
                    foreach (int uf in UpdatedFilms)
                    {
                        try
                        {
                            var Details = await _client.FilmDetailsCall(uf);

                            var NewCastIds = Details.credits?.cast?.Select(c => c.id!.Value).ToList() ?? new();
                            var NewCrewIds = Details.credits?.crew?.Select(c => c.id!.Value).ToList() ?? new();
                            var AllNewIds = NewCastIds.Concat(NewCrewIds).Distinct().ToHashSet();

                            var ExistingCelebs = await _context.Celebrities.Where(c => AllNewIds.Contains(c.Id)).ToListAsync(CancellationToken);
                            var (Film, Celebrities, Credits) = await _parser.ParseResponseInMemory(Details, ExistingCelebs);

                            Film? Existing = ExistingFilms.FirstOrDefault(ef => ef.Id == uf);
                            if (Existing == null) //create new film and handle the associated celebrities, collections, etc.
                            {
                                _context.Films.Add(Film);
                                _context.Celebrities.AddRange(Celebrities);
                                await _context.SaveChangesAsync(); //foreign keys restraints *might* cause CelebrityCredits to crash if Film and Celebs not saved first
                                _context.CelebrityCredits.AddRange(Credits);
                                await _context.SaveChangesAsync();
                            }
                            else //carefully update existing film
                            {   
                                Existing.UpdateFields(Film);
                                _context.Films.Update(Existing);
                                _context.Celebrities.AddRange(Celebrities);
                                await _context.SaveChangesAsync(); //foreign keys restraints *might* cause CelebrityCredits to crash if Film and Celebs not saved first
                                await _context.CelebrityCredits.Where(cc => cc.FilmId == Existing.Id).ExecuteDeleteAsync(CancellationToken);
                                _context.CelebrityCredits.AddRange(Credits);
                                await _context.SaveChangesAsync();
                            }
                        }
                        catch (Exception e)
                        {
                            _logger.LogError(e, $"Error processing film with TMDB ID {uf}.");
                            continue; //silent fail
                        }
                    }

                    _logger.LogInformation("Film sync completed successfully.");
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error occurred while executing film sync.");
            }
        }
    }
}
