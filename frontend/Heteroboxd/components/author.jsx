import { Pressable, StyleSheet, View } from 'react-native'
import { Colors } from '../constants/colors'
import HText from './htext'
import { UserAvatar } from './userAvatar'

const Author = ({ userId, url, name, username, admin, router, widescreen, dim = 28 }) => {
  return (
    <Pressable onPress={() => router.push(`/profile/${userId}`)}>
      <View style={{flexDirection: 'row', paddingTop: 5, alignItems: 'center'}}>
        <UserAvatar pictureUrl={url || null} style={[styles.pic, {width: dim, height: dim, borderRadius: dim/2}]} />
        <View style={styles.usernameContainer}>
          <HText style={[styles.name, {fontSize: widescreen ? 16 : 12}]}>
            {name || 'Anonymous'}{admin && <HText style={{color: Colors._heteroboxd}}>{' [ADMIN]'}</HText>}
          </HText>
          {username && <HText style={[styles.username, {fontSize: widescreen ? 14 : 10}]}>{username}</HText>}
        </View>
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
    justifyContent: 'center'
  },
  name: {
    color: Colors.text,
    fontWeight: 'bold'
  },
  username: {
    color: Colors.text,
    fontWeight: 'normal'
  }
})
