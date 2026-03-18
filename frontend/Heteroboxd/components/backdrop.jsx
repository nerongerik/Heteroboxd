import { useEffect, useState } from 'react'
import { Image, useWindowDimensions, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../constants/colors'

export const Backdrop = ({ backdropUrl }) => {
  const [ resolvedUrl, setResolvedUrl ] = useState(null)
  const { width } = useWindowDimensions()
  
  useEffect(() => {
    if (!backdropUrl || backdropUrl.length === 0) {
      setResolvedUrl(null)
      return
    }
    setResolvedUrl(width > 1000 ? backdropUrl.replace('original', 'w1280') : backdropUrl.replace('original', 'w780'))
  }, [backdropUrl, width])

  const imageWidth = width > 1000 ? 1000 : width
  const imageHeight = imageWidth / 1.78

  return (
    <View style={{ width: imageWidth, height: imageHeight, alignSelf: 'center' }}>
      <Image
        source={ resolvedUrl && { uri: resolvedUrl } }
        style={{ width: imageWidth, height: imageHeight }}
        resizeMode='cover'
      />
      <LinearGradient
        colors={['transparent', Colors.background]}
        style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 30}}
        start={{ x: 0, y: 0.5 }} 
        end={{ x: 0, y: 1 }} 
      />
      {width > 1000 && (
        <>
          <LinearGradient
            colors={[Colors.background, 'transparent']}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: 10,
            }}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
          <LinearGradient
            colors={['transparent', Colors.background]}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: 10,
            }}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
        </>
      )}
    </View>
  )
}