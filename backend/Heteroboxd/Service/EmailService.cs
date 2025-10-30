using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.AspNetCore.Identity.UI.Services;

public class EmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailSender> _logger;

    public EmailSender(IConfiguration configuration, ILogger<EmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string Email, string Subject, string HtmlMessage)
    {
        _logger.LogInformation($"EmailSender hit with: {HtmlMessage}");

        var Message = new MimeMessage();
        Message.From.Add(MailboxAddress.Parse(_configuration["Email:Username"]));
        Message.To.Add(MailboxAddress.Parse(Email));
        Message.Subject = Subject;

        Message.Body = new TextPart("html")
        {
            Text = HtmlMessage
        };

        try
        {
            using var Client = new SmtpClient();
            await Client.ConnectAsync(_configuration["Email:SmtpServer"], int.Parse(_configuration["Email:Port"]), MailKit.Security.SecureSocketOptions.StartTls);
            await Client.AuthenticateAsync(_configuration["Email:Username"], _configuration["Email:Password"]);
            await Client.SendAsync(Message);
            await Client.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", Email);
        }
    }
}
