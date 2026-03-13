import { Pressable, StyleSheet, View } from 'react-native'
import { Colors } from '../constants/colors'
import HText from './htext'
import { UserAvatar } from './userAvatar'

const Author = ({ userId, url, username, admin, router, widescreen, dim = 26 }) => {
  return (
    <Pressable onPress={() => router.push(`/profile/${userId}`)}>
      <View style={{flexDirection: 'row', paddingTop: 5, alignItems: 'center'}}>
        <UserAvatar pictureUrl={url || null} style={[styles.pic, {width: dim, height: dim, borderRadius: dim/2}]} />
        <HText style={[styles.username, {fontSize: widescreen ? 20 : 16}]}>
          {username || 'Anonymous'}{admin && <HText style={{color: Colors._heteroboxd}}>{' [ADMIN]'}</HText>}
        </HText>
      </View>
    </Pressable>
  )
}

export default Author

const styles = StyleSheet.create({
  pic: {
    marginRight: 5,
    borderWidth: 1,
    borderColor: Colors.border_color
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  username: {
    color: Colors.text,
    fontWeight: 'bold',
    lineHeight: 26
  }
})