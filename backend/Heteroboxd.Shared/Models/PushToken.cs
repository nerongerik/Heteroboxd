namespace Heteroboxd.Shared.Models
{
    public class PushToken
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Token { get; set; }
        public DateTime Date { get; set; }

        public PushToken(Guid UserId, string Token)
        {
            if (string.IsNullOrWhiteSpace(Token)) throw new ArgumentException();

            this.Id = Guid.NewGuid();
            this.UserId = UserId;
            this.Token = Token;
            this.Date = DateTime.UtcNow;
        }
    }
}
