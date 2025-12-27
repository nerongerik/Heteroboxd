import { Image } from "expo-image";
import { useWindowDimensions } from "react-native";

export const Poster = ({ posterUrl, style, other }) => {

  const {width} = useWindowDimensions();
  const replacer = width > 1000 ? 'w342' : 'w154';

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
          posterUrl === 'error' ? require("../assets/error.png") : posterUrl === 'noposter' ? require("../assets/noposter.png") : { uri: posterUrl.replace('original', replacer) }}
        style={style}
        contentFit="cover"
        cachePolicy="disk"
        transition={0}
      />
    )
  }
};
