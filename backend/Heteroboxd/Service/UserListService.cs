using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface IUserListService
    {
        //Task<List<UserListInfoResponse>> GetAllUserLists();
        Task<UserListInfoResponse> GetUserListById(string ListId);
        Task<PagedEntriesResponse> GetListEntriesById(string ListId, int Page, int PageSize);
        Task<PagedUserListsInfoResponse> GetUsersUserLists(string UserId, int Page, int PageSize);
        Task<PagedUserListsInfoResponse> GetListsFeaturingFilm(int FilmId);
        Task<PagedUserListsInfoResponse> SearchUserLists(string Search);
        Task<Guid> AddList(string Name, string? Description, bool Ranked, string AuthorId);
        Task AddListEntries(string AuthorId, Guid ListId, List<CreateListEntryRequest> Entries);
        Task UpdateList(UpdateUserListRequest ListRequest);
        Task UpdateLikeCountEfCore7Async(string ListId, string LikeChange);
        Task ToggleNotificationsEfCore7Async(string ListId);
        Task DeleteUserList(string ListId);
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

        /*
        public async Task<List<UserListInfoResponse>> GetAllUserLists()
        {
            var Lists = await _repo.GetAllAsync();
            return Lists.Select(l => new UserListInfoResponse(l)).ToList();
        }
        */

        public async Task<UserListInfoResponse> GetUserListById(string ListId)
        {
            var List = await _repo.GetByIdAsync(Guid.Parse(ListId));
            if (List == null) throw new KeyNotFoundException();
            var Author = await _userRepo.GetByIdAsync(List.AuthorId);
            if (Author == null) throw new KeyNotFoundException();

            return new UserListInfoResponse(List, Author, 0);
        }

        public async Task<PagedEntriesResponse> GetListEntriesById(string ListId, int Page, int PageSize)
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

        public async Task<PagedUserListsInfoResponse> GetUsersUserLists(string UserId, int Page, int PageSize)
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

        public async Task<PagedUserListsInfoResponse> GetListsFeaturingFilm(int FilmId)
        {
            /*
            var FilmsLists = await _repo.GetFeaturingFilmAsync(FilmId);

            var ListsTasks = FilmsLists.Select(async ul =>
            {
                var Author = await _userRepo.GetByIdAsync(ul.AuthorId);
                if (Author == null) throw new KeyNotFoundException();
                return new UserListInfoResponse(ul, Author);
            });

            var Lists = await Task.WhenAll(ListsTasks);
            return Lists.ToList();
            */
            throw new NotImplementedException();
        }

        public async Task<PagedUserListsInfoResponse> SearchUserLists(string Search)
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
                _repo.CreateEntry(new ListEntry(Request.Position, Film.PosterUrl, Film.BackdropUrl, Request.FilmId, Guid.Parse(AuthorId), ListId));
            }
            await _repo.SaveChangesAsync();
        }

        public async Task UpdateList(UpdateUserListRequest ListRequest)
        {
            var List = await _repo.GetByIdAsync(Guid.Parse(ListRequest.ListId));
            if (List == null) throw new KeyNotFoundException();
            if (ListRequest.Entries == null)
            {
                List.Name = ListRequest.Name;
                List.Description = ListRequest.Description;
                List.Ranked = ListRequest.Ranked;
                List.DateCreated = DateTime.UtcNow;
                await _repo.SaveChangesAsync();
            }
            else
            {
                string AuthorId = List.AuthorId.ToString();
                /*
                honestly I just don't give a shit
                we'll just delete the whole thing and create a new one lmao
                can't bother updating every single position of every single entry from scratch
                */
                await DeleteUserList(ListRequest.ListId);
                Guid RecreatedId = await AddList(ListRequest.Name, ListRequest.Description, ListRequest.Ranked, AuthorId);
                await AddListEntries(AuthorId, RecreatedId, ListRequest.Entries);
            }
        }

        public async Task UpdateLikeCountEfCore7Async(string ListId, string LikeChange)
        {
            if (!Guid.TryParse(ListId, out var Id)) throw new ArgumentException();
            if (!int.TryParse(LikeChange, out var Delta)) throw new ArgumentException();
            await _repo.UpdateLikeCountEfCore7Async(Id, Delta);
        }

        public async Task ToggleNotificationsEfCore7Async(string ListId)
        {
            if (!Guid.TryParse(ListId, out var Id)) throw new ArgumentException();
            await _repo.ToggleNotificationsEfCore7Async(Id);
        }

        public async Task DeleteUserList(string ListId)
        {
            var List = await _repo.GetByIdAsync(Guid.Parse(ListId));
            if (List == null) throw new KeyNotFoundException();
            _repo.Delete(List);
            await _repo.SaveChangesAsync();
        }
    }
}
