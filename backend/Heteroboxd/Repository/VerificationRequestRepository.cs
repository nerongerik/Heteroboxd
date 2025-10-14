using Heteroboxd.Data;
using Heteroboxd.Models;
using Heteroboxd.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface IVerificationRequestRepository
    {
        Task<VerificationRequest?> GetByIdAsync(Guid Id);
        Task<VerificationRequest?> GetValidByCodeAsync(string Code);
        void Create(VerificationRequest Request);
        void Update(VerificationRequest Request);
        void Delete(VerificationRequest Request);
        Task SaveChangesAsync();

    }

    public class VerificationRequestRepository : IVerificationRequestRepository
    {
        private readonly HeteroboxdContext _context;

        public VerificationRequestRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<VerificationRequest?> GetByIdAsync(Guid Id) =>
            await _context.VerificationRequests
                .FirstOrDefaultAsync(vr => vr.Id == Id);

        public async Task<VerificationRequest?> GetValidByCodeAsync(string Code) =>
            await _context.VerificationRequests
                .FirstOrDefaultAsync(vr => Code.Equals(vr.Code) && vr.Expiry >= DateTime.UtcNow && vr.Status.Equals(VerificationStatus.Pending));

        public void Create(VerificationRequest Request)
        {
            _context.Add(Request);
        }

        public void Update(VerificationRequest Request)
        {
            _context.Update(Request);
        }

        public void Delete(VerificationRequest Request)
        {
            _context.Remove(Request);
        }

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
