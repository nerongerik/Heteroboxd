namespace Heteroboxd.Models.DTO
{
    public class CreateReviewRequest
    {
        public double Rating { get; set; }
        public string? Text { get; set; }
        public bool Spoiler { get; set; }
        public string AuthorId { get; set; }
        public int FilmId { get; set; }
    }

    public class UpdateReviewRequest
    {
        public string ReviewId { get; set; }
        public double? Rating { get; set; }
        public string? Text { get; set; }
        public bool? Spoiler { get; set; }
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

    public class UpdateUserListBulkRequest
    {
        public string AuthorId { get; set; }
        public int FilmId { get; set; }
        public List<KeyValuePair<string, int>> Lists { get; set; }
    }

    public class CreateListEntryRequest
    {
        public int FilmId { get; set; }
        public int Position { get; set; }
    }

    public class CreateCommentRequest
    {
        public string Text { get; set; }
        public string AuthorId { get; set; }
        public string AuthorName { get; set; }
        public string ReviewId { get; set; }
        public string FilmTitle { get; set; }
    }

    public class UpdateUserRequest
    {
        public string UserId { get; set; }
        public string? Name { get; set; }
        public bool GeneratePresign { get; set; }
        public string? Bio { get; set; }
    }

    public class UpdateUserLikesRequest
    {
        public string UserId { get; set; } //who likes it
        public string UserName { get; set; } //his display
        public string AuthorId { get; set; } //who gets a notification
        public string? ReviewId { get; set; } //target
        public string? FilmTitle { get; set; } //if review
        public string? ListId { get; set; } //target
        public string? ListName { get; set; } //if list
        public int LikeChange { get; set; } // +1 or -1
    }

    public class RegisterRequest()
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string? PictureExtension { get; set; } //null -> default avatar
        public string? Bio { get; set; }
        public string Gender { get; set; }
    }

    public class LoginRequest()
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class ResetPasswordRequest
    {
        public string UserId { get; set; }
        public string Token { get; set; }
        public string NewPassword { get; set; }
    }
}
