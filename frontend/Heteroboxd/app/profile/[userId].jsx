import { StyleSheet, Text, ScrollView, View, TouchableOpacity, RefreshControl, Platform, useWindowDimensions, Pressable, Modal } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';
import { useEffect, useState, useMemo } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { UserAvatar } from '../../components/userAvatar';
import { BaseUrl } from '../../constants/api';
import Popup from '../../components/popup';
import LoadingResponse from '../../components/loadingResponse';
import GlowingText from '../../components/glowingText';
import { Poster } from '../../components/poster';
import { Snackbar } from 'react-native-paper';
import * as auth from '../../helpers/auth';
import Foundation from '@expo/vector-icons/Foundation';

const Profile = () => {
  const { userId } = useLocalSearchParams();
  const { user, isValidSession } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [pronoun, setPronoun] = useState(["he", "him", "his"])
  const [result, setResult] = useState(-1);
  const [error, setError] = useState("");

  const { width } = useWindowDimensions();

  const router = useRouter();

  const [visible, setVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [favorites, setFavorites] = useState([null, null, null, null]);
  const [favoritesResult, setFavoritesResult] = useState(-1);

  const [recent, setRecent] = useState([]);
  const [recentResult, setRecentResult] = useState(-1);

  const [blocked, setBlocked] = useState(false);
  const [following, setFollowing] = useState(false);

  //context menu
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuMessage, setContextMenuMessage] = useState("");

  const loadProfileData = async () => {
    setRefreshing(true);

    // --- FETCH PROFILE ---
    setResult(0);
    try {
      const res = await fetch(`${BaseUrl.api}/users/${userId}`);
      if (res.status === 200) {
        const json = await res.json();
        setData({ 
          name: json.name, pictureUrl: json.pictureUrl, bio: json.bio, gender: json.gender, tier: json.tier,
          expiry: parseDate(json.expiry), patron: json.patron === 'true', joined: parseDate(json.joined), flags: json.flags, listsCount: json.listsCount,
          followersCount: json.followersCount, followingCount: json.followingCount, blockedCount: json.blockedCount,
          reviewsCount: json.reviewsCount, likes: json.likes, watched: json.watched
        });
        if (json.gender === 'female' || json.gender === 'Female') setPronoun(['she', 'her', 'hers']);
        setResult(200);
      } else if (res.status === 404) {
        setError("This user no longer exists!");
        setResult(404);
        setData({})
      } else {
        setError("Something went wrong! Please contact Heteroboxd support for more information!");
        setResult(500);
        setData({})
      }
    } catch {
      setError("Unable to connect to Heteroboxd. Please check your internet connection!");
      setResult(500);
      setData({})
    }

    // --- FETCH FAVORITES ---
    setFavoritesResult(0);
    try {
      const res = await fetch(`${BaseUrl.api}/users/user-favorites/${userId}`);
      if (res.status === 200) {
        const json = await res.json();
        setFavorites([json["1"], json["2"], json["3"], json["4"]]);
        setFavoritesResult(200);
      } else if (res.status === 404) {
        setFavoritesResult(404);
      } else if (res.status === 400) {
        setError("This user no longer exists!");
        setResult(400);
      } else {
        setError("Something went wrong! Please contact Heteroboxd support for more information!");
        setResult(500);
      }
    } catch {
      setError("Unable to connect to Heteroboxd. Please check your internet connection!");
      setResult(500);
    }

    // --- FETCH RECENTS ---
    setRecentResult(0);
    try {
      const res = await fetch(`${BaseUrl.api}/films/user/${userId}?Page=1&PageSize=8`);
      if (res.status === 200) {
        const json = await res.json();
        setRecent(json.films);
        setRecentResult(200);
      } else if (res.status === 400) {
        setError("This user no longer exists!")
        setResult(400);
      } else {
        setError("Something went wrong! Please contact Heteroboxd support for more information!");
        setResult(500);
      }
    } catch {
      setError("Unable to connect to Heteroboxd. Please check your internet connection!");
      setResult(500);
    }

    setRefreshing(false);
  };

  useEffect(() => {
    let loaded = true;
    if (!user || user.userId === userId) return;
    (async () => {
      try {
        const res = await fetch(`${BaseUrl.api}/users/user-relationships/${user.userId}`, {method: "GET"});
        if (!loaded) return;
        
        if (res.status === 200) {
          const json = await res.json();
          const blockedSet = new Set(json['blocked'].map(uir => uir.id));
          if (blockedSet.has(userId)) {
            setBlocked(true);
            return;
          }
          const followingSet = new Set(json['following'].map(uir => uir.id));
          if (followingSet.has(userId)) setFollowing(true);
        } else {
          console.log('Failed to determine if the user follows account; falling back to false.');
        }
      } catch {
        console.log('Failed to determine if the user follows account; falling back to false.');
      }
    })();

    return () => { loaded = false; };
  }, [userId]);

  useEffect(() => {
    if (!blocked) {
      loadProfileData();
    }
  }, [userId]);


  function parseDate(date) {
    if (!date) return date;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const nums = date.split(" ")[0].split("/");
    const day = nums[0]; const year = nums[2];
    const month = months[parseInt(nums[1] - 1)];
    return `joined ${month} ${day}, ${year}`;
  }

  function handleButtons(button) {
    switch(button) {
      case 'Watchlist':
        router.replace(`/watchlist/${userId}`);
        break;
      case 'Reviews':
        router.replace(`/reviews/user/${userId}`);
        break;
      case 'Lists':
        if (data.listsCount === '0') router.replace(`/list/create`)
        else router.replace(`/lists/user/${userId}`);
        break;
      case 'Likes':
        console.log('I am yet to decide on the most practical way to make this happen with tabs and all.');
        break;
      case 'Followers':
        router.replace(`/relationships/${userId}?t=followers`);
        break;
      case 'Following':
        router.replace(`/relationships/${userId}?t=following`);
        break;
      case 'Blocked':
        router.replace(`/relationships/${userId}?t=blocked`);
        break;
      default:
        setSnackbarMessage("I'm gonna touch you");
        setVisible(true);
    }
  }

  async function handleFollow() {
    if (!user || !(await isValidSession())) {
      setSnackbarMessage('You must be logged in to follow people.');
      setVisible(true);
      return;
    }
    setFollowing(!following); //hope for happy path, change the look for the user on front regardless
    const jwt = await auth.getJwt();
    await fetch(`${BaseUrl.api}/users/relationships/${user.userId}/${userId}?Action=follow-unfollow`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    }).then((res) => {
      //not critical to handle errors, not critical architecture
      console.log(res.status);
    });
  }

  //context menu
  const handlePress = () => {
    let message = "";

    if (isAdmin) {
      message = "This person is a community moderator. Learn how you can join our moderation team ";
    } else if (data.patron) {
      message = "This person is 🐐ed — forever. Learn how you can join " + pronoun[1] + " ";
    } else if (isDonor) {
      message = "This person is 🐐ed. Learn how you can join " + pronoun[1] + " ";
    }

    setContextMenuMessage(message);
    setContextMenuVisible(true);
  };

  const widescreen = useMemo(() => Platform.OS === 'web' && width > 1000, [width]);
  const isOwnProfile = useMemo(() => user?.userId === userId, [user?.userId, userId]);
  const isDonor = useMemo(() => data?.tier?.toLowerCase() === "donor", [data]);
  const isAdmin = useMemo(() => data?.tier?.toLowerCase() === 'admin', [data]);
  //minimum spacing between posters
  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen]);
  //determine max usable row width:
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen]);
  //compute poster width:
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4)/4, [maxRowWidth, spacing]);
  const posterHeight = useMemo(() => posterWidth * (3/2), [posterWidth]); //maintain 2:3 aspect

  if (blocked) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: 5,
        backgroundColor: Colors.background,
      }}>
        <Text style={styles.text}>You have blocked this user.</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: 5,
        backgroundColor: Colors.background,
      }}>
        <LoadingResponse visible={true} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadProfileData} />
        }
        contentContainerStyle={{
          padding: 5,
          minWidth: widescreen ? 1000 : 'auto',
          maxWidth: widescreen ? 1000 : "100%",
          width: "100%",
          alignSelf: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profile}>
          <View style={styles.inline}>
            {
              Platform.OS === "web" && width < 500 ? (
                <UserAvatar pictureUrl={data.pictureUrl} style={styles.smallWebProfile} />
              ) : (
                <UserAvatar pictureUrl={data.pictureUrl} style={styles.profileImage} />
              )
            }
            {!isOwnProfile && (
              following ? (
                  <TouchableOpacity
                    onPress={handleFollow}
                    style={{
                      backgroundColor: 'transparent',
                      borderWidth: 3,
                      borderColor: Colors.button_reject,
                      borderRadius: 3,
                      paddingVertical: widescreen ? 8 : 6,
                      paddingHorizontal: widescreen ? 8 : 6,
                      justifyContent: 'center',
                      alignSelf: 'center',
                      position: 'absolute',
                      right: Platform.OS === 'web' && width < 500 ? -85 : (widescreen ? -120 : -100)
                    }}
                  >
                    <Text
                      style={{
                        fontSize: Platform.OS === 'web' && width < 500 ? 10 : (widescreen ? 16 : (width > 350 ? 14 : 10)),
                        fontWeight: '700',
                        color: Colors.button_reject,
                        textAlign: 'center',
                      }}
                    >
                      UNFOLLOW
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleFollow}
                    style={{
                      backgroundColor: 'transparent',
                      borderWidth: 3,
                      borderColor: Colors.button_confirm,
                      borderRadius: 3,
                      paddingVertical: widescreen ? 8 : 6,
                      paddingHorizontal: widescreen ? 8 : 6,
                      justifyContent: 'center',
                      alignSelf: 'center',
                      position: 'absolute',
                      right: Platform.OS === 'web' && width < 500 ? -75 : (widescreen ? -100 : -85)
                    }}
                  >
                    <Text
                      style={{
                        fontSize: Platform.OS === 'web' && width < 500 ? 10 : (widescreen ? 16 : (width > 350 ? 14 : 10)),
                        fontWeight: '700',
                        color: Colors.button_confirm,
                        textAlign: 'center',
                      }}
                    >
                      FOLLOW
                    </Text>
                  </TouchableOpacity>
                )
              )}
          </View>

          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            {data.patron && (
              <Pressable
                onPress={handlePress}
                style={{marginBottom: -5}}
              >
              <GlowingText color={Colors.heteroboxd}>
                <MaterialCommunityIcons name="crown" size={32} color={Colors.heteroboxd}/>
              </GlowingText>
              </Pressable>
            )}
            {isDonor ? (
              <Pressable
                onPress={handlePress}
              >
                <GlowingText color={Colors.heteroboxd}>{data.name}</GlowingText>
              </Pressable>
            ) : isAdmin ? (
              <Pressable
                onPress={handlePress}
              >
                <GlowingText color={Colors._heteroboxd}>{data.name}</GlowingText>
              </Pressable>
            ) : (
              <Text style={styles.username}>{data.name}</Text>
            )}
          </View>
        </View>

        <View style={{marginVertical: 5}} />

        <View style={styles.bio}>
          {
            data.gender === 'male' || data.gender === 'Male' ? (
              <Foundation name="male-symbol" size={24} color={Colors.male} />
            ) : (
              <Foundation name="female-symbol" size={24} color={Colors.female} />
            )
          }
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
            <Pressable
              key={index}
              onPress={() => {
                if (favoritesResult === 404) {
                  setSnackbarMessage("There was an error loading this film...");
                  setVisible(true);
                }
                else if (film && film.filmId) {
                  router.replace(`/film/${film.filmId}`);
                } else if (!isOwnProfile) {
                  setSnackbarMessage("You can't choose favorites for other people, retard!");
                  setVisible(true);
                } else {
                  console.log(index + 1);
                }
              }}
              style={{ alignItems: "center" }}
            >
              <Poster
                posterUrl={favoritesResult === 404 ? 'error' : (film?.posterUrl ?? null)}
                style={{
                  width: posterWidth,
                  height: posterHeight,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: Colors.border_color,
                }}
                other={!isOwnProfile}
              />
            </Pressable>
          ))}
        </View>
        )}

        <View style={[styles.divider, {marginVertical: 20}]} />
        
        <Text style={styles.subtitle}>Ratings</Text>
        <View style={styles.ratings}>
          <Text style={styles.text}>[RATINGS GRAPH PLACEHOLDER]</Text>
        </View>

        <View style={[styles.divider, {marginVertical: 20}]} />

        <Text style={styles.subtitle}>Recents</Text>
        <View style={styles.movies}>
          {recentResult === 0 ? (
            <View style={{ width: "100%", alignItems: "center", paddingVertical: 30 }}>
              <LoadingResponse visible={true} />
            </View>
          ) : recent.length === 0 ? (
            <View style={{ width: "100%", alignItems: "center", paddingVertical: 30 }}>
              <Text style={styles.text}>This user has no motion.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10 }}
            >
              {recent.slice(0, 8).map((film, index) => (
                <Pressable
                  key={index}
                  onPress={() => router.replace(`/film/${film.filmId}`)}
                  style={{ marginRight: 8 }}
                >
                  <Poster
                    posterUrl={film?.posterUrl ?? null}
                    style={{
                      width: posterWidth,
                      height: posterHeight,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: Colors.border_color,
                    }}
                    other={!isOwnProfile}
                  />
                </Pressable>
              ))}

              <Pressable
                onPress={() => {router.replace(`/films/userWatched/${userId}`)}}
                style={{ marginRight: 8 }}
              >
                <Poster
                  posterUrl={'more'}
                  style={{
                    width: posterWidth,
                    height: posterHeight,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: Colors.border_color,
                    opacity: 0.4,
                  }}
                  other={!isOwnProfile}
                />
              </Pressable>
            </ScrollView>
          )}
        </View>

        <View style={[styles.divider, {marginVertical: 20}]} />

        <View style={styles.buttons}>
          {[
            ...(isOwnProfile ? [{ label: "Watchlist", count: data.watched }] : []),
            { label: "Reviews", count: data.reviewsCount },
            { label: "Lists", count: data.listsCount },
            { label: "Likes", count: data.likes },
            { label: "Followers", count: data.followersCount },
            { label: "Following", count: data.followingCount },
            ...(isOwnProfile ? [{ label: "Blocked", count: data.blockedCount }] : []),
          ]
          .map((item, index) => {
            const disabled = item.label === 'Lists' ? (isOwnProfile ? false : item.count === '0') : item.count === '0';
            return (
              <TouchableOpacity
                key={index}
                disabled={disabled}
                onPress={() => {handleButtons(item.label)}}
                style={[styles.boxButton, (disabled) && { opacity: 0.5 }]}
              >
                <Text style={[styles.boxButtonText, { color: Colors.text_title }]}>
                  {item.label}
                </Text>
                <Text style={[styles.boxButtonText, { color: Colors.text_title }]}>
                  {item.count} {'➜'}
                </Text>
              </TouchableOpacity>
            );
          })}
          <Text style={[styles.text, {marginTop: 50}]}>{data.joined}</Text>
        </View>
      </ScrollView>

      <Popup visible={result === 400 || result === 404 || result === 500} message={error} onClose={() => {
        result === 500 ? router.replace('/contact') : router.replace('/');
        }}
      />

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
          label: 'Sorry',
          onPress: () => setVisible(false),
          textColor: Colors.text_link
        }}
      >
        {snackbarMessage}
      </Snackbar>

      {/*context menu*/}
      {contextMenuVisible && (
        <Modal
          transparent
          visible={contextMenuVisible}
          animationType="fade"
          onRequestClose={() => setContextMenuVisible(false)}
        >
          <Pressable
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)"
            }}
            onPress={() => setContextMenuVisible(false)}
          >
            <View style={{
              backgroundColor: Colors.card,
              padding: 15,
              borderRadius: 3,
              maxWidth: Platform.OS === 'web' ? Math.min(1000, width-50) : width-50,
            }}>
              <Text style={{ color: Colors.text, textAlign: 'center', fontSize: 16}}>
                {contextMenuMessage}
                { isAdmin ? (
                  <Link style={styles.link} href={'/contact'}>here</Link>
                ) : (
                  <Link style={styles.link} href={'/sponsor'}>here</Link>
                )}
                .
              </Text>
            </View>
          </Pressable>
        </Modal>
      )}
      
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
    marginBottom: 15
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
  smallWebProfile: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: Colors.border_color,
    borderWidth: 1.5,
  },
  boxButton: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: 'space-between',
    
  },
  boxButtonText: {
    fontSize: 18,
    fontWeight: "400",
    textAlign: "right",
  },
  link: {
    color: Colors.text_link,
    fontWeight: "600",
    fontSize: 16
  },
});
