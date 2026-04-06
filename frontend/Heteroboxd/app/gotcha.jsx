import { StyleSheet, useWindowDimensions, View } from 'react-native'
import Head from 'expo-router/head'
import { Colors } from '../constants/colors'
import HText from '../components/htext'
import { Image } from 'expo-image'

const Gotcha = () => {
  const {width} = useWindowDimensions()

  return (
    <>
    <Head>
      <title>Gotcha!</title>
      <meta name="description" content="This page serves to catch creeps and predators who try to stalk other users in the act." />
      <meta property="og:title" content="Gotcha!" />
      <meta property="og:description" content="This page serves to catch creeps and predators who try to stalk other users in the act." />
      <meta name="robots" content="noindex, nofollow" />
    </Head>
    <View style={{flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', paddingBottom: 50}}>
      <View style={{width: width > 1000 ? 1000 : width*0.95, alignSelf: 'center'}}>
        <HText style={styles.title}>Why would you ever need to see which specific users watched the same movie as you? Weirdo.</HText>
        <Image style={{alignSelf: 'center', width: 200, height: 200}} source={require('../assets/gotcha.png')} />
        <HText style={styles.text}>When we tell you the watch count, just trust us. You stick to the movies, and we'll handle the numbers {';)'}</HText>
      </View>
    </View>
    </>
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