import { useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'

export const Poster = ({ posterUrl, style, other, wcp = false }) => {
  const { width } = useWindowDimensions()
  const replacer = (width > 700 || wcp) ? 'w342' : 'w154'

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
        source={posterUrl === 'noposter' ? require("../assets/noposter.png") : { uri: posterUrl.replace('original', replacer) }}
        style={style}
        contentFit="cover"
        cachePolicy="disk"
        transition={0}
      />
    )
  }
}
