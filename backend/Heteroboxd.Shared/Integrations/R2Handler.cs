using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;

namespace Heteroboxd.Shared.Integrations
{
    public interface IR2Handler
    {
        Task<Stream?> DownloadUserData(Guid UserId);
        Task<(string PresignedUrl, string Path)> GeneratePresignedUrl(Guid UserId, int Type);
        Task DeleteByUser(Guid UserId, int Type);
    }

    public class R2Handler : IR2Handler
    {
        private readonly AmazonS3Client _client;
        private readonly IConfiguration _config;

        public R2Handler(IConfiguration config)
        {
            _client = new AmazonS3Client(
                config["R2:AccessKeyId"],
                config["R2:SecretAccessKey"],
                new AmazonS3Config
                {
                    ServiceURL = config["R2:AccountUrl"],
                    ForcePathStyle = true
                }
            );

            _config = config;
        }

        public async Task<Stream?> DownloadUserData(Guid UserId)
        {
            try
            {
                var Request = new GetObjectRequest
                {
                    BucketName = _config["R2:LetterboxdBucket"],
                    Key = $"{UserId}.zip"
                };
                var Response = await _client.GetObjectAsync(Request);
                return Response.ResponseStream;
            }
            catch
            {
                return null;
            }
        }

        public async Task<(string PresignedUrl, string Path)> GeneratePresignedUrl(Guid UserId, int Type)
        {
            string Key = Type == 0 ? $"{UserId}.png" : $"{UserId}.zip";

            var Request = new GetPreSignedUrlRequest
            {
                BucketName = Type == 0 ? _config["R2:AvatarBucket"] : _config["R2:LetterboxdBucket"],
                Key = Key,
                Expires = DateTime.UtcNow.AddMinutes(15),
                Verb = HttpVerb.PUT,
                ContentType = Type == 0 ? "image/png" : "application/zip"
            };

            var PresignedUrl = await _client.GetPreSignedURLAsync(Request);
            var Path = Type == 0 ? $"{_config["R2:AvatarUrl"]}/{Key}" : $"{_config["R2:LetterboxdUrl"]}/{Key}";

            return (PresignedUrl, Path);
        }

        public async Task DeleteByUser(Guid UserId, int Type)
        {
            try
            {
                var Request = new DeleteObjectRequest
                {
                    BucketName = Type == 0 ? _config["R2:AvatarBucket"] : _config["R2:LetterboxdBucket"],
                    Key = Type == 0 ? $"{UserId}.png" : $"{UserId}.zip"
                };
                await _client.DeleteObjectAsync(Request);
            }
            catch (Exception e)
            {
                Console.WriteLine($"Failed to delete object {UserId}.{(Type == 0 ? "png" : "zip")}: {e.Message}");
            }
        }
    }
}
