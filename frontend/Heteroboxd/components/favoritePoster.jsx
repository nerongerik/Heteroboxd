import { useEffect, useState } from "react";
import { Image } from "react-native";

export const FavoritePoster = ({ posterUrl, style, other }) => {
  const [resolvedUrl, setResolvedUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const resolveImage = async () => {
      if (!posterUrl) {
        setResolvedUrl(null);
        return;
      } else if (posterUrl === 'error') {
        setResolvedUrl('error');
        return;
      }

      // FUTURE: If `posterUrl` is actually a storage key, resolve here:
      // const signedUrl = await fetchSignedUrl(posterUrl)
      // if (isMounted) setResolvedUrl(signedUrl);

      setResolvedUrl(posterUrl); //assuming it's ready-to-use
    };

    resolveImage();
    return () => { isMounted = false };
  }, [posterUrl]);

  return (
    <Image
      source={
        resolvedUrl
          ? { uri: resolvedUrl }
          : resolvedUrl === 'error'
            ? require("../assets/error.png")
            : other
              ? require("../assets/before-pick.png")
              : require("../assets/add-favorite.png")
      }
      style={style}
    />
  );
};
