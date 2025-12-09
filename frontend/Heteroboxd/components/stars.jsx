import { View, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { Colors } from '../constants/colors';

const Stars = ({ size, rating = 0, onRatingChange, readonly = false }) => {
  //local state: array of star values (0 = empty, 1 = half, 2 = full)
  const [stars, setStars] = useState([0, 0, 0, 0, 0]);

  //initialize stars from rating prop
  useEffect(() => {
    const initialStars = [];
    let remaining = rating;
    for (let i = 0; i < 5; i++) {
      if (remaining >= 1) initialStars.push(2);
      else if (remaining >= 0.5) initialStars.push(1);
      else initialStars.push(0);
      remaining -= 1;
    }
    setStars(initialStars);
  }, [rating]);

  const handlePress = (index) => {
    setStars((prevStars) => {
      const newStars = [...prevStars];

      //cycle clicked star: 0 -> 2 -> 1 -> 0...
      const current = newStars[index];
      const next = current === 0 ? 2 : current === 2 ? 1 : 0;
      newStars[index] = next;

      //fill all stars to the left of clicked star with full stars
      for (let i = 0; i < index; i++) {
        newStars[i] = 2;
      }

      //empty all stars to the right of clicked star
      for (let i = index + 1; i < newStars.length; i++) {
        newStars[i] = 0;
      }

      //calculate numeric rating
      const newRating = newStars.reduce(
        (sum, val) => sum + (val === 2 ? 1 : val === 1 ? 0.5 : 0),
        0
      );

      //notify parent
      if (onRatingChange) onRatingChange(newRating);

      return newStars;
    });
  };

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', paddingHorizontal: readonly ? 0 : 20, paddingVertical: readonly ? 0 : 10 }}>
      {stars.map((starValue, index) => (
        <Pressable key={index} onPress={readonly ? null : () => handlePress(index)} style={{marginRight: index === 4 ? 0 : 2}}>
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