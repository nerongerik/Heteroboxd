import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Platform, useWindowDimensions, View } from "react-native";
import { Colors } from "../constants/colors";

export const Backdrop = ({ backdropUrl, narrow }) => {
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (!backdropUrl) {
      setResolvedUrl(null);
    }
    else if (backdropUrl === 'error') {
      setResolvedUrl('error');
    } else {
      setResolvedUrl(width > 1000 ? backdropUrl.replace('original', 'w1280') : backdropUrl.replace('original', 'w780'));
    }
  }, [backdropUrl, width]);

  const imageWidth = (Platform.OS === 'web' && width > 1000) ? (narrow) ? 500 : 1000 : width;
  const imageHeight = imageWidth / 1.78;

  return (
    <View style={{ width: imageWidth, height: imageHeight, alignSelf: 'center' }} pointerEvents='none'>
      <Image
        source={
          resolvedUrl === 'error'
            ? require("../assets/error.png")
            : { uri: resolvedUrl }
        }
        style={{ width: imageWidth, height: imageHeight }}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', Colors.background]}
        style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 30}}
        // Start the gradient at the bottom (y=0.5) and end at the bottom edge (y=1)
        start={{ x: 0, y: 0.5 }} 
        end={{ x: 0, y: 1 }} 
      />

      {(Platform.OS === 'web' && width > 1000) && (
        <>
          <LinearGradient
            colors={[Colors.background, "transparent"]}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: 10,
            }}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
          <LinearGradient
            colors={["transparent", Colors.background]}
            style={{
              position: "absolute",
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
  );
};
