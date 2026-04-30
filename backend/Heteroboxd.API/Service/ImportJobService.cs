using Heteroboxd.Shared.Integrations;
using Heteroboxd.Shared.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Repository;

namespace Heteroboxd.API.Service
{
    public interface IImportJobService
    {
        Task<ImportJobStatus> GetImportJobStatus(string UserId);
        Task<(string PresignedUrl, string Path)> SignImportJob(string UserId);
        Task EnqueueImportJob(string UserId);
    }

    public class ImportJobService : IImportJobService
    {
        private readonly IImportJobRepository _repo;
        private readonly IR2Handler _r2Handler;

        public ImportJobService(IImportJobRepository repo, IR2Handler r2Handler)
        {
            _repo = repo;
            _r2Handler = r2Handler;
        }

        public async Task<ImportJobStatus> GetImportJobStatus(string UserId)
        {
            var ImportJob = await _repo.GetByUserAsync(Guid.Parse(UserId));
            if (ImportJob == null) throw new KeyNotFoundException();
            return ImportJob.Status;
        }

        public async Task<(string PresignedUrl, string Path)> SignImportJob(string UserId)
        {
            var Existing = await _repo.GetByUserAsync(Guid.Parse(UserId));
            if (Existing != null && Existing.Status != ImportJobStatus.Failed) throw new ArgumentException(Existing.Date.ToString("dd/MM/yyyy HH:mm"));
            return await _r2Handler.GeneratePresignedUrl(Guid.Parse(UserId), 1);
        }

        public async Task EnqueueImportJob(string UserId)
        {
            try
            {
                await _repo.CreateAsync(new ImportJob(Guid.Parse(UserId)));
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
            {
                var Existing = await _repo.GetByUserAsync(Guid.Parse(UserId));
                throw new ArgumentException(Existing!.Date.ToString("dd/MM/yyyy HH:mm"));
            }
        }
    }
}
