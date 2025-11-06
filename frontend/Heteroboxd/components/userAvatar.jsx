import { useEffect, useState } from "react";
import { Image } from "react-native";

export const UserAvatar = ({ pictureUrl, style }) => {
  const [resolvedUrl, setResolvedUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const resolveImage = async () => {
      if (!pictureUrl) {
        setResolvedUrl(null);
        return;
      }

      // FUTURE: If `pictureUrl` is actually a storage key, resolve here:
      // const signedUrl = await fetchSignedUrl(pictureUrl)
      // if (isMounted) setResolvedUrl(signedUrl);

      setResolvedUrl(pictureUrl); // For now assume it's ready-to-use
    };

    resolveImage();
    return () => { isMounted = false };
  }, [pictureUrl]);

  return (
    <Image
      source={
        resolvedUrl
          ? { uri: resolvedUrl }
          : require("../assets/default-profile.png")
      }
      style={style}
    />
  );
};
