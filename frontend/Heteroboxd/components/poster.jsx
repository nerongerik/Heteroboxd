import { useEffect, useState } from "react";
import { Image } from "react-native";

export const Poster = ({ posterUrl, style, other }) => {
  const [resolvedUrl, setResolvedUrl] = useState(null);

  useEffect(() => {
    if (!posterUrl) {
      setResolvedUrl(null);
    } else {
      setResolvedUrl(posterUrl.replace('original', 'w780'));
    }
  }, [posterUrl]);

  return (
    <Image
      source={
        resolvedUrl === "error"
          ? require("../assets/error.png")
          : resolvedUrl === "more"
            ? require("../assets/load-more.png")
            : resolvedUrl !== null
              ? { uri: resolvedUrl }
              : other
                ? require("../assets/before-pick.png")
                : require("../assets/add-favorite.png")
      }
      style={style}
    />
  );
};
