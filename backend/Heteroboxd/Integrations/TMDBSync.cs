namespace Heteroboxd.Integrations
{
    public class TMDBSync
    {
        //will somehow be incorporated into a wider monitoring system that only does things once per 24 hours
        //other subsystems will purge database of logically deleted entities, delete expired notifications, used tokens, etc.
        //this one in particular needs to make a changes call to tmdb to get the latest changes on films, celebrities, and collections so we can update them in our DB
    }
}
