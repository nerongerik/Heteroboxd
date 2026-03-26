using Azure.Core;
using Microsoft.AspNetCore.Identity.UI.Services;
using System.Text;
using System.Text.Json;

namespace Heteroboxd.API.Service
{
    public class EmailSender : IEmailSender
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailSender> _logger;
        private readonly IHttpClientFactory _httpClientFactory;

        public EmailSender(IConfiguration config, ILogger<EmailSender> logger, IHttpClientFactory httpClientFactory)
        {
            _config = config;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        public Task SendEmailAsync(string Email, string Subject, string HtmlMessage)
        {
            _logger.LogInformation("EmailSender queuing fire-and-forget for: {Email}", Email);

            var ApiKey = _config["Brevo:ApiKey"]!;
            var FromEmail = _config["Brevo:From"]!;
            var FromName = _config["Brevo:FromName"] ?? "Heteroboxd";
            var Client = _httpClientFactory.CreateClient("Brevo");
            var Logger = _logger;

            _ = Task.Run(async () =>
            {
                try
                {
                    await SendViaBrevoAsync(Client, ApiKey, FromEmail, FromName, Email, Subject, HtmlMessage, Logger);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unhandled error in fire-and-forget email to {Email}", Email);
                }
            });

            return Task.CompletedTask;
        }

        private static async Task SendViaBrevoAsync(HttpClient Client, string ApiKey, string FromEmail, string FromName, string ToEmail, string Subject, string HtmlMessage, ILogger Logger)
        {
            var Payload = new
            {
                sender = new { email = FromEmail, name = FromName },
                to = new[] { new { email = ToEmail } },
                subject = Subject,
                htmlContent = HtmlMessage
            };

            var Json = JsonSerializer.Serialize(Payload);
            using var Request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
            Request.Headers.Add("api-key", ApiKey);
            Request.Content = new StringContent(Json, Encoding.UTF8, "application/json");

            var Response = await Client.SendAsync(Request);

            if (Response.IsSuccessStatusCode)
            {
                Logger.LogInformation("Brevo: email sent successfully to {Email}", ToEmail);
            }
            else
            {
                var Body = await Response.Content.ReadAsStringAsync();
                Logger.LogError("Brevo: failed to send email to {Email}. Status: {Status}, Body: {Body}", ToEmail, Response.StatusCode, Body);
            }
        }
    }
}