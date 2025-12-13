import { View, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const Stars = ({ size, rating = 0, onRatingChange, readonly = false, padding = false }) => {
  const ratingToStars = (rating) => {
    const stars = [];
    let remaining = rating;

    for (let i = 0; i < 5; i++) {
      if (remaining >= 1) stars.push(2);
      else if (remaining >= 0.5) stars.push(1);
      else stars.push(0);
      remaining -= 1;
    }

    return stars;
  };

  const starsToRating = (stars) =>
    stars.reduce(
      (sum, val) => sum + (val === 2 ? 1 : val === 1 ? 0.5 : 0),
      0
    );

  const stars = ratingToStars(rating);

  const handlePress = (index) => {
    if (!onRatingChange || readonly) return;

    const nextStars = [...stars];

    // cycle clicked star: 0 -> 2 -> 1 -> 0
    const current = nextStars[index];
    const next = current === 0 ? 2 : current === 2 ? 1 : 0;
    nextStars[index] = next;

    // fill left
    for (let i = 0; i < index; i++) {
      nextStars[i] = 2;
    }

    // clear right
    for (let i = index + 1; i < nextStars.length; i++) {
      nextStars[i] = 0;
    }

    onRatingChange(starsToRating(nextStars));
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: padding ? 20 : 0,
        paddingVertical: padding ? 10 : 0,
      }}
    >
      {stars.map((starValue, index) => (
        <Pressable
          key={index}
          onPress={readonly ? undefined : () => handlePress(index)}
        >
          {starValue === 2 && (
            <MaterialCommunityIcons
              name="star"
              size={size}
              color={Colors.heteroboxd}
            />
          )}
          {starValue === 1 && (
            <MaterialCommunityIcons
              name="star-half-full"
              size={size}
              color={Colors.heteroboxd}
            />
          )}
          {starValue === 0 && (
            <MaterialIcons
              name="star-outline"
              size={size}
              color={Colors.text}
            />
          )}
        </Pressable>
      ))}
    </View>
  );
};

export default Stars;