import { StyleSheet, Text, ScrollView, View, TouchableOpacity, Animated, RefreshControl, Platform, useWindowDimensions, Pressable, Modal, ActivityIndicator, FlatList } from 'react-native';
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
import * as format from '../../helpers/format';
import Foundation from '@expo/vector-icons/Foundation';
import Histogram from '../../components/histogram';
import SearchBox from '../../components/searchBox';
import SlidingMenu from '../../components/slidingMenu';

const Profile = () => {
  const { userId } = useLocalSearchParams();
  const { user, isValidSession } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [pronoun, setPronoun] = useState(["he", "him", "his"])
  const [result, setResult] = useState(-1);
  const [error, setError] = useState("");
  const [ratings, setRatings] = useState({});

  const { width, height } = useWindowDimensions();

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

  //searchbar
  const [menuShown2, setMenuShown2] = useState(false);
  const slideAnim2 = useState(new Animated.Value(0))[0]; //sliding animation prep
  const [favIndex, setFavIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState(null);


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
          expiry: format.parseDate(json.expiry), patron: json.patron, joined: format.parseDate(json.joined), flags: json.flags, watchlistCount: json.watchlistCount,
          listsCount: json.listsCount, followersCount: json.followersCount, followingCount: json.followingCount, blockedCount: json.blockedCount,
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
      const res = await fetch(`${BaseUrl.api}/users/user-favorites/${userId}`, {
        method: 'GET',
        headers: {'Accept': 'application/json'}
      });
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
        setRecent(json.items);
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
  }, [userId, blocked]);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${BaseUrl.api}/users/ratings/${userId}`, {
          method: 'GET',
          headers: {'Accept': 'application/json'}
        });
        if (res.status === 200) {
          const json = await res.json();
          setRatings(json);
        } else {
          console.log(`${res.status}: Failed to fetch ratings; probably threw in earlier load.`);
        }
      } catch {
        console.log('network error when fetching ratings; probably threw in earlier load.');
      }
    })();
  }, [userId]);

  function handleButtons(button) {
    switch(button) {
      case 'Watched':
        router.push(`/films/user-watched/${userId}`);
        break;
      case 'Watchlist':
        router.push(`/films/watchlist/${userId}`);
        break;
      case 'Reviews':
        router.push(`/reviews/user/${userId}`);
        break;
      case 'Lists':
        if (data.listsCount === '0') router.push(`/list/create`)
        else router.push(`/lists/user/${userId}`);
        break;
      case 'Likes':
        router.push(`/likes/${userId}`);
        break;
      case 'Followers':
        router.push(`/relationships/${userId}?t=followers`);
        break;
      case 'Following':
        router.push(`/relationships/${userId}?t=following`);
        break;
      case 'Blocked':
        router.push(`/relationships/${userId}?t=blocked`);
        break;
      default:
        setSnackbarMessage("I'm gonna touch you lil bro");
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

  const handlePress = () => {
    let message = "";

    if (isAdmin) {
      if (isOwnProfile) {
        message = "You are a community moderator. If you have any requests or issues, please contact us ";
      } else {
        message = "This person is a community moderator. Learn how you can join our moderation team ";
      }
    } else if (data.patron) {
      if (isOwnProfile) {
        message = "You are 🐐ed — forever. If you're ever feeling generous again, consider further donations ";
      } else {
        message = "This person is 🐐ed — forever. Learn how you can join " + pronoun[1] + " ";
      }
    } else if (isDonor) {
      if (isOwnProfile) {
        message = "Your donor tier expires on " + data?.expiry + ". You can renew your tier ";
      } else {
        message = "This person is 🐐ed. Learn how you can join " + pronoun[1] + " ";
      }
    }

    setContextMenuMessage(message);
    setContextMenuVisible(true);
  };

  const updateFavorites = async (filmId, index) => {
    try {
      const vS = await isValidSession();
      if (!user || !isOwnProfile || !isValidSession) {
        setSnackbarMessage(`Session expired! Try logging in again.`);
        setVisible(true);
      }
      const jwt = await auth.getJwt();
      const i = index ? index : favIndex;
      const res = await fetch(`${BaseUrl.api}/users/favorites/${user.userId}/${filmId}?Index=${i}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Accept': 'application/json'
        }
      });
      if (res.status === 200) {
        const json = await res.json();
        setFavorites([json["1"], json["2"], json["3"], json["4"]]);
      } else {
        setSnackbarMessage(`${res.status}: Failed to update your favorites! Try reloading Heteroboxd.`);
        setVisible(true);
      }
    } catch {
      setSnackbarMessage(`Network error! Check your internet connection.`)
      setVisible(true);
    }
  }

  const openMenu2 = () => {
    setMenuShown2(true);
    Animated.timing(slideAnim2, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu2 = () => {
    Animated.timing(slideAnim2, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setMenuShown2(false));
  };

  const translateY2 = slideAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0], //slide from bottom
  });

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
  //recents
  const colPosterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing]);
  const colPosterHeight = useMemo(() => colPosterWidth * (3 / 2), [colPosterWidth]); //maintain 2:3 aspect


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
                  <Pressable
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
                  </Pressable>
                ) : (
                  <Pressable
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
                  </Pressable>
                )
              )}
          </View>

          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            {data.patron && (
              <Pressable
                onPress={handlePress}
                style={{marginBottom: -5}}
              >
              <MaterialCommunityIcons name="crown" size={32} color={Colors.heteroboxd}/>
              </Pressable>
            )}
            {isDonor ? (
              <Pressable
                onPress={handlePress}
              >
                <GlowingText color={Colors.heteroboxd} size={widescreen ? 28 : 25}>{data.name}</GlowingText>
              </Pressable>
            ) : isAdmin ? (
              <Pressable
                onPress={handlePress}
              >
                <GlowingText color={Colors._heteroboxd} size={widescreen ? 28 : 25}>{data.name}</GlowingText>
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
            <ActivityIndicator size="large" color={Colors.text_link} />
          </View>
        ) : (
        <View style={[styles.movies, { width: "100%", justifyContent: "space-between", paddingHorizontal: 5 }]}>
          {favorites.map((film, index) => (
            <Pressable
              key={index}
              onLongPress={() => {
                if (!isOwnProfile) return;
                updateFavorites(-1, index+1);
              }}
              onPress={() => {
                if (favoritesResult === 404) {
                  setSnackbarMessage("There was an error loading this film...");
                  setVisible(true);
                } else if (film === 'error') {
                  setSnackbarMessage("There was an error loading this film...");
                  setVisible(true);
                } else if (film && film.filmId) {
                  router.push(`/film/${film.filmId}`);
                } else if (!isOwnProfile) {
                  setSnackbarMessage("You can't choose favorites for other people!");
                  setVisible(true);
                } else {
                  setFavIndex(index + 1);
                  openMenu2();
                }
              }}
              style={{ alignItems: "center", marginRight: index === 3 ? 0 : 5 }}
            >
              <Poster
                posterUrl={favoritesResult === 404 || film === 'error' ? 'error' : (film?.posterUrl ?? null)}
                style={{
                  width: posterWidth,
                  height: posterHeight,
                  borderRadius: 6,
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
        
        <Text style={[styles.subtitle, {marginBottom: 10}]}>Ratings</Text>
        {
          Object.entries(ratings).length > 0 ? (
            <Histogram histogram={ratings} />
          ) : (
            <View style={{ width: "100%", alignItems: "center", paddingVertical: 30 }}>
              <Text style={styles.text}>Nothing yet.</Text>
            </View>
          )
        }

        <View style={[styles.divider, {marginVertical: 20}]} />

        <Pressable onPress={() => {router.push(`/films/user-watched/${userId}`)}}>
          <Text style={styles.subtitle}>Recents</Text>
        </Pressable>
        <View 
          style={{
            width: colPosterWidth * 4 + spacing * 3,
            maxWidth: "100%",
            alignSelf: "center",
          }}
        >
          {recentResult === 0 ? (
            <View style={{ width: "100%", alignItems: "center", paddingVertical: 30 }}>
              <ActivityIndicator size="large" color={Colors.text_link} />
            </View>
          ) : recent.length === 0 ? (
            <View style={{ width: "100%", alignItems: "center", paddingVertical: 30 }}>
              <Text style={styles.text}>This user has no motion.</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={widescreen}
              style={{ maxWidth: Math.min(width * 0.95, 1000), paddingBottom: 10 }}
              contentContainerStyle={{alignItems: 'center'}}
              data={recent.slice(0, 8)}
              keyExtractor={(item) => item.filmId.toString()}
              renderItem={({ item }) => {
                return (
                  <Pressable
                    onPress={() => router.push(`/film/${item.filmId}`)}
                    style={{ marginRight: spacing }}
                  >
                    <Poster
                      posterUrl={item?.posterUrl ?? null}
                      style={{
                        width: colPosterWidth,
                        height: colPosterHeight,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: Colors.border_color,
                      }}
                      other={!isOwnProfile}
                    />
                  </Pressable>
                );
              }}
            />
          )}
        </View>

        <View style={[styles.divider, {marginVertical: 20}]} />

        <View style={styles.buttons}>
          {[
            ...(isOwnProfile ? [{ label: "Watchlist", count: data.watchlistCount }] : []),
            { label: "Watched", count: recent?.length ?? 0 },
            { label: "Reviews", count: data.reviewsCount },
            { label: "Lists", count: data.listsCount },
            { label: "Likes", count: data.likes },
            { label: "Followers", count: data.followersCount },
            { label: "Following", count: data.followingCount },
            ...(isOwnProfile ? [{ label: "Blocked", count: data.blockedCount }] : []),
          ]
          .map((item, index) => {
            const disabled = item.label === 'Lists' ? (isOwnProfile ? false : item.count === 0) : item.count === 0;
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
                  {format.formatCount(item.count)} {'➜'}
                </Text>
              </TouchableOpacity>
            );
          })}
          <Text style={[styles.text, {marginTop: 50}]}>joined {data.joined}</Text>
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
          width: Platform.OS === 'web' && width > 1000 ? width*0.5 : width*0.9,
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
      <SlidingMenu menuShown={menuShown2} closeMenu={() => {setSearchResults(null); closeMenu2();}} translateY={translateY2} widescreen={widescreen} width={width}>
        <SearchBox placeholder={"Search Films..."} context={'films'} onSelected={(json) => setSearchResults(json)} />
        {
          (searchResults && searchResults.length > 0) ? (
            <View style={[{alignSelf: 'center', backgroundColor: Colors.card, borderColor: Colors.border_color, borderRadius: 5, borderTopWidth: 2, borderBottomWidth: 2, marginBottom: 8, overflow: 'hidden'}, {minHeight: height/3, maxHeight: height/3, width: widescreen ? width*0.5 : width*0.95}]}>
            <FlatList
              data={searchResults}
              numColumns={1}
              renderItem={({item, index}) => (
                <Pressable key={index} onPress={() => {
                  updateFavorites(item.filmId);
                  setSearchResults(null);
                  closeMenu2();
                }}>
                  <View style={{flexDirection: 'row', alignItems: 'center', maxWidth: '100%'}}>
                    <Poster posterUrl={item.posterUrl} style={{width: 75, height: 75*3/2, borderRadius: 6, borderColor: Colors.border_color, borderWidth: 1, marginRight: 5, marginBottom: 3}} />
                    <View style={{flexShrink: 1, maxWidth: '100%'}}>
                      <Text style={{color: Colors.text_title, fontSize: 16}} numberOfLines={3} ellipsizeMode="tail">
                        {item.title} <Text style={{color: Colors.text, fontSize: 14}}>{item.releaseYear}</Text>
                      </Text>
                      <Text style={{color: Colors.text, fontSize: 12}}>Directed by {
                        item.castAndCrew?.map((d, i) => (
                          <Text key={i} style={{}}>
                            {d.celebrityName ?? ""}{i < item.castAndCrew.length - 1 && ", "}
                          </Text>
                        ))
                      }</Text>
                    </View>
                  </View>
                </Pressable>
              )}
              contentContainerStyle={{
                padding: 20,
                alignItems: 'flex-start',
                width: '100%'
              }}
              showsVerticalScrollIndicator={false}
            />
            </View>
          ) : (searchResults && searchResults.length === 0) && (
            <Text style={{padding: 20, alignSelf: 'center', color: Colors.text, fontSize: 16}}>We found no records matching your query.</Text>
          )
        }
      </SlidingMenu>
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
