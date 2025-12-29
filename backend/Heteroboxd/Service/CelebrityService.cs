using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Models.Enums;
using Heteroboxd.Repository;
using Microsoft.AspNetCore.Routing;
using Org.BouncyCastle.Pqc.Crypto.Lms;

namespace Heteroboxd.Service
{
    public interface ICelebrityService
    {
        Task<CelebrityDelimitedResponse?> GetCelebrity(int CelebrityId);
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

        public async Task<CelebrityDelimitedResponse?> GetCelebrity(int CelebrityId)
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

            List<FilmInfoResponse> Starred = new List<FilmInfoResponse>();
            List<FilmInfoResponse> Directed = new List<FilmInfoResponse>();
            List<FilmInfoResponse> Produced = new List<FilmInfoResponse>();
            List<FilmInfoResponse> Wrote = new List<FilmInfoResponse>();
            List<FilmInfoResponse> Composed = new List<FilmInfoResponse>();

            var StarredSet = new HashSet<int>();
            var DirectedSet = new HashSet<int>();
            var ProducedSet = new HashSet<int>();
            var WroteSet = new HashSet<int>();
            var ComposedSet = new HashSet<int>();

            foreach (CelebrityCredit cc in Celebrity.Credits)
            {
                if (!Films.TryGetValue(cc.FilmId, out Film? Film)) continue;

                switch (cc.Role)
                {
                    case Role.Actor when StarredSet.Add(cc.FilmId):
                        Starred.Add(new FilmInfoResponse(Film!));
                        break;

                    case Role.Director when DirectedSet.Add(cc.FilmId):
                        Directed.Add(new FilmInfoResponse(Film!));
                        break;

                    case Role.Producer when ProducedSet.Add(cc.FilmId):
                        Produced.Add(new FilmInfoResponse(Film!));
                        break;

                    case Role.Writer when WroteSet.Add(cc.FilmId):
                        Wrote.Add(new FilmInfoResponse(Film!));
                        break;

                    case Role.Composer when ComposedSet.Add(cc.FilmId):
                        Composed.Add(new FilmInfoResponse(Film!));
                        break;
                }
            }

            return new CelebrityDelimitedResponse
            {
                BaseCeleb = new CelebrityInfoResponse(Celebrity),
                Starred = Starred,
                Directed = Directed,
                Produced = Produced,
                Wrote = Wrote,
                Composed = Composed,
            };
        }

        public async Task<List<CelebrityInfoResponse>> SearchCelebrities(string Search)
        {
            var SearchResults = await _repo.SearchAsync(Search.ToLower());
            return SearchResults.Select(c => new CelebrityInfoResponse(c)).ToList();
        }
    }
}
