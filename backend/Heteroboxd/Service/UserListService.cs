using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Service
{
    public interface IUserListService
    {
        Task<List<UserListInfoResponse>> GetAllUserLists();
        Task<UserListInfoResponse?> GetUserListById(string ListId);
        Task<List<UserListInfoResponse>> GetUsersUserLists(string UserId);
        Task<List<UserListInfoResponse>> GetListsFeaturingFilm(int FilmId);
        Task<List<UserListInfoResponse>> SearchUserLists(string Search);
        Task AddList(CreateUserListRequest ListRequest);
        Task UpdateList(UpdateUserListRequest ListRequest);
        Task UpdateLikeCountEfCore7Async(string ListId, string LikeChange);
        Task ToggleNotificationsEfCore7Async(string ListId);
        Task LogicalDeleteUserList(string ListId);
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

        public async Task<List<UserListInfoResponse>> GetAllUserLists()
        {
            var Lists = await _repo.GetAllAsync();
            return Lists.Select(l => new UserListInfoResponse(l)).ToList();
        }

        public async Task<UserListInfoResponse?> GetUserListById(string ListId)
        {
            var List = await _repo.GetByIdAsync(Guid.Parse(ListId));
            if (List == null) throw new KeyNotFoundException();
            var Author = await _userRepo.GetByIdAsync(List.AuthorId);
            if (Author == null) throw new KeyNotFoundException();
            return new UserListInfoResponse(List, Author);
        }

        public async Task<List<UserListInfoResponse>> GetUsersUserLists(string UserId)
        {
            var Lists = await _repo.GetByUserAsync(Guid.Parse(UserId));
            return Lists.Select(l => new UserListInfoResponse(l)).ToList();
        }

        public async Task<List<UserListInfoResponse>> GetListsFeaturingFilm(int FilmId)
        {
            var FilmsLists = await _repo.GetFeaturingFilmAsync(FilmId);

            var ListsTasks = FilmsLists.Select(async ul =>
            {
                var Author = await _userRepo.GetByIdAsync(ul.AuthorId);
                if (Author == null) throw new KeyNotFoundException();
                return new UserListInfoResponse(ul, Author);
            });

            var Lists = await Task.WhenAll(ListsTasks);
            return Lists.ToList();
        }

        public async Task<List<UserListInfoResponse>> SearchUserLists(string Search)
        {
            var Lists = await _repo.SearchAsync(Search);

            var ListsTasks = Lists.Select(async ul =>
            {
                var Author = await _userRepo.GetByIdAsync(ul.AuthorId);
                if (Author == null) throw new KeyNotFoundException();
                return new UserListInfoResponse(ul, Author);
            });

            var Results = await Task.WhenAll(ListsTasks);
            return Results.ToList();
        }

        public async Task AddList(CreateUserListRequest ListRequest) // PLACEHOLDER - PROBABLY REFORM ENTRY CREATION LATER
        {
            UserList NewList = new UserList(ListRequest.Name, ListRequest.Description, ListRequest.Ranked, Guid.Parse(ListRequest.AuthorId));
            foreach (CreateListEntryRequest cler in ListRequest.Entries)
            {
                var Film = await _filmRepo.LightweightFetcher(cler.FilmId);
                if (Film == null) continue; //skip invalid films
                NewList.Films.Add(new ListEntry(cler.Position, Film.PosterUrl, Film.Id, Guid.Parse(ListRequest.AuthorId), NewList.Id));
            }
            _repo.Create(NewList);
            await _repo.SaveChangesAsync();
        }

        public async Task UpdateList(UpdateUserListRequest ListRequest)
        {
            var List = await _repo.GetByIdAsync(Guid.Parse(ListRequest.ListId));
            if (List == null) throw new KeyNotFoundException();
            if (ListRequest.Name != null) List.Name = ListRequest.Name;
            if (ListRequest.Description != null) List.Description = ListRequest.Description;
            if (ListRequest.Ranked != null) List.Ranked = (bool) ListRequest.Ranked;

            if (ListRequest.ToRemove.Count > 0)
            {
                foreach (string leid in ListRequest.ToRemove)
                {
                    var Entry = List.Films.FirstOrDefault(le => le.Id == Guid.Parse(leid));
                    if (Entry == null) throw new ArgumentException();
                    int Position = Entry.Position ?? -1;
                    foreach (var f in List.Films.Where(le => le.Position > Position && Position != -1)) f.Position--;
                    List.Films.Remove(Entry);
                }
            }

            if (ListRequest.ToAdd.Count > 0)
            {
                foreach (ListEntryInfoResponse leir in ListRequest.ToAdd)
                {
                    var Film = await _filmRepo.LightweightFetcher(leir.FilmId);
                    if (Film == null) continue;
                    int Position = leir.Position ?? -1;
                    foreach (var f in List.Films.Where(le => le.Position >= Position && Position != -1)) f.Position++;
                    List.Films.Add(new ListEntry(Position, Film.PosterUrl, Film.Id, List.AuthorId, List.Id));
                }
            }
            await _repo.SaveChangesAsync();
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

        public async Task LogicalDeleteUserList(string ListId)
        {
            var List = await _repo.GetByIdAsync(Guid.Parse(ListId));
            if (List == null) throw new KeyNotFoundException();
            List.Deleted = true;
            _repo.Update(List);
            await _repo.SaveChangesAsync();
        }
    }
}
