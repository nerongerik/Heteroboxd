import { View, Pressable } from 'react-native'
import Star1 from '../assets/icons/star1.svg'
import Star2 from '../assets/icons/star2.svg'
import Star3 from '../assets/icons/star3.svg'

const Stars = ({ size, rating = 0, onRatingChange, readonly = false, padding = false, align }) => {
  const ratingToStars = (rating) => {
    const stars = []
    let remaining = rating
    for (let i = 0; i < 5; i++) {
      if (remaining >= 1) stars.push(2)
      else if (remaining >= 0.5) stars.push(1)
      else stars.push(0)
      remaining -= 1
    }
    return stars
  }
  const starsToRating = (stars) => stars.reduce((sum, val) => sum + (val === 2 ? 1 : val === 1 ? 0.5 : 0), 0)

  const stars = ratingToStars(rating)

  const handlePress = (index) => {
    if (!onRatingChange || readonly) return
    const nextStars = [...stars]
    const current = nextStars[index]
    const next = current === 0 ? 2 : current === 2 ? 1 : 0
    nextStars[index] = next
    for (let i = 0; i < index; i++) {
      nextStars[i] = 2
    }
    for (let i = index + 1; i < nextStars.length; i++) {
      nextStars[i] = 0
    }
    onRatingChange(starsToRating(nextStars))
  }

  return (
    <View
      style={{flexDirection: 'row', justifyContent: align ? align : 'center', paddingHorizontal: padding ? 20 : 0, paddingVertical: padding ? 10 : 0}}
    >
      {stars.map((starValue, index) => (
        <Pressable
          key={index}
          onPress={readonly ? undefined : () => handlePress(index)}
        >
          {starValue === 2 && (<Star3 width={size} height={size} />)}
          {starValue === 1 && (<Star2 width={size} height={size} />)}
          {starValue === 0 && (<Star1 width={size} height={size} />)}
        </Pressable>
      ))}
    </View>
  )
}

export default Stars