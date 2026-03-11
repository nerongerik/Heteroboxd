import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../constants/colors'
import { UserAvatar } from './userAvatar'

const Author = ({ userId, url, username, admin, router, widescreen }) => {
  return (
    <Pressable onPress={() => router.push(`/profile/${userId}`)}>
      <View style={{flexDirection: 'row', paddingTop: 5, alignItems: 'center'}}>
        <UserAvatar pictureUrl={url || null} style={styles.pic} />
        <Text style={[styles.username, {fontSize: widescreen ? 20 : 16}]}>
          {username || 'Anonymous'}{admin && <Text style={{color: Colors._heteroboxd}}>{' [ADMIN]'}</Text>}
        </Text>
      </View>
    </Pressable>
  )
}

export default Author

const styles = StyleSheet.create({
  pic: {
    marginRight: 5,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
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