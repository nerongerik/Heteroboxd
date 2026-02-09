using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Models.Enums;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface ICelebrityService
    {
        Task<CelebrityInfoResponse> GetCelebrity(int CelebrityId);
        Task<PagedResponse<FilmInfoResponse>> GetCreditsDelimited(int CelebrityId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<List<CelebrityInfoResponse>> SearchCelebrities(string Search);
    }

    public class CelebrityService : ICelebrityService
    {
        private readonly ICelebrityRepository _repo;

        public CelebrityService(ICelebrityRepository repo)
        {
            _repo = repo;
        }

        public async Task<CelebrityInfoResponse> GetCelebrity(int CelebrityId)
        {
            Celebrity? Celebrity = await _repo.GetByIdAsync(CelebrityId);
            if (Celebrity == null) throw new KeyNotFoundException();

            var Roles = Celebrity.Credits
                .Select(c => c.Role.ToString())
                .Distinct()
                .ToList();

            return new CelebrityInfoResponse(Celebrity, Roles);
        }

        public async Task<PagedResponse<FilmInfoResponse>> GetCreditsDelimited(int CelebrityId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var (Films, TotalCount) = await _repo.GetCreditsAsync(CelebrityId, Page, PageSize, (Role)Enum.Parse(typeof(Role), Filter), Sort, Desc, FilterValue);
            return new PagedResponse<FilmInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = Films.Select(f => new FilmInfoResponse(f)).ToList()
            };
        }

        public async Task<List<CelebrityInfoResponse>> SearchCelebrities(string Search)
        {
            var SearchResults = await _repo.SearchAsync(Search.ToLower());
            return SearchResults.Select(c => new CelebrityInfoResponse(c)).ToList();
        }
    }
}
