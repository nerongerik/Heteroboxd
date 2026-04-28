using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;

namespace Heteroboxd.Shared.Integrations
{
    public interface IR2Handler
    {
        Task<(string PresignedUrl, string ImgPath)> GeneratePresignedUrl(Guid UserId);
        Task<(string PresignedUrl, string ZipPath)> GenerateImportJobPresignedUrl(Guid UserId, string FileName);
        Task DeleteByUser(Guid UserId);
        Task DeleteImportJobByKey(string Key);
    }

    public class R2Handler : IR2Handler
    {
        private readonly AmazonS3Client _client;
        private readonly IConfiguration _config;

        public R2Handler(IConfiguration config)
        {
            //R2 is fully S3-compatible
            var R2Config = new AmazonS3Config
            {
                ServiceURL = config["R2:AccountUrl"],
                ForcePathStyle = true
            };

            _client = new AmazonS3Client(
                config["R2:AccessKeyId"],
                config["R2:SecretAccessKey"],
                R2Config
            );

            _config = config;
        }

        public async Task<(string PresignedUrl, string ImgPath)> GeneratePresignedUrl(Guid UserId)
        {
            string Key = $"{UserId}.png";

            var Request = new GetPreSignedUrlRequest
            {
                BucketName = _config["R2:BucketName"],
                Key = Key,
                Expires = DateTime.UtcNow.AddMinutes(15),
                Verb = HttpVerb.PUT,
                ContentType = "image/png"
            };

            Request.Headers["Cache-Control"] = "no-cache";

            var PresignedUrl = await _client.GetPreSignedURLAsync(Request);
            var ImgPath = $"{_config["R2:PublicUrl"]}/{Key}";

            return (PresignedUrl, ImgPath);
        }

        public async Task<(string PresignedUrl, string ZipPath)> GenerateImportJobPresignedUrl(Guid UserId, string FileName)
        {
            string Key = $"{UserId}/{FileName}";

            var Request = new GetPreSignedUrlRequest
            {
                BucketName = _config["R2:BucketName"],
                Key = Key,
                Expires = DateTime.UtcNow.AddMinutes(30),
                Verb = HttpVerb.PUT,
                ContentType = "application/zip"
            };

            Request.Headers["Cache-Control"] = "no-cache";

            var PresignedUrl = await _client.GetPreSignedURLAsync(Request);
            var ZipPath = $"{_config["R2:PublicUrl"]}/{Key}";

            return (PresignedUrl, ZipPath);
        }

        public async Task DeleteByUser(Guid UserId)
        {
            try
            {
                var Request = new DeleteObjectRequest
                {
                    BucketName = _config["R2:BucketName"],
                    Key = $"{UserId}.png"
                };
                await _client.DeleteObjectAsync(Request);
            }
            catch (Exception e)
            {
                Console.WriteLine($"Failed to delete object {UserId}.png: {e.Message}");
            }
        }

        public async Task DeleteImportJobByKey(string Key)
        {
            try
            {
                var Request = new DeleteObjectRequest
                {
                    BucketName = _config["R2:BucketName"],
                    Key = Key.Replace($"{_config["R2:PublicUrl"]}/", "")
                };
                await _client.DeleteObjectAsync(Request);
            }
            catch (Exception e)
            {
                Console.WriteLine($"Failed to delete object {Key}: {e.Message}");
            }
        }
    }
}
