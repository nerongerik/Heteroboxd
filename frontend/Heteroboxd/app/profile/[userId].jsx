import { StyleSheet, Text, ScrollView, View, TouchableOpacity, Image } from 'react-native'
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';
import { useEffect } from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useState } from 'react';

const Profile = () => {

  const {userId} = useLocalSearchParams();
  const {user} = useAuth();
  const [data, setData] = useState(null);
  useEffect(() => {
    if (user.userId === userId) {
      //load data from user
    } else {
      //dto request
    }
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: "2%" }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profile}>
          <Image
            source={
              user.pictureUrl
                ? { uri: user.pictureUrl }
                : require('../../assets/default-profile.png')
            }
            style={styles.profileImage}
          />
          <Text>{user.name}</Text>
          <FontAwesome5 name="crown" size={24} color={Colors.crown} />
        </View>

        <View style={styles.divider} />

        <View style={styles.bio}>
          <Text>{user.bio}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.movies}>
          <Text>{'[TOP 5 FAVORITES PLACEHOLDER]'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.ratings}>
          <Text>{'[RATINGS GRAPH PLACEHOLDER]'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.movies}>
          <Text>{'[RECENT ACTIVITY PLACEHOLDER]'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.buttons}>
          <TouchableOpacity>
            <Text>Watchlist</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text>Films</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text>Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text>Lists</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text>Likes</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text>Blocked</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: "5%",
    backgroundColor: Colors.background,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bio: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  movies: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 30,
    color: Colors.text_title,
    textAlign: "center"
  },
  ratings: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: "350",
    marginTop: 5,
    marginBottom: 20,
    fontSize: 16,
    color: Colors.text,
    textAlign: "justify",
  },
  divider: {
    height: 1.5,
    backgroundColor: Colors.border_color,
    marginVertical: 20,
    width: "75%",
    alignSelf: "center",
    opacity: 0.5,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: Colors.border_color,
    borderWidth: 1.5,
  },
});