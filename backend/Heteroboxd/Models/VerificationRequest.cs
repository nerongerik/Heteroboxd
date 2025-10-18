using Heteroboxd.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;

namespace Heteroboxd.Models
{
    public class VerificationRequest
    {
        [Key]
        public Guid Id { get; private set; }
        public string Code { get; private set; }
        public DateTime Expiry { get; private set; }
        public VerificationStatus Status { get; set; }
        public Guid UserId { get; private set; }

        public VerificationRequest() { }

        public VerificationRequest(Guid UserId, string Email)
        {
            this.Id = Guid.NewGuid();
            this.Expiry = DateTime.UtcNow.AddHours(24);
            this.Status = VerificationStatus.Pending;
            this.UserId = UserId;

            byte[] _email = Encoding.UTF8.GetBytes(Email);
            byte[] _code = SHA256.HashData(_email);
            this.Code = BitConverter.ToString(_code).Replace("-", "");
        }
    }
}
