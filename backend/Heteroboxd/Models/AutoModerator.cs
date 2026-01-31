namespace Heteroboxd.Models
{
    public static class AutoModerator
    {
        //rule 1: doxxing
        public const int SocialMediaSolicitation = 2500;

        //rule 2: queershipping
        public const int Queershipping = 1500;

        //rule 3: simping (per occurrence)
        public const int SimpingPerTerm = 1000;
        public const int GoslingianForgiveness = -500;

        //rule 4: blasphemy
        public const int BlasphemyPerTerm = 50000;

        //rule 5: one-liners and low quality
        public const int VeryShortReview = 750;
        public const int ShortReview = 500;
        public const int MemeyPunctuation = 250;

        //bonus
        public const int LongThoughtfulBonus = -200;

        public static readonly HashSet<string> SocialPatterns = new(StringComparer.OrdinalIgnoreCase)
        {
            "instagram", "ig:", "ig ", "insta", "twitter", "tw:", "tw ", "twt", "x", "tiktok", "tt:",
            "tt ", "snapchat", "snap:", "snap ", "sc:", "sc ", "facebook", "fb:", "fb ",
            "discord", "dc:", "dc ", "reddit", "rd:", "rd ", "r/", "tumblr", "tb:", "tb ",
            "onlyfans", "of:", "of ", "telegram", "tg:", "tg ", "whatsapp", "wapp:", "wapp "
        };

        public static readonly HashSet<string> ShippingPatterns = new(StringComparer.OrdinalIgnoreCase)
        {
            " x ", " x", "/ ", " ship", "shipping", "otp", "they're so", "they belong together",
            "would die for", "married", "canon couple", "canon gay", "canon lesbian", "wlw", "mlm",
            "sapphic", "achillean", "yuri", "yaoi", "slash", "fanfic energy", "headcanon gay"
        };

        public static readonly HashSet<string> SimpPatterns = new(StringComparer.OrdinalIgnoreCase)
        {
            " daddy", " mommy", " breed", " step on me", " peg me", " choke me", " rail me",
            " smash", " thirst", " hot", " sexy", " babe", " queen", " king", " zaddy",
            " dilf", " milf", " gilf", " twunk", " bussy", " cake", " gyat", " breedable"
        };

        public static readonly HashSet<string> BlasphemyPatterns = new(StringComparer.OrdinalIgnoreCase)
        {
            "jesus fuck", "christ fuck", "fucking christ", "god damn", "goddamn",
            "jesus fucking", "fuck the holy", "holy shit", "holy fuck", "jesus h christ",
            "christ on a bike", "for fuck's sake jesus", "holy mother of god", "fuck mother"
        };
    }
}
