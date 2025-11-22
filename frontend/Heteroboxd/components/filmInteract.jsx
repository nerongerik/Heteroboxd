import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { UserAvatar } from './userAvatar'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '../constants/colors';
import GlowingText from './glowingText';

const FilmInteract = ({ userAvatar, widescreen }) => {

  if (Platform.OS === 'web') {
    return (
      <GlowingText color={Colors._heteroboxd} div={true}>
        <View style={[styles.card, {width: widescreen ? '50%' : '90%'}]}>
          <TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center' }}>
              <UserAvatar pictureUrl={userAvatar} style={[styles.avatar, {width: widescreen? 28 : 24, height: widescreen ? 28 : 24, borderRadius: widescreen ? 14 : 12}]} />
              <Text style={{color: Colors.text_button, fontSize: widescreen ? 16 : 13}}>Watch, review, or add this film to your lists</Text>
              <MaterialIcons name="more-horiz" size={widescreen ? 24 : 20} color={Colors.text_button} />
            </View>
          </TouchableOpacity>
        </View>
      </GlowingText>
  )
  } else {
    return (
      <View style={[styles.card, {width: '90%', borderWidth: 2, borderColor: Colors._heteroboxd}]}>
        <TouchableOpacity>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center' }}>
            <UserAvatar pictureUrl={userAvatar} style={[styles.avatar, {width: 24, height: 24, borderRadius: 12}]} />
            <Text style={{color: Colors.text_button, fontSize: 13}}>Watch, review, or add this film to your lists</Text>
            <MaterialIcons name="more-horiz" size={20} color={Colors.text_button} />
          </View>
        </TouchableOpacity>
      </View>
    )
  }
}

export default FilmInteract

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 2,
    alignSelf: 'center',
    marginVertical: 10
  },
  avatar: {
    borderWidth: 2,
    borderColor: Colors.border_color,
  }
})