using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface IUserListService
    {
        Task<PagedResponse<UserListInfoResponse>> GetLists(string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<UserListInfoResponse> GetList(string ListId);
        Task<PagedResponse<ListEntryInfoResponse?>> GetListEntries(string ListId, string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<List<ListEntryInfoResponse>> PowerGetEntries(string ListId);
        Task<PagedResponse<UserListInfoResponse>> GetListsByUser(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<PagedResponse<DelimitedUserListInfoResponse>> GetDelimitedLists(string UserId, int FilmId, int Page, int PageSize);
        Task<PagedResponse<UserListInfoResponse>> GetListsFeaturingFilm(int FilmId, string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue);
        Task<int> GetListsFeaturingFilmCount(int FilmId);
        Task<PagedResponse<UserListInfoResponse>> SearchLists(string Search, int Page, int PageSize);
        Task AddList(CreateUserListRequest ListRequest);
        Task UpdateList(UpdateUserListRequest ListRequest);
        Task UpdateListsBulk(UpdateUserListBulkRequest Request);
        Task UpdateListLikeCount(string ListId, int Delta);
        Task ToggleListNotifications(string ListId);
        Task ReportList(string ListId);
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

        public async Task<PagedResponse<UserListInfoResponse>> GetLists(string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null && Filter.ToLower() == "friends") throw new KeyNotFoundException();

            IEnumerable<Guid>? UsersFriends = null;
            if (UserId != null && Filter.ToLower() == "friends")
            {
                UsersFriends = await _userRepo.GetFriendsAsync(Guid.Parse(UserId));
            }

            var (Responses, TotalCount) = await _repo.GetAllAsync(UsersFriends, Page, PageSize, Filter, Sort, Desc, FilterValue);
            return new PagedResponse<UserListInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                Items = Responses.Select(x => new UserListInfoResponse(x.List.Item, x.Entries, x.List.Joined!)).ToList()
            };
        }

        public async Task<UserListInfoResponse> GetList(string ListId)
        {
            var Response = await _repo.GetJoinedByIdAsync(Guid.Parse(ListId));
            if (Response == null) throw new KeyNotFoundException();

            return new UserListInfoResponse(Response.Item, Response.Joined);
        }

        public async Task<PagedResponse<ListEntryInfoResponse?>> GetListEntries(string ListId, string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null)
            {
                var (Responses, TotalCount, _, _) = await _repo.GetEntriesByIdAsync(Guid.Parse(ListId), null, Page, PageSize, Filter, Sort, Desc, FilterValue);
                return new PagedResponse<ListEntryInfoResponse?>
                {
                    TotalCount = TotalCount,
                    Page = Page,
                    Items = PageUtils.AddPadding(Responses.Select(x => (ListEntryInfoResponse?) new ListEntryInfoResponse(x.Item, x.Joined)).ToList())
                };
            }
            else
            {
                var (Responses, TotalCount, Seen, SeenCount) = await _repo.GetEntriesByIdAsync(Guid.Parse(ListId), Guid.Parse(UserId), Page, PageSize, Filter, Sort, Desc, FilterValue);
                return new PagedResponse<ListEntryInfoResponse?>
                {
                    TotalCount = TotalCount,
                    Page = Page,
                    Items = PageUtils.AddPadding(Responses.Select(x => (ListEntryInfoResponse?) new ListEntryInfoResponse(x.Item, x.Joined)).ToList()),
                    Seen = Seen!.Select(uwf => uwf.FilmId).ToList(),
                    SeenCount = SeenCount!.Value
                };
            }
        }

        public async Task<List<ListEntryInfoResponse>> PowerGetEntries(string ListId)
        {
            var Responses = await _repo.PowerGetEntriesAsync(Guid.Parse(ListId));
            return Responses.Select(x => new ListEntryInfoResponse(x.Item, x.Joined)).ToList();
        }

        public async Task<PagedResponse<UserListInfoResponse>> GetListsByUser(string UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            var Author = await _userRepo.LightweightFetcherAsync(Guid.Parse(UserId));
            if (Author == null) throw new KeyNotFoundException();

            var (Responses, TotalCount) = await _repo.GetByUserAsync(Guid.Parse(UserId), Page, PageSize, Filter, Sort, Desc, FilterValue);
            return new PagedResponse<UserListInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                Items = Responses.Select(x => new UserListInfoResponse(x.List.Item, x.Entries, Author)).ToList()
            };
        }

        public async Task<PagedResponse<DelimitedUserListInfoResponse>> GetDelimitedLists(string UserId, int FilmId, int Page, int PageSize)
        {
            var (Response, TotalCount) = await _repo.SummarizeByUserAsync(Guid.Parse(UserId), FilmId, Page, PageSize);
            return new PagedResponse<DelimitedUserListInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                Items = Response
            };
        }

        public async Task<PagedResponse<UserListInfoResponse>> GetListsFeaturingFilm(int FilmId, string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue)
        {
            if (UserId == null && Filter.ToLower() == "friends") throw new KeyNotFoundException();

            IEnumerable<Guid>? UsersFriends = null;
            if (UserId != null && Filter.ToLower() == "friends")
            {
                UsersFriends = await _userRepo.GetFriendsAsync(Guid.Parse(UserId));
            }

            var (Responses, TotalCount) = await _repo.GetFeaturingFilmAsync(FilmId, UsersFriends, Page, PageSize, Filter, Sort, Desc, FilterValue);
            return new PagedResponse<UserListInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                Items = Responses.Select(x => new UserListInfoResponse(x.List.Item, x.Entries, x.List.Joined!)).ToList()
            };
        }

        public async Task<int> GetListsFeaturingFilmCount(int FilmId) => 
            await _repo.GetFeaturingFilmCountAsync(FilmId);

        public async Task<PagedResponse<UserListInfoResponse>> SearchLists(string Search, int Page, int PageSize)
        {
            var (Results, TotalCount) = await _repo.SearchAsync(Search.ToLower(), Page, PageSize);
            return new PagedResponse<UserListInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                Items = Results.Select(x => new UserListInfoResponse(x.List.Item, x.Entries, x.List.Joined!)).ToList()
            };
        }

        public async Task AddList(CreateUserListRequest ListRequest)
        {
            var NewList = new UserList(ListRequest.Name, ListRequest.Description, ListRequest.Ranked, ListRequest.Entries.Count, Guid.Parse(ListRequest.AuthorId));
            await _repo.CreateAsync(NewList);
            await AddListEntries(NewList.Id, ListRequest.Entries);
        }

        public async Task UpdateList(UpdateUserListRequest ListRequest)
        {
            var List = await _repo.GetByIdAsync(Guid.Parse(ListRequest.ListId));
            if (List == null) throw new KeyNotFoundException();

            await _repo.DeleteAllEntriesAsync(List.Id);
            var Count = await AddListEntries(List.Id, ListRequest.Entries);

            List.UpdateFields(ListRequest, Count);
            await _repo.UpdateAsync(List);
        }
        
        public async Task UpdateListsBulk(UpdateUserListBulkRequest Request)
        {
            var Film = await _filmRepo.LightweightFetcherAsync(Request.FilmId);
            if (Film == null) throw new KeyNotFoundException();
            List<ListEntry> Created = new();
            foreach (var kvp in Request.Lists)
            {
                Created.Add(new ListEntry(kvp.Value + 1, Film.Id, Guid.Parse(kvp.Key)));
                await _repo.IncrementSize(Guid.Parse(kvp.Key));
            }
            await _repo.CreateEntriesAsync(Created);
        }

        public async Task UpdateListLikeCount(string ListId, int Delta) =>
            await _repo.UpdateLikeCountAsync(Guid.Parse(ListId), Delta);

        public async Task ToggleListNotifications(string ListId) =>
            await _repo.ToggleNotificationsAsync(Guid.Parse(ListId));

        public async Task ReportList(string ListId) =>
            await _repo.ReportAsync(Guid.Parse(ListId));

        public async Task DeleteList(string ListId) =>
            await _repo.DeleteAsync(Guid.Parse(ListId));

        private async Task<int> AddListEntries(Guid ListId, List<CreateListEntryRequest> Entries)
        {
            var FilmIds = Entries.Select(e => e.FilmId).ToList();
            var Films = await _filmRepo.GetByIdsAsync(FilmIds);
            var FilmMap = Films.ToDictionary(f => f.Id);

            var Created = Entries
                .Where(e => FilmMap.ContainsKey(e.FilmId))
                .Select(e => new ListEntry(e.Position, e.FilmId, ListId))
                .ToList();

            await _repo.CreateEntriesAsync(Created);
            return Created.Count;
        }
    }
}
