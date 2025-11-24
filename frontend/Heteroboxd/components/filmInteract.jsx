import { StyleSheet, Text, TouchableOpacity, View, Pressable, Modal } from 'react-native'
import { UserAvatar } from './userAvatar'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '../constants/colors';
import GlowingText from './glowingText';
import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BaseUrl } from '../constants/api';
import * as auth from '../helpers/auth'
import { useAuth } from '../hooks/useAuth';
import { Snackbar } from 'react-native-paper';

const FilmInteract = ({ widescreen, filmId, seen, watchlisted, rating }) => {

  console.log(seen);

  const [menuShown, setMenuShown] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0]; //sliding animation prep

  const [seenLocalCopy, setSeenLocalCopy] = useState(null);
  const [watchlistedLocalCopy, setWatchlistedLocalCopy] = useState(null);
  const [ratingLocalCopy, setRatingLocalCopy] = useState(null);
  const [seenPressed, setSeenPressed] = useState(false);

  const {user, isValidSession} = useAuth();

  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");

  useEffect(() => {
    setSeenLocalCopy(seen);
    setWatchlistedLocalCopy(watchlisted);
    setRatingLocalCopy(rating);
  }, [seen, watchlisted, rating]);

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
    }).start(() => setMenuShown(false));
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
                ? ratingLocalCopy
                  ? `You rated this film {stars}`
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

  //handlers
  async function handleWatch() {
    if (isValidSession()) {
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
    if (isValidSession()) {
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
    if (!isValidSession()) {
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
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
        </Pressable>

        <Animated.View style={[styles.menu, {width: widescreen ? '50%' : '100%', alignSelf: 'center'}, { transform: [{ translateY }] }]}>
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
              label: ':(',
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
  }
})