import { StyleSheet, Text, View, Pressable } from 'react-native';
import GlowingText from './glowingText';
import { UserAvatar } from './userAvatar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const Author = ({userId, url, username, tier, patron, router, widescreen}) => {
  return (
    <Pressable onPress={() => router.push(`/profile/${userId}`)}>
      <View style={styles.container}>
        <UserAvatar pictureUrl={url} style={styles.pic} />
        {
          tier === 'free' ? (
            <View style={styles.usernameContainer}>
              <Text style={[styles.username, {fontSize: widescreen ? 20 : 16}]}>
                {username}
              </Text>
              {(patron && <MaterialCommunityIcons style={{paddingLeft: 5}} name="crown" size={widescreen ? 24 : 20} color={Colors.heteroboxd}/>)}
            </View>
          ) : tier === 'admin' ? (
            <GlowingText color={Colors._heteroboxd} size={widescreen ? 20 : 16}>
              {username}
            </GlowingText>
          ) : (
            <View style={styles.usernameContainer}>
              <GlowingText color={Colors.heteroboxd} size={widescreen ? 20 : 16}>
                {username}
              </GlowingText>
              {patron && <MaterialCommunityIcons style={{paddingLeft: 5}} name="crown" size={widescreen ? 24 : 20} color={Colors.heteroboxd}/>}
            </View>
          )
        }
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
    fontWeight: 'bold'
  }
})