using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Service
{
    public interface ICelebrityService
    {
        Task<List<CelebrityInfoResponse>> GetAllCelebrities();
        Task<CelebrityInfoResponse?> GetCelebrityById(string CelebrityId);
        Task<List<CelebrityInfoResponse>> GetCelebritiesByFilm(string FilmId);
        Task<List<CelebrityInfoResponse>> SearchCelebrities(string Search);
        Task UpdateCelebrity(UpdateCelebrityRequest CelebrityRequest);
        Task LogicalDeleteCelebrity(string CelebrityId);
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

        public async Task<List<CelebrityInfoResponse>> GetAllCelebrities()
        {
            var AllCelebrities = await _repo.GetAllAsync();
            return AllCelebrities.Select(c => new CelebrityInfoResponse(c)).ToList();
        }

        public async Task<CelebrityInfoResponse?> GetCelebrityById(string CelebrityId)
        {
            var Celebrity = await _repo.GetById(Guid.Parse(CelebrityId));
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

        public async Task<List<CelebrityInfoResponse>> GetCelebritiesByFilm(string FilmId)
        {
            var Celebrities = await _repo.GetByFilm(Guid.Parse(FilmId));
            return Celebrities.Select(c => new CelebrityInfoResponse(c)).ToList();
        }

        public async Task<List<CelebrityInfoResponse>> SearchCelebrities(string Search)
        {
            var SearchResults = await _repo.SearchAsync(Search);
            return SearchResults.Select(c => new CelebrityInfoResponse(c)).ToList();
        }

        public async Task UpdateCelebrity(UpdateCelebrityRequest CelebrityRequest)
        {
            var Celebrity = await _repo.GetById(Guid.Parse(CelebrityRequest.Id));
            if (Celebrity == null) throw new KeyNotFoundException();
            if (CelebrityRequest.Name != null)
            {
                Celebrity.Name = CelebrityRequest.Name;
                Celebrity.NameLocked = true;
            }
            if (CelebrityRequest.Description != null)
            {
                Celebrity.Description = CelebrityRequest.Description;
                Celebrity.DescriptionLocked = true;
            }
            if (CelebrityRequest.PictureUrl != null)
            {
                Celebrity.PictureUrl = CelebrityRequest.PictureUrl;
                Celebrity.PictureUrlLocked = true;
            }
            _repo.Update(Celebrity);
            await _repo.SaveChangesAsync();
        }

        public async Task LogicalDeleteCelebrity(string CelebrityId)
        {
            var Celebrity = await _repo.GetById(Guid.Parse(CelebrityId));
            if (Celebrity == null) throw new KeyNotFoundException();
            Celebrity.Deleted = true;
            _repo.Update(Celebrity);
            await _repo.SaveChangesAsync();
        }
    }
}
