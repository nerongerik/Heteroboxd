using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Models.DTO;
using Heteroboxd.Shared.Models.Enums;
using Heteroboxd.Shared.Repository;

namespace Heteroboxd.API.Service
{
    public interface IUserListService
    {
        Task<PagedResponse<UserListInfoResponse>> GetLists(string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue, bool Admin = false);
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
        Task ToggleListNotifications(string ListId);
        Task ReportList(string ListId);
        Task DeleteList(string ListId);
    }

    public class UserListService : IUserListService
    {
        private readonly IUserListRepository _repo;
        private readonly IUserRepository _userRepo;
        private readonly IFilmRepository _filmRepo;
        private readonly INotificationService _notificationService;

        public UserListService(IUserListRepository repo, IUserRepository userRepo, IFilmRepository filmRepo, INotificationService notificationService)
        {
            _repo = repo;
            _userRepo = userRepo;
            _filmRepo = filmRepo;
            _notificationService = notificationService;
        }

        public async Task<PagedResponse<UserListInfoResponse>> GetLists(string? UserId, int Page, int PageSize, string Filter, string Sort, bool Desc, string? FilterValue, bool Admin = false)
        {
            if (UserId == null && Filter.ToLower() == "friends") throw new KeyNotFoundException();

            IEnumerable<Guid>? UsersFriends = null;
            if (UserId != null && Filter.ToLower() == "friends")
            {
                UsersFriends = await _userRepo.GetFriendsAsync(Guid.Parse(UserId));
            }

            var (Responses, TotalCount) = await _repo.GetAllAsync(UsersFriends, Page, PageSize, Filter, Sort, Desc, FilterValue, Admin);
            return new PagedResponse<UserListInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                Items = Responses.Select(x => new UserListInfoResponse(x.List.Item, x.Entries, x.List.Joined!, x.List.LikeCount, x.List.ListEntryCount)).ToList()
            };
        }

        public async Task<UserListInfoResponse> GetList(string ListId)
        {
            var Response = await _repo.GetJoinedByIdAsync(Guid.Parse(ListId));
            if (Response == null) throw new KeyNotFoundException();

            return new UserListInfoResponse(Response.Item, Response.Joined!, Response.LikeCount, Response.ListEntryCount);
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

            var (Responses, TotalCount) = await _repo.GetByUserAsync(Author.Id, Page, PageSize, Filter, Sort, Desc, FilterValue);
            return new PagedResponse<UserListInfoResponse>
            {
                TotalCount = TotalCount,
                Page = Page,
                Items = Responses.Where(x => x.List.Item.Id != Author.PinnedListId).Select(x => new UserListInfoResponse(x.List.Item, x.Entries, Author, x.List.LikeCount, x.List.ListEntryCount)).ToList(),
                Pinned = Responses.FirstOrDefault(x => x.List.Item.Id == Author.PinnedListId) == null ? null : new UserListInfoResponse(Responses.First(x => x.List.Item.Id == Author.PinnedListId).List.Item, Responses.First(x => x.List.Item.Id == Author.PinnedListId).Entries, Author, Responses.First(x => x.List.Item.Id == Author.PinnedListId).List.LikeCount, Responses.First(x => x.List.Item.Id == Author.PinnedListId).List.ListEntryCount)
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
                Items = Responses.Select(x => new UserListInfoResponse(x.List.Item, x.Entries, x.List.Joined!, x.List.LikeCount, x.List.ListEntryCount)).ToList()
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
                Items = Results.Select(x => new UserListInfoResponse(x.List.Item, x.Entries, x.List.Joined!, x.List.LikeCount, x.List.ListEntryCount)).ToList()
            };
        }

        public async Task AddList(CreateUserListRequest ListRequest)
        {
            var User = await _userRepo.LightweightFetcherAsync(Guid.Parse(ListRequest.AuthorId));
            if (User == null) throw new KeyNotFoundException();

            var NewList = new UserList(!User.EmailConfirmed, ListRequest.Name, ListRequest.Description, ListRequest.Ranked, User.Id);
            await _repo.CreateAsync(NewList);
            await AddListEntries(NewList.Id, ListRequest.Entries);

            if (!NewList.Private)
            {
                var FollowerIds = await _userRepo.GetFollowerIdsAsync(User.Id);
                var Notifications = new List<Notification>();
                foreach (var FollowerId in FollowerIds)
                {
                    Notifications.Add(new Notification(
                        $"Your friend {TruncateName(User.Name)} just created a new list {TruncateTitle(NewList.Name)} - check it out!",
                        FollowerId,
                        ReferencedObject.UserList,
                        NewList.Id.ToString()
                    ));
                }

                if (Notifications.Count > 0) await _notificationService.AddNotification(Notifications);
            }
        }

        public async Task UpdateList(UpdateUserListRequest ListRequest)
        {
            var List = await _repo.GetByIdAsync(Guid.Parse(ListRequest.ListId));
            if (List == null) throw new KeyNotFoundException();

            await _repo.DeleteAllEntriesAsync(List.Id);
            await AddListEntries(List.Id, ListRequest.Entries);

            List.UpdateFields(ListRequest);
            await _repo.UpdateAsync(List);
        }
        
        public async Task UpdateListsBulk(UpdateUserListBulkRequest Request)
        {
            var Film = await _filmRepo.LightweightFetcherAsync(Request.FilmId);
            if (Film == null) throw new KeyNotFoundException();

            var ListIds = Request.Lists
                .Select(Guid.Parse)
                .Distinct()
                .ToList();
            var MaxPositions = await _repo.GetMaxPositionsAsync(ListIds);
            if (MaxPositions.Count != ListIds.Count) throw new KeyNotFoundException();

            var Created = ListIds
                .Select(ListId => new ListEntry(MaxPositions[ListId] + 1, Film.Id, ListId))
                .ToList();

            await _repo.RedateAsync(ListIds);
            await _repo.CreateEntriesAsync(Created);
        }

        public async Task ToggleListNotifications(string ListId) =>
            await _repo.ToggleNotificationsAsync(Guid.Parse(ListId));

        public async Task ReportList(string ListId) =>
            await _repo.ReportAsync(Guid.Parse(ListId));

        public async Task DeleteList(string ListId)
        {
            var List = await _repo.GetByIdAsync(Guid.Parse(ListId));
            if (List == null) throw new KeyNotFoundException();

            var User = await _userRepo.LightweightFetcherAsync(List.AuthorId);
            if (User != null && User.PinnedListId == List.Id) await _userRepo.PinListAsync(User.Id, List.Id);

            await _repo.DeleteAsync(Guid.Parse(ListId));
        }

        private async Task AddListEntries(Guid ListId, List<CreateListEntryRequest> Entries)
        {
            var FilmIds = Entries.Select(e => e.FilmId).ToList();
            var Films = await _filmRepo.GetByIdsAsync(FilmIds);
            var FilmMap = Films.ToDictionary(f => f.Id);

            var Created = Entries
                .Where(e => FilmMap.ContainsKey(e.FilmId))
                .Select((e, Index) => new ListEntry(Index + 1, e.FilmId, ListId))
                .ToList();

            await _repo.CreateEntriesAsync(Created);
        }

        private string TruncateName(string Name, int MaxLength = 25) =>
             Name.Length <= MaxLength ? Name : $"{Name[..MaxLength]}...";

        private string TruncateTitle(string Title, int MaxLength = 50) =>
             Title.Length <= MaxLength ? $"\"{Title}\"" : $"\"{Title[..MaxLength]}...\"";
    }
}
