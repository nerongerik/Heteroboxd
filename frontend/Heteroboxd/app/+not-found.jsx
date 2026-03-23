import { useWindowDimensions, View } from 'react-native'
import { Colors } from '../constants/colors'
import HText from '../components/htext'
import { Image } from 'expo-image'

const NotFound = () => {
  const { width } = useWindowDimensions()

  return (
    <View style={{flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', paddingBottom: 50}}>
      <View style={{width: width > 1000 ? 1000 : width*0.95, alignSelf: 'center'}}>
        <HText style={{fontSize: 20, fontWeight: '500', marginBottom: 5, color: Colors.text_title, textAlign: 'center'}}>404 Not Found</HText>
        <Image style={{alignSelf: 'center', width: 200, height: 200}} source={require('../assets/gotcha.png')} />
      </View>
    </View>
  )
}

export default NotFound