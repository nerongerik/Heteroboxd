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
        public int ListEntryCount { get; set; }
        public List<ListEntryInfoResponse> Films { get; set; }
        public int LikeCount { get; set; }
        public string AuthorId { get; set; }
        public string AuthorName { get; set; }
        public string AuthorProfilePictureUrl { get; set; }
        public string AuthorTier { get; set; }
        public bool AuthorPatron { get; set; }

        public UserListInfoResponse(UserList List, User Author, int Take = -1)
        {
            this.Id = List.Id.ToString();
            this.Name = List.Name;
            this.Description = List.Description;
            this.Ranked = List.Ranked;
            this.DateCreated = List.DateCreated.ToString("dd/MM/yyyy HH:mm");
            this.NotificationsOn = List.NotificationsOn;
            this.ListEntryCount = List.Films.Count;
            if (Take < 0) this.Films = List.Films.OrderBy(le => le.Position).Select(le => new ListEntryInfoResponse(le)).ToList();
            else this.Films = List.Films.OrderBy(le => le.Position).Select(le => new ListEntryInfoResponse(le)).Take(Take).ToList();

            this.LikeCount = List.LikeCount;
            this.AuthorId = List.AuthorId.ToString();
            this.AuthorName = Author.Name;
            this.AuthorProfilePictureUrl = Author.PictureUrl;
            this.AuthorPatron = Author.IsPatron;
            this.AuthorTier = Author.Tier.ToString().ToLower();
        }
    }

    public class PagedEntriesResponse
    {
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public List<ListEntryInfoResponse> Entries { get; set; }
    }

    public class PagedUserListsInfoResponse
    {
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public List<UserListInfoResponse> Lists { get; set; }
    }

    public class DelimitedListInfoResponse
    {
        public string ListId { get; set; }
        public string ListName { get; set; }
        public bool ContainsFilm { get; set; }
        public int Size { get; set; }
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
        public string Name { get; set; }
        public string Description { get; set; }
        public bool Ranked { get; set; }
        public List<CreateListEntryRequest> Entries { get; set; } //send full list; we'll check if they should be removed or added, and in what order
    }

    public class BulkUpdateRequest
    {
        public string AuthorId { get; set; }
        public int FilmId { get; set; }
        public List<KeyValuePair<string, int>> Lists { get; set; }
    }

    public class ListEntryInfoResponse
    {
        public string Id { get; set; }
        public string DateAdded { get; set; }
        public int Position { get; set; }
        public string FilmTitle { get; set; }
        public int FilmYear { get; set; }
        public string FilmPosterUrl { get; set; }
        public string? FilmBackdropUrl { get; set; }
        public int FilmId { get; set; }

        public ListEntryInfoResponse(ListEntry Entry)
        {
            this.Id = Entry.Id.ToString();
            this.DateAdded = Entry.DateAdded.ToString("dd/MM/yyyy HH:mm");
            this.Position = Entry.Position;
            this.FilmTitle = Entry.FilmTitle;
            this.FilmYear = Entry.FilmYear;
            this.FilmPosterUrl = Entry.FilmPosterUrl;
            this.FilmBackdropUrl = Entry.FilmBackdropUrl;
            this.FilmId = Entry.FilmId;
        }
    }

    public class CreateListEntryRequest
    {
        public int FilmId { get; set; }
        public int Position { get; set; }
    }
}
