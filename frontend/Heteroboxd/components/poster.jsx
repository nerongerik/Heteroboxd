import { Image } from "expo-image";

export const Poster = ({ posterUrl, style, other }) => {

  if (!posterUrl) {
    return (
      <Image
        source={other ? require("../assets/before-pick.png") : require("../assets/add-favorite.png")}
        style={style}
      />
    )
  } else {
    return (
      <Image
        source={
          posterUrl === 'error' ? require("../assets/error.png") : posterUrl === 'noposter' ? require("../assets/noposter.png") : { uri: posterUrl.replace('original', 'w342') }}
        style={style}
      />
    )
  }
};
