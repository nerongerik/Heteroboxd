import { StyleSheet, Text, ScrollView, View, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';
import { useEffect, useState } from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { UserAvatar } from '../../components/userAvatar';
import { BaseUrl } from '../../constants/api';
import Popup from '../../components/popup';
import LoadingResponse from '../../components/loadingResponse';

const Profile = () => {
  const { userId } = useLocalSearchParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [result, setResult] = useState(-1);
  const [error, setError] = useState("");
  useEffect(() => {
    (async () => {
      if (user.userId === userId) {
        setData({ 
          name: user.name, pictureUrl: user.pictureUrl, bio: user.bio, tier: user.tier,
          expiry: user.expiry, patron: user.patron, joined: user.joined, listsCount: user.listsCount,
          followersCount: user.followersCount, followingCount: user.followingCount, blockedCount: user.blockedCount,
          reviewsCount: user.reviewsCount, likes: user.likes, watched: user.watched 
        });
      } else {
        setResult(0);
        try {
          const res = await fetch(`${BaseUrl.api}/users/${userId}`, {method: 'GET'});
          if (res.status === 200) {
            setResult(200);
            const json = await res.json();
            console.log(json);
            setData({ 
              name: json.name, pictureUrl: json.pictureUrl, bio: json.bio, tier: json.tier,
              expiry: json.expiry, patron: json.patron, joined: json.joined, listsCount: json.listsCount,
              followersCount: json.followersCount, followingCount: json.followingCount, blockedCount: json.blockedCount,
              reviewsCount: json.reviewsCount, likes: json.likes, watched: json.watched 
            });
          } else if (res.status === 404) {
            setError("This user no longer exists!");
            setResult(404);
          } else {
            setError("Something went wrong! Please contact Heteroboxd support for more information!");
            setResult(500);
          }
        } catch (err) {
          setError("Unable to connect to Heteroboxd. Please check your internet connection!");
          setResult(500);
        }
      }
    })();
  }, [userId]);
  const router = useRouter();

  if (!data) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: "5%",
        backgroundColor: Colors.background,
      }}>
        <LoadingResponse visible={true} />
      </View>
    );
  }
  
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
      <Popup visible={result === 404 || result === 500} message={error} onClose={() => {
        result === 500 ? router.replace('/contact') : router.replace('/');
      }} />
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