import { StyleSheet, Text, TouchableOpacity, View, Pressable, Modal, ScrollView } from 'react-native'
import { UserAvatar } from './userAvatar'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '../constants/colors';
import GlowingText from './glowingText';
import { useEffect, useState, useRef } from 'react';
import { Animated } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BaseUrl } from '../constants/api';
import * as auth from '../helpers/auth'
import { useAuth } from '../hooks/useAuth';
import { Snackbar } from 'react-native-paper';
import Stars from './stars';
import Checkbox from 'expo-checkbox';
import { Link, useRouter } from 'expo-router';

const FilmInteract = ({ widescreen, filmId, seen, watchlisted, review }) => {
  const [menuShown, setMenuShown] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0]; //sliding animation prep

  const [seenLocalCopy, setSeenLocalCopy] = useState(null);
  const [watchlistedLocalCopy, setWatchlistedLocalCopy] = useState(null);
  const [reviewLocalCopy, setReviewLocalCopy] = useState(null);
  const [seenPressed, setSeenPressed] = useState(false);

  const ratingRequestRef = useRef(0);
  const [isRatingSaving, setIsRatingSaving] = useState(false);

  const {user, isValidSession} = useAuth();

  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");

  const [listsClicked, setListsClicked] = useState(false);
  const [usersLists, setUsersLists] = useState([]);

  const router = useRouter();

  useEffect(() => {
    setSeenLocalCopy(seen);
    setWatchlistedLocalCopy(watchlisted);
    if (review) {
      setSeenLocalCopy(true);
    }
    setReviewLocalCopy({
      id: review?.id ?? null, 
      rating: review?.rating ?? null, 
      text: review?.text ?? null, 
      spoiler: review?.spoiler ?? null
    });
  }, [seen, watchlisted, review]);

  useEffect(() => {
    if (!review?.id) return;
  
    setReviewLocalCopy(prev => {
      if (prev?.id === review.id) return prev;
      return {
        id: review.id,
        rating: review.rating,
        text: review.text,
        spoiler: review.spoiler
      };
    });
  }, [review?.id]);

  async function handleRatingChange(newRating) {
    //optimistic UI update
    setSeenLocalCopy(true);
    setWatchlistedLocalCopy(false);

    setReviewLocalCopy(prev => ({
      id: prev?.id ?? null,
      rating: newRating,
      text: prev?.text ?? null,
      spoiler: prev?.spoiler ?? false
    }));

    const requestId = ++ratingRequestRef.current;
    setIsRatingSaving(true);

    const vS = await isValidSession();
    if (!user || !vS) {
      setIsRatingSaving(false);
      router.replace('/login');
      return;
    }

    try {
      const jwt = await auth.getJwt();
      let res;

      //update
      if (reviewLocalCopy?.id) {
        res = await fetch(`${BaseUrl.api}/reviews`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            ReviewId: reviewLocalCopy.id,
            Rating: newRating,
            Text: reviewLocalCopy.text ?? null,
            Spoiler: reviewLocalCopy.spoiler ?? false
          })
        });
      }
      //create
      else {
        res = await fetch(`${BaseUrl.api}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            Rating: newRating,
            Text: null,
            Spoiler: false,
            AuthorId: user.userId,
            FilmId: filmId
          })
        });
      }

      if (requestId !== ratingRequestRef.current) return; //ignore stale response

      if (res.status === 200) {
        const json = await res.json();

        setReviewLocalCopy(prev => ({
          ...prev,
          id: json.id,
          rating: json.rating
        }));
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      if (requestId !== ratingRequestRef.current) return;

      setSnackMessage('Failed to save rating. Please try again.');
      setSnackVisible(true);
    } finally {
      if (requestId === ratingRequestRef.current) {
        setIsRatingSaving(false);
      }
    }
  }

  const openMenu = () => {
    setMenuShown(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(async () => {
      setMenuShown(false);
      setListsClicked(false);
    });
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0], //slide from bottom
  });

  //extracted components
  const button = 
    <View style={[styles.card, {width: widescreen ? '50%' : '90%', borderWidth: widescreen ? 0 : 2, borderColor: widescreen ? 'transparent' : Colors._heteroboxd}]}>
      <Pressable onPress={openMenu}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center' }}>
          <UserAvatar pictureUrl={user?.pictureUrl ?? null} style={[styles.avatar, {width: widescreen ? 28 : 24, height: widescreen ? 28 : 24, borderRadius: widescreen ? 14 : 12}]} />
          <Text style={{color: Colors.text_button, fontSize: widescreen ? 16 : 13}}>
            {
              seenLocalCopy
                ? (reviewLocalCopy?.rating != null)
                  ? <Stars size={widescreen ? 16 : 13} rating={reviewLocalCopy.rating} readonly={true} padding={false} />
                  : "You have watched this film."
                : watchlistedLocalCopy
                  ? "This film is in your watchlist."
                  : "Watch, review, or add this film to your lists"
            }
          </Text>
          <MaterialIcons name="more-horiz" size={widescreen ? 24 : 20} color={Colors.text_button} />
        </View>
      </Pressable>
    </View>

  const watch = 
    <View style={styles.buttonContainer}>
      <TouchableOpacity onPress={handleWatch}>
        <MaterialCommunityIcons name="eye-outline" size={widescreen ? 50 : 35} color={Colors.text} />
      </TouchableOpacity>
      <Text style={{color: Colors.text, fontSize: widescreen ? 20 : 18}}>Watch</Text>
    </View>

  const watched =
    <View style={styles.buttonContainer}>
      <TouchableOpacity onPress={() => {setSeenPressed(true)}}>
        <MaterialCommunityIcons name="eye-check" size={widescreen ? 50 : 35} color={Colors._heteroboxd} />
      </TouchableOpacity>
      <Text style={{color: Colors._heteroboxd, fontSize: widescreen ? 20 : 18}}>Watched</Text>
    </View>

  const rewatch =
    <View style={styles.buttonContainer}>
      <TouchableOpacity onPress={handleWatch}>
        <MaterialCommunityIcons name="eye-refresh" size={widescreen ? 50 : 35} color={Colors.text} />
      </TouchableOpacity>
      <Text style={{color: Colors.text, fontSize: widescreen ? 20 : 18}}>Rewatch</Text>
    </View>

  const unwatch =
    <View style={styles.buttonContainer}>
      <TouchableOpacity onPress={handleUnwatch}>
        <MaterialCommunityIcons name="eye-off" size={widescreen ? 50 : 35} color={Colors.heteroboxd} />
      </TouchableOpacity>
      <Text style={{color: Colors.heteroboxd, fontSize: widescreen ? 20 : 18}}>Remove</Text>
    </View>

  const watchlist =
    <View style={styles.buttonContainer}>
      <TouchableOpacity onPress={handleWatchlist}>
        <MaterialCommunityIcons name="bookmark-plus-outline" size={widescreen ? 50 : 35} color={Colors.text} />
      </TouchableOpacity>
      <Text style={{color: Colors.text, fontSize: widescreen ? 20 : 18}}>Watchlist</Text>
    </View>

  const unwatchlist =
    <View style={styles.buttonContainer}>
      <TouchableOpacity onPress={handleWatchlist}>
        <MaterialCommunityIcons name="bookmark-remove" size={widescreen ? 50 : 35} color={Colors.heteroboxd} />
      </TouchableOpacity>
      <Text style={{color: Colors.heteroboxd, fontSize: widescreen ? 20 : 18}}>Watchlist</Text>
    </View>

  const selectLists = //these are the lists to which the selected film will be added
    <>        
      {
        usersLists?.length > 0 ? (
          <ScrollView
            style={{ maxHeight: widescreen ? 500 : 250 }}
            showsVerticalScrollIndicator={false}
          >
            {usersLists.map((item) => (
              <View key={item.listId} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 20 }}>
                <Checkbox
                  color={Colors.heteroboxd}
                  style={{width: widescreen ? 24 : 20, height: widescreen ? 24 : 20}}
                  disabled={item.containsFilm}
                  value={item.containsFilm || item.selected || false}
                  onValueChange={(checked) => {
                    setUsersLists(prev =>
                      prev.map(l =>
                        l.listId === item.listId ? { ...l, selected: checked } : l
                      )
                    );
                  }}
                />
                <Text style={{ marginLeft: 8, marginRight: 8, color: Colors.text, fontSize: widescreen ? 24 : 20 }}>{item.listName}</Text>
              </View>
            ))}
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15}}>
              <Pressable style={{marginRight: 20, backgroundColor: Colors.button_reject, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4}} onPress={() => listsClicked(false)}>
                <Text style={{fontWeight: '500', fontSize: widescreen ? 22 : 18, color: Colors.text_title}}>Cancel</Text>
              </Pressable>
              <Pressable style={{backgroundColor: Colors.button_confirm, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 2}} onPress={addToLists}>
                <Text style={{fontWeight: '500', fontSize: widescreen ? 22 : 18, color: Colors.text_title}}>Add</Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <Text style={{color: Colors.text_placeholder, textAlign: 'center', paddingHorizontal: 10, paddingBottom: 15, fontSize: 14}}>
            You have not created any lists. 
            <Link href="/list/create" style={{color: Colors.text_link}}> Create one now?</Link>
          </Text>
        )
      }
    </>

  //handlers
  async function handleWatch() {
    const vS = await isValidSession();
    if (vS) {
      try {
        const jwt = await auth.getJwt();
        const res = await fetch(`${BaseUrl.api}/users/track-film/${user.userId}/${filmId}?Action=watched`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${jwt}`,
          }
        });
        if (res.status === 200) {
          setSeenPressed(false); //just in case
          setSeenLocalCopy(true);
          setWatchlistedLocalCopy(false);
        } else if (res.status === 404) {
          setSnackMessage("We failed to find your earlier records.");
          setSnackVisible(true);
        } else if (res.status === 401) {
          setSnackMessage("Session expired - try logging in again.");
          setSnackVisible(true);
        } else if (res.status === 400) {
          setSnackMessage("Query malformed - what did you do?");
          setSnackVisible(true);
        } else {
          setSnackMessage("Something went wrong. Contact support if error persists.");
          setSnackVisible(true);
        }
      } catch {
        setSnackMessage("Network error - are you connected to the internet?");
        setSnackVisible(true);
      }
    } else {
      setSnackMessage("Session expired - try logging in again.");
      setSnackVisible(true);
    }
  }

  async function handleUnwatch() {
    const vS = await isValidSession();
    if (vS) {
      try {
        const jwt = await auth.getJwt();
        const res = await fetch(`${BaseUrl.api}/users/track-film/${user.userId}/${filmId}?Action=unwatched`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${jwt}`,
          }
        });
        if (res.status === 200) {
          setSeenPressed(false); //reset state
          setSeenLocalCopy(false);
          setReviewLocalCopy(null);
        } else if (res.status === 404) {
          setSnackMessage("We failed to find your earlier records.");
          setSnackVisible(true);
        } else if (res.status === 401) {
          setSnackMessage("Session expired - try logging in again.");
          setSnackVisible(true);
        } else if (res.status === 400) {
          setSnackMessage("Query malformed - what did you do?");
          setSnackVisible(true);
        } else {
          setSnackMessage("Something went wrong. Contact support if error persists.");
          setSnackVisible(true);
        }
      } catch {
        setSnackMessage("Network error - are you connected to the internet?");
        setSnackVisible(true);
      }
    } else {
      setSnackMessage("Session expired - try logging in again.");
      setSnackVisible(true);
    }
  }

  async function handleWatchlist() {
    const vS = await isValidSession();
    if (!vS) {
      setSnackMessage("Session expired - try logging in again.");
      setSnackVisible(true);
      return;
    }
    try {
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/users/watchlist/${user.userId}/${filmId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`,
        }
      });
      if (res.status === 200) {
        setWatchlistedLocalCopy(w => !w);
      } else if (res.status === 404) {
        setSnackMessage("This film doesn't exist anymore.");
        setSnackVisible(true);
      } else if (res.status === 401) {
        setSnackMessage("Session expired - try logging in again.");
        setSnackVisible(true);
      } else {
        setSnackMessage("Something went wrong. Contact support if error persists.");
        setSnackVisible(true);
      }
    } catch {
      setSnackMessage("Network error - are you connected to the internet?");
      setSnackVisible(true);
    }
  }

  async function fetchLists() {
    const vS = await isValidSession();
    if (!user || !vS) {
      setSnackMessage('Session expired! Try logging in again.');
      setSnackVisible(true);
    }
    try {
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/lists/film-interact/${user.userId}/${filmId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      });
      if (res.status === 200) {
        const json = await res.json();
        setUsersLists(json);
      } else {
        setSnackMessage(`${res.status}: Failed to fetch your lists! Try reloading Heteroboxd.`);
        setSnackVisible(true);
      }
    } catch {
      setSnackMessage('Network error - check your internet connection.');
      setSnackVisible(true);
    }
  }

  async function addToLists() {
    const vS = await isValidSession();
    if (!user || !vS) {
      setListsClicked(false);
      setSnackMessage('Session expired! Try logging in again.');
      setSnackVisible(true);  
    }
    try {
      const lists = usersLists
        .filter(item => item.selected)
        .map(item => ({
          key: item.listId,
          value: item.size
        }));
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/lists/update-bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          AuthorId: user.userId,
          FilmId: filmId,
          Lists: lists
        })
      });
      if (res.status !== 200) {
        setListsClicked(false);
        setSnackMessage(`${res.status}: Updating lists failed! Try reloading Heteroboxd.`);
        setSnackVisible(true);
      }
      setListsClicked(false);
      setSnackMessage(`Film added.`);
      setSnackVisible(true);
    } catch {
      setListsClicked(false);
      setSnackMessage('Network error - check your internet connection.');
      setSnackVisible(true);
    }
  }

  async function rate() {
    const vS = await isValidSession();
    if (!user || !vS) {
      closeMenu();
      router.replace(`/login`);
      return;
    }
    try {
      const jwt = await auth.getJwt();
      let res;
      if (reviewLocalCopy?.id) {
        res = await fetch(`${BaseUrl.api}/reviews`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            ReviewId: reviewLocalCopy?.id,
            Rating: reviewLocalCopy.rating,
            Text: reviewLocalCopy?.text ?? null,
            Spoiler: reviewLocalCopy?.spoiler ?? false
          })
        });
      } else {
        res = await fetch(`${BaseUrl.api}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            Rating: reviewLocalCopy.rating,
            Text: null,
            Spoiler: false,
            AuthorId: user?.userId,
            FilmId: filmId
          })
        });
      }
      if (res.status === 200) {
        const json = await res.json();
        setReviewLocalCopy({id: json.id, rating: json.rating, text: json.text, spoiler: json.spoiler});
      } else {
        setSnackMessage(`${res.status}: Failed to alter your review! Try reloading Heteroboxd.`);
        setSnackVisible(true);
      }
    } catch {
      setSnackMessage(`Network error! Please check your internet connection.`);
      setSnackVisible(true);
    }
  }

  return (
    <>
      { widescreen
        ? (
            <GlowingText color={Colors._heteroboxd} div={true}>
              {button}
            </GlowingText>
          )
        : (
          button
        )
      }
      <Modal transparent visible={menuShown} animationType="fade">
        <Pressable style={styles.overlay} onPress={closeMenu}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.05)' }]} />
        </Pressable>

        <Animated.View style={[styles.menu, {width: widescreen ? 750 : '100%', alignSelf: 'center'}, { transform: [{ translateY }] }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {seenLocalCopy ? (
              seenPressed ? (
                <>
                  {rewatch}
                  {unwatch}
                </>
              ) : (
                watched
              )
            ) : (
              watch
            )}
            {watchlistedLocalCopy ? unwatchlist : watchlist}
          </View>

          <View style={styles.divider} />

          <Stars
            size={widescreen ? 60 : 50}
            rating={reviewLocalCopy?.rating ?? 0}
            onRatingChange={handleRatingChange}
            padding={true}
          />
          <Text style={{color: Colors.text, fontSize: 16, alignSelf: 'center'}}>Rate</Text>

          <View style={styles.divider} />

          <TouchableOpacity onPress={async () => {
            closeMenu();
            reviewLocalCopy?.id ? router.push(`/review/${reviewLocalCopy.id}`) : router.push(`/review/alter/${filmId}`);
          }}>
            <View style={{padding: 20, paddingTop: 0, paddingBottom: 0, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center'}}>
              <Text style={{color: Colors.text, fontSize: widescreen ? 24 : 20, marginRight: 10}}>Review this film</Text>
              <MaterialCommunityIcons name="typewriter" size={24} color={Colors.text} />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />
          
          {
            listsClicked ? (
                selectLists
            ) : (
              <TouchableOpacity onPress={async () => {
                await fetchLists();
                setListsClicked(true);
              }}>
                <View style={{padding: 20, paddingTop: 0, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center'}}>
                  <Text style={{color: Colors.text, fontSize: widescreen ? 24 : 20, marginRight: 10}}>Add to lists</Text>
                  <MaterialCommunityIcons name="playlist-plus" size={28} color={Colors.text} />
                </View>
              </TouchableOpacity>
            )
          }

          <Snackbar
            visible={snackVisible}
            onDismiss={() => setSnackVisible(false)}
            duration={3000}
            style={{
              backgroundColor: Colors.card,
              width: widescreen ? '50%' : '90%',
              alignSelf: 'center',
              borderRadius: 8,
            }}
            action={{
              label: 'OK',
              onPress: () => setSnackVisible(false),
              textColor: Colors.text_link
            }}
          >
            {snackMessage}
          </Snackbar>
        </Animated.View>
      </Modal>
    </>
  )
}

export default FilmInteract

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 2,
    alignSelf: 'center',
    marginVertical: 10
  },
  avatar: {
    borderWidth: 2,
    borderColor: Colors.border_color,
  },
  overlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: Colors.card,
    paddingVertical: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  buttonContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15
  },
  divider: {
    height: 1.5,
    backgroundColor: Colors.border_color,
    marginVertical: 20,
    width: "75%",
    alignSelf: "center",
    opacity: 0.5,
  },
})