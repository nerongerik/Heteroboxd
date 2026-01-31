using Amazon.S3;
using Amazon.S3.Model;

namespace Heteroboxd.Integrations
{
    public interface IR2Handler
    {
        Task<(string PresignedUrl, string ImgPath)> GeneratePresignedUrl(Guid UserId);
        Task DeleteByUser(Guid UserId);
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

            var PresignedUrl = await _client.GetPreSignedURLAsync(Request);
            var ImgPath = $"{_config["R2:PublicUrl"]}/{Key}";

            return (PresignedUrl, ImgPath);
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
    }
}
