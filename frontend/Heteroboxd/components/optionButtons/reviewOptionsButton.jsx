import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Modal, Animated, Pressable, useWindowDimensions, Platform } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BaseUrl } from '../../constants/api';
import * as auth from '../../helpers/auth';
import { Snackbar } from 'react-native-paper';
import { Octicons } from '@expo/vector-icons';

const ReviewOptionsButton = ({ reviewId }) => {
  const { user, isValidSession } = useAuth();

  const [menuShown, setMenuShown] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0]; //sliding animation prep

  const router = useRouter();

  const { width } = useWindowDimensions();

  const [review, setReview] = useState(null);
  const [notifsOnLocal, setNotifsOnLocal] = useState(true);

  const [snack, setSnack] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch(`${BaseUrl.api}/reviews/${reviewId}`, {
         method: 'GET',
         headers: {
           'Accept': 'application/json'
         }
        });
        if (res.status === 200) {
         const json = await res.json();
         setReview(json);
         setNotifsOnLocal(json.notificationsOn);
        }
      } catch {
        console.log('Network error!');
      }
    })();
  }, [user, reviewId]);

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

  const widescreen = useMemo((() => Platform.OS === 'web' && width > 1000), [width]);

  async function handleDelete() {
    const vS = await isValidSession();
    if (!user || !vS) router.replace('/login');
    try {
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });
      if (res.status === 200) {
        closeMenu();
        router.replace(`profile/${user.userId}`);
      }
      else {
        setMsg('Delete failed - please make sure your session is valid, and you are viewing the correct review.');
        setSnack(true);
      }
    } catch {
      setMsg('Network error. Check your internet connection.');
      setSnack(true);
    }
  }

  async function handleNotifications() {
    const vS = await isValidSession();
    if (!user || !vS) router.replace('/login');
    try {
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/reviews/toggle-notifications/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });
      if (res.status === 200) {
        if (notifsOnLocal) setMsg('You will no longer recieve notifications for this review.');
        else setMsg('You will now recieve notifications for this review.')
        setSnack(true);
        setNotifsOnLocal(prev => !prev);
      } else {
        setMsg(`${res.status}: Failed to flip notifications.`)
        setSnack(true);
      }
    } catch {
      setMsg(`Network error - check your internet connection.`)
      setSnack(true);
    }
  }

  async function handleEdit() {
    const vS = await isValidSession();
    if (!user || !vS) router.replace('/login');
    if (review?.authorId !== user.userId) {
      setMsg("You are not supposed to be seeing this - what did you do?");
      setSnack(true);
      return;
    }
    closeMenu();
    router.push(`review/alter/${review?.filmId}`);
  }

  async function handleReport() {
    try {
      const vS = await isValidSession();
      if (!user || !vS) {
        setMsg("Session expired! Try logging in again.");
        setSnack(true);  
      }
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/reviews/report/${reviewId}`, {
        method: 'PUT',
        headers: {'Authorization': `Bearer ${jwt}`}
      });
      if (res.status === 200) {
        setMsg("Review reported.");
        setSnack(true);
      } else {
        setMsg(`${res.status}: Failed to report review! Try reloading Heteroboxd.`);
        setSnack(true);
      }
    } catch {
      setMsg("Network error! Check your internet connection.");
      setSnack(true);
    }
  }

  return (
    <View>
      <Pressable onPress={openMenu} style={{zIndex: 1}}>
        <MaterialIcons name="more-vert" size={24} color={Colors.text} />
      </Pressable>

      <Modal
        transparent
        visible={menuShown}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable 
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.05)' }]}
          onPress={closeMenu}
        />

        <Animated.View style={[styles.menu, { transform: [{ translateY }], width: widescreen ? '50%' : width, alignSelf: 'center' }]}>
          {
            user?.tier.toLowerCase() === 'admin' ? (
              <TouchableOpacity style={styles.option} onPress={handleDelete}>
                <Text style={styles.optionText}>Delete w/ Admin Privileges </Text>
                <MaterialIcons name="delete-forever" size={20} color={Colors.text} />
              </TouchableOpacity>
            ) : user?.userId !== review?.authorId ? (
              <TouchableOpacity style={styles.option} onPress={handleReport}>
                <Text style={styles.optionText}>Report Review </Text>
                <Octicons name="report" size={18} color={Colors.text} />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.option} onPress={handleEdit}>
                  <Text style={styles.optionText}>Edit Review </Text>
                  <MaterialIcons name="edit" size={20} color={Colors.text} />
                </TouchableOpacity>
                  {
                    notifsOnLocal ? (
                      <TouchableOpacity style={styles.option} onPress={handleNotifications}>
                        <Text style={styles.optionText}>Turn Notifications Off </Text>
                        <MaterialIcons name="notifications-off" size={20} color={Colors.text} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.option} onPress={handleNotifications}>
                        <Text style={styles.optionText}>Turn Notifications On </Text>
                        <MaterialIcons name="notifications-active" size={20} color={Colors.text} />
                      </TouchableOpacity>
                    )
                  }
                <TouchableOpacity style={styles.option} onPress={handleDelete}>
                  <Text style={styles.optionText}>Delete Review </Text>
                  <MaterialIcons name="delete-forever" size={20} color={Colors.text} />
                </TouchableOpacity>
              </>
            )
          }
          <Snackbar
            visible={snack}
            onDismiss={() => setSnack(false)}
            duration={3000}
            style={{
              backgroundColor: Colors.card,
              width: Platform.OS === 'web' && width > 1000 ? width*0.5 : width*0.9,
              alignSelf: 'center',
              borderRadius: 8,
            }}
            action={{
              label: 'OK',
              onPress: () => setSnack(false),
              textColor: Colors.text_link
            }}
          >
            {msg}
          </Snackbar>
        </Animated.View>
      </Modal>
    </View>
  );
};

export default ReviewOptionsButton;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: Colors.card,
    paddingVertical: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignContent: 'center',
    flexDirection: 'row',
    alignItems: 'center'
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
});
