using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Models.Enums;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface ICelebrityService
    {
        Task<CelebrityInfoResponse> GetCelebrity(int CelebrityId);
        Task<PagedResponse<FilmInfoResponse>> GetCreditsDelimited(int CelebrityId, string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<PagedResponse<CelebrityInfoResponse>> SearchCelebrities(string Search, int Page, int PageSize);
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

        public async Task<PagedResponse<FilmInfoResponse>> GetCreditsDelimited(int CelebrityId, string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null)
            {
                var (Films, TotalCount, _, _) = await _repo.GetCreditsAsync(CelebrityId, null, Page, PageSize, (Role)Enum.Parse(typeof(Role), Filter), Sort, Desc, FilterValue);
                return new PagedResponse<FilmInfoResponse>
                {
                    TotalCount = TotalCount,
                    Page = Page,
                    PageSize = PageSize,
                    Items = Films.Select(f => new FilmInfoResponse(f)).ToList()
                };
            }
            else
            {
                var (Films, TotalCount, Seen, SeenCount) = await _repo.GetCreditsAsync(CelebrityId, Guid.Parse(UserId), Page, PageSize, (Role)Enum.Parse(typeof(Role), Filter), Sort, Desc, FilterValue);
                return new PagedResponse<FilmInfoResponse>
                {
                    TotalCount = TotalCount,
                    Page = Page,
                    PageSize = PageSize,
                    Items = Films.Select(f => new FilmInfoResponse(f)).ToList(),
                    Seen = Seen.Select(uwf => uwf.FilmId).ToList(),
                    SeenCount = SeenCount!.Value
                };
            }
        }

        public async Task<PagedResponse<CelebrityInfoResponse>> SearchCelebrities(string Search, int Page, int PageSize)
        {
            var (Results, TotalCount) = await _repo.SearchAsync(Search.ToLower(), Page, PageSize);
            return new PagedResponse<CelebrityInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = Results.Select(c => new CelebrityInfoResponse(c)).ToList()
            };
        }
    }
}
