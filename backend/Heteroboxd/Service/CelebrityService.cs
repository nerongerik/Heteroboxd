using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Service
{
    public interface ICelebrityService
    {
        Task<CelebrityInfoResponse?> GetCelebrity(int CelebrityId);
        Task<List<CelebrityInfoResponse>> GetCelebritiesByFilm(int FilmId);
        Task<List<CelebrityInfoResponse>> SearchCelebrities(string Search);
    }

    public class CelebrityService : ICelebrityService
    {
        private readonly ICelebrityRepository _repo;
        private readonly IFilmRepository _filmRepo;

        public CelebrityService(ICelebrityRepository repo, IFilmRepository filmRepo)
        {
            _repo = repo;
            _filmRepo = filmRepo;
        }

        public async Task<CelebrityInfoResponse?> GetCelebrity(int CelebrityId)
        {
            var Celebrity = await _repo.GetByIdAsync(CelebrityId);
            if (Celebrity == null) throw new KeyNotFoundException();

            //distill film IDs
            var FilmIds = Celebrity.Credits
                .Select(c => c.FilmId)
                .Distinct()
                .ToList();

            if (!FilmIds.Any()) return new CelebrityInfoResponse(Celebrity);

            //parallel safe async calls
            var FilmTasks = FilmIds.Select(fid => _filmRepo.GetByIdAsync(fid));
            var FilmResults = await Task.WhenAll(FilmTasks);
            var Films = FilmResults.Where(f => f != null).ToList()!;

            return new CelebrityInfoResponse(Celebrity, Films);
        }

        public async Task<List<CelebrityInfoResponse>> GetCelebritiesByFilm(int FilmId)
        {
            var Celebrities = await _repo.GetByFilmAsync(FilmId);
            return Celebrities.Select(c => new CelebrityInfoResponse(c)).ToList();
        }

        public async Task<List<CelebrityInfoResponse>> SearchCelebrities(string Search)
        {
            var SearchResults = await _repo.SearchAsync(Search.ToLower());
            return SearchResults.Select(c => new CelebrityInfoResponse(c)).ToList();
        }
    }
}
