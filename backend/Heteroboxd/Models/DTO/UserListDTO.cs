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
        public ICollection<ListEntryInfoResponse> Films { get; set; }
        public int LikeCount { get; set; }
        public string AuthorId { get; set; }
        public string? AuthorName { get; set; }
        public string? AuthorProfilePictureUrl { get; set; }

        public UserListInfoResponse(UserList List, User Author)
        {
            this.Id = List.Id.ToString();
            this.Name = List.Name;
            this.Description = List.Description;
            this.Ranked = List.Ranked;
            this.DateCreated = List.DateCreated.ToString("dd/MM/yyyy HH:mm");
            this.NotificationsOn = List.NotificationsOn;
            this.Films = List.Films.Select(le => new ListEntryInfoResponse(le)).ToList();
            this.LikeCount = List.LikeCount;
            this.AuthorId = List.AuthorId.ToString();
            this.AuthorName = Author.Name;
            this.AuthorProfilePictureUrl = Author.PictureUrl;
        }

        public UserListInfoResponse(UserList List)
        {
            this.Id = List.Id.ToString();
            this.Name = List.Name;
            this.Description = List.Description;
            this.Ranked = List.Ranked;
            this.DateCreated = List.DateCreated.ToString("dd/MM/yyyy HH:mm");
            this.NotificationsOn = List.NotificationsOn;
            this.Films = List.Films.Select(le => new ListEntryInfoResponse(le)).ToList();
            this.LikeCount = List.LikeCount;
            this.AuthorId = List.AuthorId.ToString();
        }
    }

    public class CreateUserListRequest
    {
    }

    public class UpdateUserListRequest
    {
    }

    public class UserListSearchRequest
    {
    }

    public class ListEntryInfoResponse
    {
        public string Id { get; set; }
        public string DateAdded { get; set; }
        public int? Position { get; set; }
        public string FilmId { get; set; }

        public ListEntryInfoResponse(ListEntry Entry)
        {
            this.Id = Entry.Id.ToString();
            this.DateAdded = Entry.DateAdded.ToString("dd/MM/yyyy HH:mm");
            this.Position = Entry.Position;
            this.FilmId = Entry.FilmId.ToString();
        }
    }
}
