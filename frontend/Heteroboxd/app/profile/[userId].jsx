import { StyleSheet, Text, ScrollView, View, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';
import { useEffect, useState } from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { UserAvatar } from '../../components/userAvatar';

const Profile = () => {
  const { userId } = useLocalSearchParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!userId) return;

    if (user.userId === userId) {
      // Avoid referencing user directly (prevents logout crash)
      const { name, pictureUrl, bio, tier, expiry, patron, joined, listsCount, followersCount, followingCount, blockedCount, reviewsCount, likes, watched } = user;
      setData({ name, pictureUrl, bio, tier, expiry, patron, joined, listsCount, followersCount, followingCount, blockedCount, reviewsCount, likes, watched });
    } else {
      // TODO: Fetch user DTO by userId
      // setData(await fetchUserDTO(userId));
    }
  }, [userId]);

  if (!data) return null; // or <Loading />

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: "2%" }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profile}>
          <UserAvatar pictureUrl={data.pictureUrl} style={styles.profileImage} />
          <Text>{data.name}</Text>
          {data.patron && (
            <FontAwesome5 name="crown" size={24} color={Colors.crown} />
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.bio}>
          <Text style={styles.text}>{data.bio}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.movies}>
          <Text>[TOP 5 FAVORITES PLACEHOLDER]</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.ratings}>
          <Text>[RATINGS GRAPH PLACEHOLDER]</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.movies}>
          <Text>[RECENT ACTIVITY PLACEHOLDER]</Text>
        </View>

        <View style={styles.divider} />

        {/* Buttons */}
        <View style={styles.buttons}>
          {["Watchlist", "Films", "Reviews", "Lists", "Likes", "Following", "Followers", "Blocked"]
            .map(label => (
              <TouchableOpacity key={label}>
                <Text>{label}</Text>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
    </View>
  );
};

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