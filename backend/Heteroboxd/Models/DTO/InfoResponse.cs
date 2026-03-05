namespace Heteroboxd.Models.DTO
{
    public class FilmInfoResponse
    {
        public int FilmId { get; set; }
        public string Title { get; set; }
        public string? OriginalTitle { get; set; }
        public List<string> Country { get; set; }
        public List<string> Genres { get; set; }
        public string Tagline { get; set; }
        public string Synopsis { get; set; }
        public string PosterUrl { get; set; }
        public string? BackdropUrl { get; set; }
        public int Length { get; set; }
        public int ReleaseYear { get; set; }
        public int WatchCount { get; set; }
        public Dictionary<int, string>? Collection { get; set; }
        public List<CelebrityCreditInfoResponse>? CastAndCrew { get; set; }

        public FilmInfoResponse(Film Film, bool IncludeCredits = false)
        {
            this.FilmId = Film.Id;
            this.Title = Film.Title;
            this.OriginalTitle = Film.OriginalTitle;
            this.Country = Film.Country.ToList();
            this.Genres = Film.Genres.ToList();
            this.Tagline = Film.Tagline;
            this.Synopsis = Film.Synopsis;
            this.PosterUrl = Film.PosterUrl;
            this.BackdropUrl = Film.BackdropUrl;
            this.Length = Film.Length;
            this.ReleaseYear = Film.ReleaseYear;
            this.WatchCount = Film.WatchCount;
            this.Collection = Film.Collection;

            if (IncludeCredits && Film.CastAndCrew != null)
            {
                this.CastAndCrew = Film.CastAndCrew
                    .Select(c => new CelebrityCreditInfoResponse(c))
                    .ToList();
            }
            else this.CastAndCrew = null;
        }
    }

    public class WatchlistEntryInfoResponse
    {
        public string Id { get; set; }
        public string DateAdded { get; set; }
        public int FilmId { get; set; }
        public string FilmPosterUrl { get; set; }

        public WatchlistEntryInfoResponse(WatchlistEntry Entry)
        {
            this.Id = Entry.Id.ToString();
            this.DateAdded = Entry.DateAdded.ToString("dd/MM/yyyy HH:mm");
            this.FilmId = Entry.FilmId;
            this.FilmPosterUrl = Entry.FilmPosterUrl;
        }
    }

    public class UserWatchedFilmInfoResponse
    {
        public string DateWatched { get; set; }
        public int TimesWatched { get; set; }

        public UserWatchedFilmInfoResponse(UserWatchedFilm UWF)
        {
            this.DateWatched = UWF.DateWatched.ToString("dd/MM/yyyy HH:mm");
            this.TimesWatched = UWF.TimesWatched;
        }
    }

    public class TrendingInfoResponse
    {
        public int FilmId { get; set; }
        public string Title { get; set; }
        public string FilmPosterUrl { get; set; }
        public int Rank { get; set; }
        public string LastSync { get; set; }
    }

    public class CelebrityInfoResponse
    {
        public int CelebrityId { get; set; }
        public string CelebrityName { get; set; }
        public string? CelebrityDescription { get; set; }
        public string? CelebrityPictureUrl { get; set; }
        public List<string>? Roles { get; set; } //Enum.ToString() for all the Roles appearing in their credits

        public CelebrityInfoResponse(Celebrity Celebrity, List<string>? Roles = null)
        {
            this.CelebrityId = Celebrity.Id;
            this.CelebrityName = Celebrity.Name;
            this.CelebrityDescription = Celebrity.Description;
            this.CelebrityPictureUrl = Celebrity.PictureUrl;
            this.Roles = Roles;
        }
    }

    public class CelebrityCreditInfoResponse
    {
        public int? CelebrityId { get; set; }
        public string? CelebrityName { get; set; }
        public string? CelebrityPictureUrl { get; set; }
        public string Role { get; set; }
        public string? Character { get; set; }
        public int? Order { get; set; }

        public CelebrityCreditInfoResponse(CelebrityCredit Role)
        {
            this.CelebrityId = Role.CelebrityId;
            this.CelebrityName = Role.CelebrityName;
            this.CelebrityPictureUrl = Role.CelebrityPictureUrl;
            this.Role = Role.Role.ToString();
            this.Character = Role.Character;
            this.Order = Role.Order;
        }
    }

    public class ReviewInfoResponse
    {
        public string Id { get; set; }
        public double Rating { get; set; }
        public string? Text { get; set; }
        public string Date { get; set; }
        public int Flags { get; set; }
        public bool Spoiler { get; set; }
        public bool NotificationsOn { get; set; }
        public int LikeCount { get; set; }
        public string AuthorId { get; set; }
        public string? AuthorName { get; set; }
        public string? AuthorProfilePictureUrl { get; set; }
        public bool? Admin { get; set; }
        public int FilmId { get; set; }
        public string? FilmTitle { get; set; }
        public string? FilmPosterUrl { get; set; }

        public ReviewInfoResponse(Review Review, User Author, Film Film)
        {
            this.Id = Review.Id.ToString();
            this.Rating = Review.Rating;
            this.Text = Review.Text;
            this.Date = Review.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Review.Flags;
            this.Spoiler = Review.Spoiler;
            this.NotificationsOn = Review.NotificationsOn;
            this.LikeCount = Review.LikeCount;

            this.AuthorId = Author.Id.ToString();
            this.AuthorName = Author.Name;
            this.AuthorProfilePictureUrl = Author.PictureUrl;
            this.Admin = Author.IsAdmin;

            this.FilmId = Film.Id;
            this.FilmTitle = Film.Title;
            this.FilmPosterUrl = Film.PosterUrl;
        }

        public ReviewInfoResponse(Review Review, User Author)
        {
            this.Id = Review.Id.ToString();
            this.Rating = Review.Rating;
            this.Text = Review.Text;
            this.Date = Review.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Review.Flags;
            this.Spoiler = Review.Spoiler;
            this.NotificationsOn = Review.NotificationsOn;
            this.LikeCount = Review.LikeCount;

            this.AuthorId = Author.Id.ToString();
            this.AuthorName = Author.Name;
            this.AuthorProfilePictureUrl = Author.PictureUrl;
            this.Admin = Author.IsAdmin;

            this.FilmId = Review.FilmId;
        }

        public ReviewInfoResponse(Review Review, Film Film)
        {
            this.Id = Review.Id.ToString();
            this.Rating = Review.Rating;
            this.Text = Review.Text;
            this.Date = Review.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Review.Flags;
            this.Spoiler = Review.Spoiler;
            this.NotificationsOn = Review.NotificationsOn;
            this.LikeCount = Review.LikeCount;

            this.AuthorId = Review.AuthorId.ToString();

            this.FilmId = Film.Id;
            this.FilmTitle = Film.Title;
            this.FilmPosterUrl = Film.PosterUrl;
        }

        public ReviewInfoResponse(Review Review)
        {
            this.Id = Review.Id.ToString();
            this.Rating = Review.Rating;
            this.Text = Review.Text;
            this.Date = Review.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Review.Flags;
            this.Spoiler = Review.Spoiler;
            this.NotificationsOn = Review.NotificationsOn;
            this.LikeCount = Review.LikeCount;

            this.AuthorId = Review.AuthorId.ToString();

            this.FilmId = Review.FilmId;
        }
    }

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
        public bool Admin { get; set; }

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
            this.Admin = Author.IsAdmin;
        }
    }

    public class DelimitedUserListInfoResponse
    {
        public string ListId { get; set; }
        public string ListName { get; set; }
        public bool ContainsFilm { get; set; }
        public int Size { get; set; }
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

    public class CommentInfoResponse
    {
        public string Id { get; set; }
        public string Text { get; set; }
        public string Date { get; set; }
        public int Flags { get; set; }
        public string AuthorId { get; set; }
        public string AuthorName { get; set; }
        public string AuthorProfilePictureUrl { get; set; }
        public bool Admin { get; set; }
        public string ReviewId { get; set; }

        public CommentInfoResponse(Comment Comment, User Author)
        {
            this.Id = Comment.Id.ToString();
            this.Text = Comment.Text;
            this.Date = Comment.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Comment.Flags;
            this.AuthorId = Comment.AuthorId.ToString();
            this.AuthorName = Author.Name;
            this.AuthorProfilePictureUrl = Author.PictureUrl;
            this.Admin = Author.IsAdmin;
            this.ReviewId = Comment.ReviewId.ToString();
        }
    }

    public class UserInfoResponse
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string PictureUrl { get; set; }
        public string? Bio { get; set; }
        public string? Gender { get; set; }
        public bool Admin { get; set; }
        public string Joined { get; set; }
        public int Flags { get; set; }
        public int WatchlistCount { get; set; }
        public int ListsCount { get; set; }
        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
        public int BlockedCount { get; set; }
        public int ReviewsCount { get; set; }
        public int Likes { get; set; }
        public int Watched { get; set; }

        public UserInfoResponse(User User)
        {
            this.Id = User.Id.ToString();
            this.Name = User.Name;
            this.PictureUrl = User.PictureUrl;
            this.Bio = User.Bio;
            this.Gender = User.Gender.ToString();
            this.Admin = User.IsAdmin;
            this.Joined = User.DateJoined.ToString("dd/MM/yyyy HH:mm");
            this.Flags = User.Flags;
            this.WatchlistCount = User.Watchlist != null ? User.Watchlist.Films.Count : 0;
            this.ListsCount = User.Lists != null ? User.Lists.Count : 0;
            this.FollowersCount = User.Followers != null ? User.Followers.Count : 0;
            this.FollowingCount = User.Following != null ? User.Following.Count : 0;
            this.BlockedCount = User.Blocked != null ? User.Blocked.Count : 0;
            this.ReviewsCount = User.Reviews != null ? User.Reviews.Count : 0;
            this.Likes = (User.LikedLists != null && User.LikedReviews != null) ? (User.LikedLists.Count + User.LikedReviews.Count) : 0;
            this.Watched = User.WatchedFilms != null ? User.WatchedFilms.Count : 0;
        }
    }

    public class DelimitedUserLikesInfoResponse
    {
        public PagedResponse<ReviewInfoResponse> LikedReviews { get; set; }
        public PagedResponse<UserListInfoResponse> LikedLists { get; set; }
    }

    public class DelimitedUserRelationshipsInfoResponse
    {
        public PagedResponse<UserInfoResponse> Following { get; set; }
        public PagedResponse<UserInfoResponse> Followers { get; set; }
        public PagedResponse<UserInfoResponse> Blocked { get; set; }
    }

    public class DelimitedUserFilmInfoResponse
    {
        public string FriendId { get; set; }
        public string FriendProfilePictureUrl { get; set; }
        public string DateWatched { get; set; }
        public string? ReviewId { get; set; }
        public double? Rating { get; set; }
    }

    public class NotificationInfoResponse
    {
        public string Id { get; set; }
        public string Text { get; set; }
        public string Date { get; set; }
        public bool Read { get; set; }
        public string UserId { get; set; }

        public NotificationInfoResponse(Notification Notification)
        {
            this.Id = Notification.Id.ToString();
            this.Text = Notification.Text;
            this.Date = Notification.Date.ToString("dd/MM/yyyy HH:mm");
            this.Read = Notification.Read;
            this.UserId = Notification.UserId.ToString();
        }
    }

    public class CountryInfoResponse
    {
        public string Name { get; set; }
        public string Code { get; set; }
        public string LastSync { get; set; }
    }
}
