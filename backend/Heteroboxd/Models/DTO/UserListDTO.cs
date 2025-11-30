namespace Heteroboxd.Models.DTO
{
    public class UserListInfoResponse
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public bool Ranked { get; set; }
        public string DateCreated { get; set; }
        public bool NotificationsOn { get; set; }
        public List<ListEntryInfoResponse> Films { get; set; }
        public int LikeCount { get; set; }
        public string AuthorId { get; set; }
        public string AuthorName { get; set; }
        public string AuthorProfilePictureUrl { get; set; }

        public UserListInfoResponse(UserList List, User Author, int Take = -1)
        {
            this.Id = List.Id.ToString();
            this.Name = List.Name;
            this.Description = List.Description;
            this.Ranked = List.Ranked;
            this.DateCreated = List.DateCreated.ToString("dd/MM/yyyy HH:mm");
            this.NotificationsOn = List.NotificationsOn;
            if (Take < 0) this.Films = List.Films.Select(le => new ListEntryInfoResponse(le)).ToList();
            else this.Films = List.Films.Select(le => new ListEntryInfoResponse(le)).Take(Take).ToList();
            this.LikeCount = List.LikeCount;
            this.AuthorId = List.AuthorId.ToString();
            this.AuthorName = Author.Name;
            this.AuthorProfilePictureUrl = Author.PictureUrl;
        }
    }

    public class PagedUserListInfoResponse
    {
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public List<UserListInfoResponse> Lists { get; set; }
    }

    public class CreateUserListRequest
    {
        public string Name { get; set; }
        public string? Description { get; set; }
        public bool Ranked { get; set; }
        public string AuthorId { get; set; }
        public List<CreateListEntryRequest> Entries { get; set; }
    }

    public class UpdateUserListRequest
    {
        public string ListId { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool? Ranked { get; set; }
        public List<ListEntryInfoResponse> ToAdd { get; set; } //FilmId
        public List<string> ToRemove { get; set; } //ListEntryId
    }

    public class ListEntryInfoResponse
    {
        public string Id { get; set; }
        public string DateAdded { get; set; }
        public int Position { get; set; }
        public string FilmPosterUrl { get; set; }
        public int FilmId { get; set; }

        public ListEntryInfoResponse(ListEntry Entry)
        {
            this.Id = Entry.Id.ToString();
            this.DateAdded = Entry.DateAdded.ToString("dd/MM/yyyy HH:mm");
            this.Position = Entry.Position;
            this.FilmPosterUrl = Entry.FilmPosterUrl;
            this.FilmId = Entry.FilmId;
        }
    }

    public class CreateListEntryRequest
    {
        public int FilmId { get; set; }
        public int Position { get; set; }
    }
}
