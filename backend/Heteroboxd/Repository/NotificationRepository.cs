using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface INotificationRepository
    {
        Task<List<Notification>> GetAllAsync(CancellationToken CancellationToken = default);
        Task<Notification?> GetByIdAsync(Guid NotificationId);
        Task<List<Notification>> GetByUserIdAsync(Guid UserId);
        void Create(Notification Notification);
        void Update(Notification Notification);
        void Delete(Notification Notification);
        Task SaveChangesAsync();
    }

    public class NotificationRepository : INotificationRepository
    {
        private readonly HeteroboxdContext _context;

        public NotificationRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<List<Notification>> GetAllAsync(CancellationToken CancellationToken = default) =>
            await _context.Notifications
                .Where(n => !n.Deleted)
                .ToListAsync(CancellationToken);

        public async Task<Notification?> GetByIdAsync(Guid NotificationId) =>
            await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == NotificationId && !n.Deleted);

        public async Task<List<Notification>> GetByUserIdAsync(Guid UserId) =>
            await _context.Notifications
                .Where(n => !n.Deleted && n.UserId == UserId)
                .ToListAsync();

        public void Create(Notification Notification)
        {
            _context.Notifications.Add(Notification);
        }

        public void Update(Notification Notification)
        {
            _context.Notifications.Update(Notification);
        }

        public void Delete(Notification Notification)
        {
            _context.Notifications.Remove(Notification);
        }

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
