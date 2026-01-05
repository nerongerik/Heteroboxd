using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface IUserListService
    {
        Task<UserListInfoResponse> GetList(string ListId);
        Task<PagedEntriesResponse> GetListEntries(string ListId, int Page, int PageSize);
        Task<List<ListEntryInfoResponse>> PowerGetEntries(string ListId);
        Task<PagedUserListsInfoResponse> GetListsByUser(string UserId, int Page, int PageSize);
        Task<List<DelimitedListInfoResponse>> GetDelimitedLists(string UserId, int FilmId);
        Task<PagedUserListsInfoResponse> GetListsFeaturingFilm(int FilmId, int Page, int PageSize);
        Task<int> GetListsFeaturingFilmCount(int FilmId);
        Task<PagedUserListsInfoResponse> SearchLists(string Search);
        Task<Guid> AddList(string Name, string? Description, bool Ranked, string AuthorId);
        Task AddListEntries(string AuthorId, Guid ListId, List<CreateListEntryRequest> Entries);
        Task UpdateList(UpdateUserListRequest ListRequest);
        Task UpdateListsBulk(BulkUpdateRequest Request);
        Task UpdateLikeCountEfCore7(string ListId, int Delta);
        Task ToggleNotificationsEfCore7(string ListId);
        Task DeleteList(string ListId);
    }

    public class UserListService : IUserListService
    {
        private readonly IUserListRepository _repo;
        private readonly IUserRepository _userRepo;
        private readonly IFilmRepository _filmRepo;

        public UserListService(IUserListRepository repo, IUserRepository userRepo, IFilmRepository filmRepo)
        {
            _repo = repo;
            _userRepo = userRepo;
            _filmRepo = filmRepo;
        }

        public async Task<UserListInfoResponse> GetList(string ListId)
        {
            var List = await _repo.GetByIdAsync(Guid.Parse(ListId));
            if (List == null) throw new KeyNotFoundException();
            var Author = await _userRepo.GetByIdAsync(List.AuthorId);
            if (Author == null) throw new KeyNotFoundException();

            return new UserListInfoResponse(List, Author, 0);
        }

        public async Task<PagedEntriesResponse> GetListEntries(string ListId, int Page, int PageSize)
        {
            var (Entries, TotalCount) = await _repo.GetEntriesByIdAsync(Guid.Parse(ListId), Page, PageSize);
            return new PagedEntriesResponse
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Entries = Entries.Select(le => new ListEntryInfoResponse(le)).ToList()
            };
        }

        public async Task<List<ListEntryInfoResponse>> PowerGetEntries(string ListId)
        {
            var Entries = await _repo.PowerGetEntriesAsync(Guid.Parse(ListId));
            return Entries.Select(le => new ListEntryInfoResponse(le)).ToList();
        }

        public async Task<PagedUserListsInfoResponse> GetListsByUser(string UserId, int Page, int PageSize)
        {
            var (Lists, TotalCount) = await _repo.GetByUserAsync(Guid.Parse(UserId), Page, PageSize);
            var Author = await _userRepo.GetByIdAsync(Guid.Parse(UserId));
            if (Author == null) throw new KeyNotFoundException();
            return new PagedUserListsInfoResponse
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Lists = Lists.Select(l => new UserListInfoResponse(l, Author, 4)).ToList()
            };
        }

        public async Task<List<DelimitedListInfoResponse>> GetDelimitedLists(string UserId, int FilmId)
        {
            var User = await _userRepo.GetByIdAsync(Guid.Parse(UserId));
            if (User == null) throw new KeyNotFoundException();
            var Lists = await _repo.GetLightweightAsync(User.Id);
            List<DelimitedListInfoResponse> Response = new List<DelimitedListInfoResponse>();
            foreach (UserList ul in Lists)
            {
                var ListEntries = await _repo.PowerGetEntriesAsync(ul.Id);
                Response.Add(new DelimitedListInfoResponse
                {
                    ListId = ul.Id.ToString(),
                    ListName = ul.Name,
                    ContainsFilm = ListEntries.Any(le => le.FilmId == FilmId),
                    Size = ListEntries.Count()
                });
            }
            return Response;
        }
        
        public async Task<PagedUserListsInfoResponse> GetListsFeaturingFilm(int FilmId, int Page, int PageSize)
        {
            var (Lists, TotalCount) = await _repo.GetFeaturingFilmAsync(FilmId, Page, PageSize);
            var AuthorIds = Lists
                .Select(l => l.AuthorId)
                .Distinct()
                .ToList();
            var Authors = await _userRepo.GetByIdsAsync(AuthorIds);

            var AuthorLookup = Authors.ToDictionary(a => a.Id);

            var ListResponses = new List<UserListInfoResponse>();

            foreach (UserList ul in Lists)
            {
                if (!AuthorLookup.TryGetValue(ul.AuthorId, out var Author))
                    continue;
                ListResponses.Add(new UserListInfoResponse(ul, Author, 4));
            }

            return new PagedUserListsInfoResponse
            {
                TotalCount = TotalCount,
                Page = Page,
                PageSize = PageSize,
                Lists = ListResponses
            };
        }

        public async Task<int> GetListsFeaturingFilmCount(int FilmId)
        {
            var Count = await _repo.GetFeaturingFilmCountAsync(FilmId);
            return Count;
        }

        public async Task<PagedUserListsInfoResponse> SearchLists(string Search)
        {
            /*
            var Lists = await _repo.SearchAsync(Search.ToLower());

            var ListsTasks = Lists.Select(async ul =>
            {
                var Author = await _userRepo.GetByIdAsync(ul.AuthorId);
                if (Author == null) throw new KeyNotFoundException();
                return new UserListInfoResponse(ul, Author);
            });

            var Results = await Task.WhenAll(ListsTasks);
            return Results.ToList();
            */
            throw new NotImplementedException();
        }

        public async Task<Guid> AddList(string Name, string? Description, bool Ranked, string AuthorId)
        {
            UserList NewList = new UserList(Name, Description, Ranked, Guid.Parse(AuthorId));
            _repo.Create(NewList);
            await _repo.SaveChangesAsync();
            return NewList.Id;
        }

        public async Task AddListEntries(string AuthorId, Guid ListId, List<CreateListEntryRequest> Entries)
        {
            foreach (CreateListEntryRequest Request in Entries)
            {
                var Film = await _filmRepo.LightweightFetcher(Request.FilmId);
                if (Film == null) continue;
                _repo.CreateEntry(new ListEntry(Request.Position, Film.Title, Film.ReleaseYear, Film.PosterUrl, Film.BackdropUrl, Request.FilmId, Guid.Parse(AuthorId), ListId));
            }
            await _repo.SaveChangesAsync();
        }

        public async Task UpdateList(UpdateUserListRequest ListRequest)
        {
            var List = await _repo.GetByIdAsync(Guid.Parse(ListRequest.ListId));
            if (List == null) throw new KeyNotFoundException();
            List.Name = ListRequest.Name;
            List.Description = ListRequest.Description;
            List.Ranked = ListRequest.Ranked;
            List.DateCreated = DateTime.UtcNow;
            _repo.DeleteEntriesByListId(List.Id);
            await _repo.SaveChangesAsync();
            await AddListEntries(List.AuthorId.ToString(), List.Id, ListRequest.Entries);
        }
        
        public async Task UpdateListsBulk(BulkUpdateRequest Request)
        {
            var Film = await _filmRepo.LightweightFetcher(Request.FilmId);
            if (Film == null) throw new KeyNotFoundException();
            foreach (var kvp in Request.Lists)
            {
                _repo.CreateEntry(new ListEntry(kvp.Value + 1, Film.Title, Film.ReleaseYear, Film.PosterUrl, Film.BackdropUrl, Film.Id, Guid.Parse(Request.AuthorId), Guid.Parse(kvp.Key)));
            }
            await _repo.SaveChangesAsync();
        }

        public async Task UpdateLikeCountEfCore7(string ListId, int Delta)
        {
            if (!Guid.TryParse(ListId, out var Id)) throw new ArgumentException();
            await _repo.UpdateLikeCountEfCore7Async(Id, Delta);
        }

        public async Task ToggleNotificationsEfCore7(string ListId)
        {
            if (!Guid.TryParse(ListId, out var Id)) throw new ArgumentException();
            await _repo.ToggleNotificationsEfCore7Async(Id);
        }

        public async Task DeleteList(string ListId)
        {
            var List = await _repo.GetByIdAsync(Guid.Parse(ListId));
            if (List == null) throw new KeyNotFoundException();
            _repo.Delete(List);
            await _repo.SaveChangesAsync();
        }
    }
}
