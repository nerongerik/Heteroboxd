using Amazon.S3;
using Amazon.S3.Model;

namespace Heteroboxd.Integrations
{
    public interface IR2Handler
    {
        Task<(string PresignedUrl, string ImgPath)> GeneratePresignedUrl(Guid UserId, string FileExtension);
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

        public async Task<(string PresignedUrl, string ImgPath)> GeneratePresignedUrl(Guid UserId, string FileExtension)
        {
            string Key = $"{UserId}{FileExtension}";

            var Request = new GetPreSignedUrlRequest
            {
                BucketName = _config["R2:BucketName"],
                Key = Key,
                Expires = DateTime.UtcNow.AddMinutes(15),
                Verb = HttpVerb.PUT,
                ContentType = GetContentType(FileExtension)
            };

            var PresignedUrl = await _client.GetPreSignedURLAsync(Request);
            var ImgPath = $"{_config["R2:PublicUrl"]}/{Key}";

            return (PresignedUrl, ImgPath);
        }

        public string GetContentType(string FileExtension)
        {
            return FileExtension.ToLower() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                _ => "application/octet-stream",
            };
        }
    }
}
