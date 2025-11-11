import { Animated, Platform, StyleSheet } from "react-native";
import { useEffect, useRef, useState } from "react";

const GlowingText = ({ children, color }) => {
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Web-specific glow level
  const [glow, setGlow] = useState(0);

  useEffect(() => {
    if (Platform.OS === "web") {
      //manual rAF animation because CSS filter animates smoothly
      let frame;
      let direction = 1;

      const animate = () => {
        setGlow(prev => {
          let next = prev + direction * 0.01;
          if (next >= 1 || next <= 0) direction *= -1;
          return next;
        });
        frame = requestAnimationFrame(animate);
      };
      animate();
      return () => cancelAnimationFrame(frame);
    }

    // Mobile native animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  if (Platform.OS === "web") {
    const radius = 4 + glow * 2; //animate
    return (
      <span
        style={{
          fontSize: 28,
          fontWeight: 700,
          textAlign: "center",
          color,
          filter: `drop-shadow(0 0 ${radius}px ${color})`,
        }}
      >
        {children}
      </span>
    );
  }

  //iOS + Android version
  const animatedStyle = {
    textShadowColor: color,
    textShadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [4, 18],
    }),
    textShadowOffset: { width: 0, height: 0 },
    color,
  };

  return <Animated.Text style={[styles.glowBase, animatedStyle]}>{children}</Animated.Text>;
};

export default GlowingText;

const styles = StyleSheet.create({
  glowBase: {
    fontSize: 25,
    fontWeight: "700",
    textAlign: "center",
  },
})