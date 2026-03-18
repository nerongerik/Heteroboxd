import { useEffect, useState } from 'react'
import { Image } from 'react-native'

export const Headshot = ({ pictureUrl, style, wcp = false }) => {
  const [ resolvedUrl, setResolvedUrl ] = useState(null)
  
  useEffect(() => {
    if (!pictureUrl || pictureUrl.length === 0) {
      setResolvedUrl(null)
      return
    }
    setResolvedUrl(pictureUrl.replace('original', wcp ? 'w342' : 'w185'))
  }, [pictureUrl])

  return (
    <Image
      source={ !resolvedUrl ? require("../assets/missing-headshot.png") : { uri: resolvedUrl } }
      style={style}
    />
  )
}
