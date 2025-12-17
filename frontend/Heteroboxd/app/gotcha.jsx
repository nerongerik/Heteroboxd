import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { Colors } from '../constants/colors';

const Gotcha = () => {
  const {width} = useWindowDimensions();

  return (
    <View style={styles.container}>
      <View style={{width: width > 1000 ? 1000 : width*0.9, alignSelf: 'center'}}>
        <Text style={styles.title}>Why would you ever need to see which specific users watched the same film as you? Weirdo.</Text>
        <Image style={{alignSelf: 'center'}} source={require('../assets/gotcha.png')} />
        <Text style={styles.text}>When we tell you the watch count, just trust us. You stick to the movies, and we'll handle the numbers.</Text>
      </View>
    </View>
  )
}

export default Gotcha;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50
  },
  title: {
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 5,
    color: Colors.text_title,
    textAlign: "center"
  },
  text: {
    fontWeight: "500",
    marginTop: 5,
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
  },
});