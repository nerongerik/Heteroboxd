import { Image, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Colors } from '../constants/colors'
import HText from '../components/htext'

const Gotcha = () => {
  const {width} = useWindowDimensions()

  return (
    <View style={{flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', paddingBottom: 50}}>
      <View style={{width: width > 1000 ? 1000 : width*0.95, alignSelf: 'center'}}>
        <HText style={styles.title}>Why would you ever need to see which specific users watched the same film as you? Weirdo.</HText>
        <Image style={{alignSelf: 'center'}} source={require('../assets/gotcha.png')} />
        <HText style={styles.text}>When we tell you the watch count, just trust us. You stick to the movies, and we'll handle the numbers {';)'}</HText>
      </View>
    </View>
  )
}

export default Gotcha

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 5,
    color: Colors.text_title,
    textAlign: 'center'
  },
  text: {
    fontWeight: '500',
    marginTop: 5,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center'
  }
})