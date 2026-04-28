using Heteroboxd.Shared.Data;
using Heteroboxd.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Shared.Repository
{
    public interface IImportJobRepository
    {
        Task<ImportJob?> GetByUserAsync(Guid UserId);
        Task CreateAsync(ImportJob ImportJob);
    }

    public class ImportJobRepository : IImportJobRepository
    {
        private readonly HeteroboxdContext _context;

        public ImportJobRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<ImportJob?> GetByUserAsync(Guid UserId)
        {
            return await _context.ImportJobs
                .FirstOrDefaultAsync(ij => ij.UserId == UserId);
        }

        public async Task CreateAsync(ImportJob ImportJob)
        {
            _context.ImportJobs.Add(ImportJob);
            await _context.SaveChangesAsync();
        }
    }
}
