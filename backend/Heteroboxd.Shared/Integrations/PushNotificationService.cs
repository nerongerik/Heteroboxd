using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Heteroboxd.Shared.Models.Enums;
using Heteroboxd.Shared.Repository;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using DomainNotification = Heteroboxd.Shared.Models.Notification;

namespace Heteroboxd.Shared.Integrations
{
    public interface IPushNotificationService
    {
        Task SendAsync(List<DomainNotification> Notifications, CancellationToken CT = default);
    }

    public class NoOpPushNotificationService : IPushNotificationService
    {
        public Task SendAsync(List<DomainNotification> Notifications, CancellationToken CT = default) =>
            Task.CompletedTask;
    }

    public class FirebasePushNotificationService : IPushNotificationService
    {
        private const string AndroidChannelId = "default";
        private const int DefaultTimeoutSeconds = 15;
        private const int MinimumTimeoutSeconds = 1;
        private const int MaximumTimeoutSeconds = 60;
        private const int MaximumTokensPerMulticast = 500;

        private readonly IPushTokenRepository _pushTokenRepository;
        private readonly FirebaseMessaging _messaging;
        private readonly ILogger<FirebasePushNotificationService> _logger;
        private readonly int _timeoutSeconds;

        public FirebasePushNotificationService(
            IPushTokenRepository pushTokenRepository,
            FirebaseMessaging messaging,
            IConfiguration config,
            ILogger<FirebasePushNotificationService> logger)
        {
            _pushTokenRepository = pushTokenRepository;
            _messaging = messaging;
            _logger = logger;

            _timeoutSeconds = int.TryParse(config["Push:TimeoutSeconds"], out var ConfiguredTimeout)
                ? Math.Clamp(ConfiguredTimeout, MinimumTimeoutSeconds, MaximumTimeoutSeconds)
                : DefaultTimeoutSeconds;
        }

        public async Task SendAsync(List<DomainNotification> Notifications, CancellationToken CT = default)
        {
            if (Notifications.Count == 0) return;

            using var TimeoutCTS = new CancellationTokenSource(TimeSpan.FromSeconds(_timeoutSeconds));
            using var LinkedCTS = CancellationTokenSource.CreateLinkedTokenSource(CT, TimeoutCTS.Token);
            var DeliveryCT = LinkedCTS.Token;
            var InvalidTokens = new HashSet<string>(StringComparer.Ordinal);
            int SuccessCount = 0;
            int FailureCount = 0;

            _logger.LogInformation(
                "Processing {NotificationCount} persisted notifications for push delivery",
                Notifications.Count);

            try
            {
                var UserIds = Notifications.Select(n => n.UserId).Distinct().ToList();
                var PushTokens = await _pushTokenRepository.GetByUserIdsAsync(UserIds, DeliveryCT);
                var TokensByUser = PushTokens
                    .GroupBy(pt => pt.UserId)
                    .ToDictionary(
                        group => group.Key,
                        group => group.Select(pt => pt.Token).Distinct(StringComparer.Ordinal).ToList());

                foreach (var Notification in Notifications)
                {
                    DeliveryCT.ThrowIfCancellationRequested();

                    if (!TokensByUser.TryGetValue(Notification.UserId, out var RecipientTokens)) continue;

                    foreach (var TokenChunk in RecipientTokens.Chunk(MaximumTokensPerMulticast))
                    {
                        DeliveryCT.ThrowIfCancellationRequested();

                        var Message = CreateMessage(Notification, TokenChunk);

                        try
                        {
                            var Response = await _messaging.SendEachForMulticastAsync(Message, DeliveryCT);
                            SuccessCount += Response.SuccessCount;
                            FailureCount += Response.FailureCount;

                            CollectInvalidTokens(TokenChunk, Response, InvalidTokens, Notification.Id);
                        }
                        catch (OperationCanceledException) when (DeliveryCT.IsCancellationRequested)
                        {
                            throw;
                        }
                        catch (FirebaseMessagingException ex)
                        {
                            FailureCount += TokenChunk.Length;
                            _logger.LogWarning(
                                "Firebase rejected a multicast request for notification {NotificationId}; code {MessagingErrorCode}, token count {TokenCount}",
                                Notification.Id,
                                ex.MessagingErrorCode?.ToString() ?? "Unknown",
                                TokenChunk.Length);
                        }
                        catch (Exception ex)
                        {
                            FailureCount += TokenChunk.Length;
                            _logger.LogWarning(
                                "Push multicast request failed for notification {NotificationId}; exception type {ExceptionType}, token count {TokenCount}",
                                Notification.Id,
                                ex.GetType().Name,
                                TokenChunk.Length);
                        }
                    }
                }

                if (InvalidTokens.Count > 0)
                {
                    try
                    {
                        await _pushTokenRepository.DeleteByTokensAsync(InvalidTokens.ToList(), DeliveryCT);
                        _logger.LogInformation(
                            "Removed {InvalidTokenCount} definitively invalid push tokens",
                            InvalidTokens.Count);
                    }
                    catch (OperationCanceledException) when (DeliveryCT.IsCancellationRequested)
                    {
                        throw;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(
                            "Invalid push token cleanup failed; exception type {ExceptionType}, token count {TokenCount}",
                            ex.GetType().Name,
                            InvalidTokens.Count);
                    }
                }

                _logger.LogInformation(
                    "Push delivery completed with {SuccessCount} successful sends and {FailureCount} failed sends",
                    SuccessCount,
                    FailureCount);
            }
            catch (OperationCanceledException) when (TimeoutCTS.IsCancellationRequested)
            {
                _logger.LogWarning(
                    "Push delivery timed out after {TimeoutSeconds} seconds with {SuccessCount} successful sends and {FailureCount} failed sends",
                    _timeoutSeconds,
                    SuccessCount,
                    FailureCount);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation(
                    "Push delivery was cancelled with {SuccessCount} successful sends and {FailureCount} failed sends",
                    SuccessCount,
                    FailureCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    "Push delivery failed safely; exception type {ExceptionType}, notification count {NotificationCount}",
                    ex.GetType().Name,
                    Notifications.Count);
            }
        }

        private MulticastMessage CreateMessage(DomainNotification Notification, string[] Tokens) =>
            new MulticastMessage
            {
                Tokens = Tokens,
                Notification = new FirebaseAdmin.Messaging.Notification
                {
                    Title = ResolveTitle(Notification),
                    Body = Notification.Text
                },
                Data = new Dictionary<string, string>
                {
                    ["notificationId"] = Notification.Id.ToString("D"),
                    ["referencedObject"] = Notification.ReferencedObject.ToString(),
                    ["referenceId"] = Notification.ReferenceId
                },
                Android = new AndroidConfig
                {
                    Priority = Priority.High,
                    Notification = new AndroidNotification
                    {
                        ChannelId = AndroidChannelId,
                        DefaultVibrateTimings = true
                    }
                }
            };

        private static string ResolveTitle(DomainNotification Notification) =>
            Notification.ReferencedObject switch
            {
                ReferencedObject.Profile => "New Follower!",
                ReferencedObject.Film => "New Celebrity Appearance!",
                ReferencedObject.Comment => "New Comment!",
                ReferencedObject.Review when IsFriendActivity(Notification.Text, " just reviewed ") => "Activity from Friends!",
                ReferencedObject.UserList when IsFriendActivity(Notification.Text, " just created a new list ") => "Activity from Friends!",
                ReferencedObject.Review or ReferencedObject.UserList => "New Like!",
                _ => throw new ArgumentOutOfRangeException(nameof(Notification.ReferencedObject))
            };

        private static bool IsFriendActivity(string Text, string ActivityText) =>
            Text.StartsWith("Your friend ", StringComparison.Ordinal) &&
            Text.Contains(ActivityText, StringComparison.Ordinal);

        private void CollectInvalidTokens(
            string[] Tokens,
            BatchResponse Response,
            HashSet<string> InvalidTokens,
            Guid NotificationId)
        {
            bool HasSuccessfulSibling = Response.SuccessCount > 0;

            for (int i = 0; i < Response.Responses.Count; i++)
            {
                var SendResponse = Response.Responses[i];
                if (SendResponse.IsSuccess) continue;

                var MessagingErrorCode = (SendResponse.Exception as FirebaseMessagingException)?.MessagingErrorCode;
                _logger.LogWarning(
                    "Push token send failed for notification {NotificationId}; code {MessagingErrorCode}",
                    NotificationId,
                    MessagingErrorCode?.ToString() ?? "Unknown");

                if (MessagingErrorCode == FirebaseAdmin.Messaging.MessagingErrorCode.Unregistered ||
                    (MessagingErrorCode == FirebaseAdmin.Messaging.MessagingErrorCode.InvalidArgument && HasSuccessfulSibling))
                {
                    InvalidTokens.Add(Tokens[i]);
                }
            }
        }
    }

    public enum PushNotificationInitializationStatus
    {
        Disabled,
        Enabled,
        Failed
    }

    public record PushNotificationInitializationResult(
        PushNotificationInitializationStatus Status,
        string? ExceptionType = null);

    public static class PushNotificationBootstrap
    {
        public static PushNotificationInitializationResult Configure(
            IServiceCollection Services,
            IConfiguration Config)
        {
            bool Enabled = bool.TryParse(Config["Push:Enabled"], out var ConfiguredEnabled) && ConfiguredEnabled;

            if (!Enabled)
            {
                Services.AddSingleton<IPushNotificationService, NoOpPushNotificationService>();
                return new PushNotificationInitializationResult(PushNotificationInitializationStatus.Disabled);
            }

            try
            {
                var CredentialsJson = Config["Push:FirebaseCredentialsJson"];
                if (string.IsNullOrWhiteSpace(CredentialsJson))
                    throw new InvalidOperationException("Firebase credentials are not configured.");

                using var CredentialsStream = new MemoryStream(
                    System.Text.Encoding.UTF8.GetBytes(CredentialsJson));
                var ServiceAccount = ServiceAccountCredential
                    .FromServiceAccountData(CredentialsStream);
                var FirebaseApplication = FirebaseApp.Create(new AppOptions
                {
                    Credential = GoogleCredential.FromServiceAccountCredential(ServiceAccount),
                    ProjectId = ServiceAccount.ProjectId
                });
                var Messaging = FirebaseMessaging.GetMessaging(FirebaseApplication);

                Services.AddSingleton(Messaging);
                Services.AddScoped<IPushNotificationService, FirebasePushNotificationService>();

                return new PushNotificationInitializationResult(PushNotificationInitializationStatus.Enabled);
            }
            catch (Exception ex)
            {
                Services.AddSingleton<IPushNotificationService, NoOpPushNotificationService>();
                return new PushNotificationInitializationResult(
                    PushNotificationInitializationStatus.Failed,
                    ex.GetType().Name);
            }
        }
    }
}
