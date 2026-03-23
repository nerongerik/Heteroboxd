import { Pressable, StyleSheet, View } from 'react-native'
import Eye from '../assets/icons/eye3.svg'
import Review from '../assets/icons/review.svg'
import List from '../assets/icons/list2.svg'
import * as format from '../helpers/format'
import { Colors } from '../constants/colors'
import HText from './htext'

const FilmDataLoaders = ({ filmId, watchCount, reviewCount, listsIncluded, widescreen, router }) => {
  return (
    <View style={{flexDirection: 'row', padding: 15, alignItems: 'center', justifyContent: 'center'}}>
      <Pressable
        style={[styles.button, {paddingHorizontal: widescreen ? 10 : null, marginRight: widescreen ? 35 : 10, backgroundColor: '#01b020', width: widescreen ? 125 : 100}, (watchCount === 0) && {opacity: 0.5}]}
        onPress={() => router.push(`/gotcha`)}
        disabled={watchCount === 0}
      >
        <Eye width={widescreen ? 32 : 24} height={widescreen ? 32 : 24} />
        <HText style={[styles.text, {fontSize: widescreen ? 20 : 16}]}>Watched</HText>
        <HText style={[styles.text, {fontSize: widescreen ? 16 : 13, fontWeight: '300'}]}> {format.formatCount(watchCount)}</HText>
      </Pressable>

      <Pressable
        style={[styles.button, {paddingHorizontal: widescreen ? 10 : null, marginRight: widescreen ? 35 : 10, backgroundColor: Colors.text, width: widescreen ? 125 : 100}, (reviewCount === 0) && {opacity: 0.5}]}
        onPress={() => router.push(`/reviews/film/${filmId}`)}
        disabled={reviewCount === 0}
      >
        <Review width={widescreen ? 32 : 24} height={widescreen ? 32 : 24} fill={Colors.text_title} />
        <HText style={[styles.text, {fontSize: widescreen ? 20 : 16}]}>Reviews</HText>
        <HText style={[styles.text, {fontSize: widescreen ? 16 : 13, fontWeight: '300'}]}> {format.formatCount(reviewCount)}</HText>
      </Pressable>

      <Pressable
        style={[styles.button, {paddingHorizontal: widescreen ? 10 : null, backgroundColor: Colors._heteroboxd, marginRight: 0, width: widescreen ? 125 : 100}, (listsIncluded === 0) && {opacity: 0.5}]}
        onPress={() => router.push(`/lists/film/${filmId}`)}
        disabled={listsIncluded === 0}
      >
        <List width={widescreen ? 32 : 24} height={widescreen ? 32 : 24} />
        <HText style={[styles.text, {fontSize: widescreen ? 20 : 16}]}>Lists</HText>
        <HText style={[styles.text, {fontSize: widescreen ? 16 : 13, fontWeight: '300'}]}> {format.formatCount(listsIncluded)}</HText>
      </Pressable>
    </View>
  )
}

export default FilmDataLoaders

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