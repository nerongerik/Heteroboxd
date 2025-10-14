using Heteroboxd.Repository;
using Heteroboxd.Models;
using Heteroboxd.Models.Enums;

namespace Heteroboxd.Service
{
    public interface IVerificationRequestService
    {
        Task<VerificationRequest> GetRequestById(Guid Id);
        Task<VerificationRequest> GetRequestByCode(string Code);
        Task<VerificationRequest> AddRequest(User User);
        Task<Guid> ValidateRequest(string Code);
        Task InvalidateRequest(Guid Id);
    }

    public class VerificationRequestService : IVerificationRequestService
    {
        private readonly IVerificationRequestRepository _repo;

        public VerificationRequestService(IVerificationRequestRepository repo)
        {
            _repo = repo;
        }

        public async Task<VerificationRequest> GetRequestById(Guid Id)
        {
            var Request = await _repo.GetByIdAsync(Id);
            if (Request == null) throw new KeyNotFoundException();
            return Request;
        }

        public async Task<VerificationRequest> GetRequestByCode(string Code)
        {
            var Request = await _repo.GetValidByCodeAsync(Code);
            if (Request == null) throw new KeyNotFoundException();
            return Request;
        }

        public async Task<VerificationRequest> AddRequest(User User)
        {
            VerificationRequest Request = new VerificationRequest(User.Id, User.Email);
            _repo.Create(Request);
            await _repo.SaveChangesAsync();
            return Request;
        }

        public async Task<Guid> ValidateRequest(string Code)
        {
            var Request = await GetRequestByCode(Code); //returns a VALID request
            Request.Status = VerificationStatus.Verified;
            _repo.Update(Request);
            await _repo.SaveChangesAsync();
            return Request.UserId;
        }

        public async Task InvalidateRequest(Guid Id)
        {
            var Request = await GetRequestById(Id);
            Request.Status = VerificationStatus.Expired;
            _repo.Update(Request);
            await _repo.SaveChangesAsync();
        }
    }
}
