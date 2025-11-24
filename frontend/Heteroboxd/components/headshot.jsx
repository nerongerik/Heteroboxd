import { useEffect, useState } from "react";
import { Image } from "react-native";

export const Headshot = ({ pictureUrl, style }) => {
  const [resolvedUrl, setResolvedUrl] = useState(null);

  useEffect(() => {
    if (!pictureUrl) {
        setResolvedUrl(null);
    } else {
        setResolvedUrl(pictureUrl.replace('original', 'w185'));
    }
  }, [pictureUrl]);

  return (
    <Image
      source={
        resolvedUrl === "error"
          ? require("../assets/error.png")
          : resolvedUrl === null || resolvedUrl === undefined || resolvedUrl === ""
              ? require("../assets/missing-headshot.png")
              : { uri: resolvedUrl }
      }
      style={style}
    />
  );
};
