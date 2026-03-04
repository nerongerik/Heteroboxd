import { StyleSheet, Text, View, Pressable } from 'react-native';
import { UserAvatar } from './userAvatar';
import { Colors } from '../constants/colors';

const Author = ({userId, url, username, admin, router, widescreen}) => {
  return (
    <Pressable onPress={() => router.push(`/profile/${userId}`)}>
      <View style={styles.container}>
        <UserAvatar pictureUrl={url} style={styles.pic} />
        <Text style={[styles.username, {fontSize: widescreen ? 20 : 16}]}>
          {username}{admin && <Text style={{color: Colors._heteroboxd}}>{' [ADMIN]'}</Text>}
        </Text>
      </View>
    </Pressable>
  )
}

export default Author

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: 5,
    alignItems: 'center'
  },
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