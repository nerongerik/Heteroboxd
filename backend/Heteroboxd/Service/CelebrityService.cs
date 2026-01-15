using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Models.Enums;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface ICelebrityService
    {
        Task<CelebrityDelimitedResponse?> GetCelebrity(int CelebrityId, int StarredPage, int DirectedPage, int ProducedPage, int WrotePage, int ComposedPage, int PageSize);
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

        public async Task<CelebrityDelimitedResponse?> GetCelebrity(int CelebrityId, int StarredPage, int DirectedPage, int ProducedPage, int WrotePage, int ComposedPage, int PageSize)
        {
            Celebrity? Celebrity = await _repo.GetByIdAsync(CelebrityId);
            if (Celebrity == null) throw new KeyNotFoundException();

            int[] UniqueIds = Celebrity.Credits
                .Select(cc => cc.FilmId)
                .Distinct()
                .ToArray();

            var Films = (await _filmRepo.GetByIdsAsync(UniqueIds))
                .Where(f => f != null)
                .ToDictionary(f => f!.Id);

            var CreditsByRole = Celebrity.Credits
                .Where(cc => Films.ContainsKey(cc.FilmId))
                .GroupBy(cc => cc.Role)
                .ToDictionary(g => g.Key, g => g.Select(cc => cc.FilmId).Distinct().ToList());

            return new CelebrityDelimitedResponse
            {
                BaseCeleb = new CelebrityInfoResponse(Celebrity),
                Starred = PaginateFilms(CreditsByRole, Role.Actor, Films, StarredPage, PageSize),
                Directed = PaginateFilms(CreditsByRole, Role.Director, Films, DirectedPage, PageSize),
                Produced = PaginateFilms(CreditsByRole, Role.Producer, Films, ProducedPage, PageSize),
                Wrote = PaginateFilms(CreditsByRole, Role.Writer, Films, WrotePage, PageSize),
                Composed = PaginateFilms(CreditsByRole, Role.Composer, Films, ComposedPage, PageSize)
            };
        }

        public async Task<List<CelebrityInfoResponse>> SearchCelebrities(string Search)
        {
            var SearchResults = await _repo.SearchAsync(Search.ToLower());
            return SearchResults.Select(c => new CelebrityInfoResponse(c)).ToList();
        }

        private PagedResponse<FilmInfoResponse> PaginateFilms(Dictionary<Role, List<int>> CreditsByRole, Role Role, Dictionary<int, Film> Films, int Page, int PageSize)
        {
            if (!CreditsByRole.TryGetValue(Role, out var FilmIds))
            {
                return new PagedResponse<FilmInfoResponse>
                {
                    Items = new List<FilmInfoResponse>(),
                    TotalCount = 0,
                    Page = Page,
                    PageSize = PageSize
                };
            }

            int TotalCount = FilmIds.Count;
            var PagedFilms = FilmIds
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .Select(id => Films.TryGetValue(id, out var Film) ? new FilmInfoResponse(Film) : null)
                .Where(f => f != null)
                .ToList();

            return new PagedResponse<FilmInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Items = PagedFilms!
            };
        }
    }
}
