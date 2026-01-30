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
      const cacheBuster = `?v=${new Date().getTime()}`;
      setResolvedUrl(pictureUrl + cacheBuster);
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