import { StyleSheet, Text, ScrollView, View, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';
import { useEffect, useState } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { UserAvatar } from '../../components/userAvatar';
import { BaseUrl } from '../../constants/api';
import Popup from '../../components/popup';
import LoadingResponse from '../../components/loadingResponse';
import GlowingText from '../../components/glowingText';
import { FavoritePoster } from '../../components/favoritePoster';
import { Snackbar } from 'react-native-paper';

const Profile = () => {
  const { userId } = useLocalSearchParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [result, setResult] = useState(-1);
  const [error, setError] = useState("");
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [favorites, setFavorites] = useState([null, null, null, null]);
  const [visible, setVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [favoritesResult, setFavoritesResult] = useState(-1);

  useEffect(() => {
    (async () => {
      if (user.userId === userId) {
        setData({ 
          name: user.name, pictureUrl: user.pictureUrl, bio: user.bio, tier: user.tier,
          expiry: user.expiry, patron: user.patron === 'true' ? true : false, joined: parseDate(user.joined), listsCount: user.listsCount,
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
            setData({ 
              name: json.name, pictureUrl: json.pictureUrl, bio: json.bio, tier: json.tier,
              expiry: json.expiry, patron: json.patron === 'true' ? true : false, joined: parseDate(json.joined), listsCount: json.listsCount,
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

  useEffect(() => {
  let shouldFetch = true;

  (async () => {
    setFavoritesResult(0);
    const res = await fetch(`${BaseUrl.api}/users/user-favorites/${userId}`, { method: "GET" });

    if (!shouldFetch) return;
    
    //when user views his own profile, there is a (small) chance they accidentally end up viewing an expired state
    //in case localstorage/securestorage clearence failed. in that case -> trigger errors that loading other user
    //would've normally triggered (server malfuncion, notfound)

    if (res.status === 200) {
      const json = await res.json();
      const ordered = [json["1"], json["2"], json["3"], json["4"]];
      setFavorites(ordered);
      setFavoritesResult(200);
    } 
    else if (res.status === 404) {
      setFavoritesResult(404);
    }
    else if (res.status === 400) {
      setError("This user no longer exists!")
      setResult(400);
    } 
    else {
      setError("Unable to connect to Heteroboxd. Please check your internet connection!");
      setResult(500);
    }
  })();

  return () => { shouldFetch = false; };
}, [userId]);


  function parseDate(date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const nums = date.split(" ")[0].split("/");
    const day = nums[0]; const year = nums[2];
    const month = months[parseInt(nums[1] - 1)];
    return `joined ${month} ${day}, ${year}`;
  }

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

  const isDonor = data.tier === "DONOR" || data.tier === "donor" || data.tier === "Donor";
  const isAdmin = data.tier === 'ADMIN' || data.tier === 'admin' || data.tier === 'Admin';

  //minimum spacing between posters
  const spacing = Platform.OS === 'web' ? 50 : 5;
  //determine max usable row width:
  const maxRowWidth = (Platform.OS === 'web' && width > 1000 ? 1000 : width * 0.95);
  //compute poster width:
  const posterWidth = (maxRowWidth - spacing * 4) / 4;
  const posterHeight = posterWidth * (3 / 2); //maintain 2:3 aspect

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          padding: 5,
          minWidth: Platform.OS === 'web' && width > 1000 ? 1000 : 'auto',
          maxWidth: Platform.OS === "web" && width > 1000 ? 1000 : "100%",
          width: "100%",
          alignSelf: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profile}>
          <UserAvatar pictureUrl={data.pictureUrl} style={styles.profileImage} />
          <View style={styles.inline}>
            {isDonor ? (
              <GlowingText color={Colors.heteroboxd}>{data.name}</GlowingText>
            ) : isAdmin ? (
              <GlowingText color={Colors._heteroboxd}>{data.name}</GlowingText>
            ) : (
              <Text style={styles.username}>{data.name}</Text>
            )}
            {data.patron && (
              <GlowingText color={Colors.heteroboxd}><MaterialCommunityIcons name="crown" size={32} color={Colors.heteroboxd} style={{ position: 'absolute', right: -40 }}/></GlowingText>
            )}
          </View>
          <Text style={styles.subtext}>{data.joined}</Text>
        </View>

        <View style={{marginVertical: 5}} />

        <View style={styles.bio}>
          <Text style={styles.text}>{data.bio}</Text>
        </View>

        <View style={[styles.divider, {marginVertical: 20}]} />

        <Text style={styles.subtitle}>Favorites</Text>
        {favoritesResult === 0 ? (
          <View style={{ width: "100%", alignItems: "center", paddingVertical: 30 }}>
            <LoadingResponse visible={true} />
          </View>
        ) : (
        <View style={[styles.movies, { width: "100%", justifyContent: "space-between", paddingHorizontal: 10 }]}>
          {favorites.map((film, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                if (favoritesResult === 404) {
                  setSnackbarMessage("There was an error loading this film...");
                  setVisible(true);
                }
                else if (film && film.filmId) {
                  router.replace(`/film/${film.filmId}`);
                } else if (user.userId !== userId) {
                  setSnackbarMessage("You can't choose favorites for other people, retard!");
                  setVisible(true);
                } else {
                  console.log(index + 1);
                }
              }}
              style={{ alignItems: "center" }}
            >
              <FavoritePoster
                posterUrl={favoritesResult === 404 ? 'error' : (film?.posterUrl ?? null)}
                style={{
                  width: posterWidth,
                  height: posterHeight,
                  borderRadius: 8,
                  borderWidth: film ? 0 : 1,
                  borderColor: film ? "transparent" : Colors.border_color,
                  opacity: film ? 1 : 0.4,
                }}
                other={user.userId !== userId}
              />
            </TouchableOpacity>
          ))}
        </View>
        )}

        <View style={[styles.divider, {marginVertical: 20}]} />
        
        <Text style={styles.subtitle}>Ratings</Text>
        <View style={styles.ratings}>
          <Text style={styles.text}>[RATINGS GRAPH PLACEHOLDER]</Text>
        </View>

        <View style={[styles.divider, {marginVertical: 20}]} />

        <Text style={styles.subtitle}>Recent</Text>
        <View style={styles.movies}>
          <Text>[RECENT ACTIVITY PLACEHOLDER]</Text>
        </View>

        <View style={[styles.divider, {marginVertical: 20}]} />

        <View style={styles.buttons}>
          {["Watchlist", "Films", "Reviews", "Lists", "Likes", "Following", "Followers", "Blocked"]
            .map(label => (
              <TouchableOpacity key={label}>
                <Text>{label}</Text>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>

      <Popup visible={result === 400 || result === 404 || result === 500} message={error} onClose={() => {
        result === 500 ? router.replace('/contact') : router.replace('/');
      }} />

      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
        style={{
          backgroundColor: Colors.card,
          width: Platform.OS === 'web' && width > 1000 ? '50%' : '90%',
          alignSelf: 'center',
          borderRadius: 8,
        }}
        action={{
          label: 'OK',
          onPress: () => setVisible(false),
          textColor: Colors.text_link
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 50,
  },
  profile: {
    alignItems: "center",
    justifyContent: "center",
  },
  inline: {
    flexDirection: 'row',
  },
  username: {
    fontSize: 25,
    fontWeight: "700",
    marginBottom: 5,
    color: Colors.text_title,
    textAlign: "center"
  },
  bio: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    marginBottom: 5,
    width: '75%',
  },
  movies: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 0,
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontWeight: "500",
    marginBottom: 5,
    marginLeft: 12,
    fontSize: 20,
    color: Colors.text_title,
    textAlign: "left",
  },
  subtext: {
    fontWeight: "100",
    fontSize: 12,
    color: Colors.text_placeholder,
    textAlign: "justify",
    fontStyle: 'italic',
    marginTop: 0,
  },
  divider: {
    width: "75%",
    alignSelf: "center",
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border_color,
    opacity: 0.5,
  },
  profileImage: {
    width: Platform.OS === 'web' ? 150 : 100,
    height: Platform.OS === 'web' ? 150 : 100,
    borderRadius: Platform.OS === 'web' ? 75 : 50,
    borderColor: Colors.border_color,
    borderWidth: 1.5,
  },
});
