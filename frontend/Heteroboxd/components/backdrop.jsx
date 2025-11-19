import { useEffect, useState } from "react";
import MaskedView from "@react-native-masked-view/masked-view";
import LinearGradient from "react-native-linear-gradient";
import { Image, Platform, useWindowDimensions } from "react-native";

export const Backdrop = ({ backdropUrl }) => {
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (backdropUrl === 'error') {
      setResolvedUrl('error');
    } else {
      setResolvedUrl(backdropUrl);
    }
  }, [backdropUrl]);

  const imageWidth = Platform.OS === 'web' && width > 1000 ? 1000 : width;
  const imageHeight = imageWidth / 1.78;

  return (
    <MaskedView
      style={{ width: imageWidth, height: imageHeight }}
      maskElement={
        <LinearGradient
          colors={["white", "transparent"]}
          locations={[0, 1]}
          style={{ flex: 1 }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      }
    >
      <Image
        source={
          resolvedUrl === 'error'
            ? require("../assets/error.png")
            : { uri: resolvedUrl }
        }
        style={{ width: imageWidth, height: imageHeight }}
      />
    </MaskedView>
  );
};
