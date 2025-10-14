using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Heteroboxd.Service
{
    public interface IEmailService
    {
        Task SendVerification(string Email, string Code);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendVerification(string Email, string Code)
        {
            var VerifyUrl = $"{_configuration["Frontend:BaseUrl"]}/verify?code={Code}";
            var body = $@"
                <html>
                    <body>
                        <p>Welcome Aboard!</p>
                        <p>Please verify your account by clicking <a href=""{VerifyUrl}"">HERE</a>. (The link is valid for 24 hours)</p>
                    </body>
                </html>";

            var Message = new MimeMessage();
            Message.From.Add(new MailboxAddress("Heteroboxd", _configuration["Email:From"]));
            Message.To.Add(new MailboxAddress("", Email));
            Message.Subject = "Verify Your Account";
            Message.Body = new TextPart("html") { Text = body };

            using var Client = new SmtpClient();
            await Client.ConnectAsync(_configuration["Email:SmtpServer"],
                                      int.Parse(_configuration["Email:Port"]),
                                      SecureSocketOptions.StartTls);

            await Client.AuthenticateAsync(_configuration["Email:Username"], _configuration["Email:Password"]);

            await Client.SendAsync(Message);
            await Client.DisconnectAsync(true);
        }
    }
}
