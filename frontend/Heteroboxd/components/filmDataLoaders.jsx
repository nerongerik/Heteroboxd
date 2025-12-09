import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Colors } from '../constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const FilmDataLoaders = ({ filmId, watchCount, reviewCount, listsIncluded, widescreen }) => {
  const router = useRouter();

  const formatCount = (n) => {
    if (n < 1000) return n.toString();
    if (n < 1_000_000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
    return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
  };

  return (
    <View style={{flexDirection: 'row', padding: 15, alignItems: 'center', justifyContent: 'center'}}>
      <TouchableOpacity
        style={[styles.button, {marginRight: widescreen ? 35 : 10, backgroundColor: '#01b020', width: widescreen ? 125 : 100}, (watchCount === 0) && {opacity: 0.5}]}
        onPress={() => router.push(`/gotcha`)}
        disabled={watchCount === 0}
      >
        <MaterialCommunityIcons name="eye-outline" size={widescreen ? 32 : 24} color={Colors.text_title} />
        <Text style={[styles.text, {fontSize: widescreen ? 20 : 16}]}>Watched</Text>
        <Text style={[styles.text, {fontSize: widescreen ? 16 : 13, fontWeight: '300'}]}>{formatCount(watchCount)}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, {marginRight: widescreen ? 35 : 10, backgroundColor: Colors.text, width: widescreen ? 125 : 100}, (reviewCount === 0) && {opacity: 0.5}]}
        onPress={() => router.push(`/reviews/film/${filmId}`)}
        disabled={reviewCount === 0}
      >
        <MaterialCommunityIcons name="text-box" size={widescreen ? 32 : 24} color={Colors.text_title} />
        <Text style={[styles.text, {fontSize: widescreen ? 20 : 16}]}>Reviews</Text>
        <Text style={[styles.text, {fontSize: widescreen ? 16 : 13, fontWeight: '300'}]}>{formatCount(reviewCount)}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, {backgroundColor: Colors._heteroboxd, marginRight: 0, width: widescreen ? 125 : 100}, (listsIncluded === 0) && {opacity: 0.5}]}
        onPress={() => router.push(`/lists/film/${filmId}`)}
        disabled={listsIncluded === 0}
      >
        <MaterialCommunityIcons name="format-list-bulleted-square" size={widescreen ? 32 : 24} color={Colors.text_title} />
        <Text style={[styles.text, {fontSize: widescreen ? 20 : 16}]}>Lists</Text>
        <Text style={[styles.text, {fontSize: widescreen ? 16 : 13, fontWeight: '300'}]}>{formatCount(listsIncluded)}</Text>
      </TouchableOpacity>
    </View>
  )
}

export default FilmDataLoaders;

const styles = StyleSheet.create({
  button: {
    borderRadius: 5,
    padding: 5,
    justifyContent: 'flex-start',
  },
  text: {
    color: Colors.text_title,
    fontWeight: '500',
    textAlign: 'left',
  }
})