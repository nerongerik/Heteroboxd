import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Modal, Animated, Pressable, useWindowDimensions, Platform } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/colors';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BaseUrl } from '../constants/api';
import * as auth from '../helpers/auth';
import { Snackbar } from 'react-native-paper';

const ListOptionsButton = ({ listId }) => {
  const { user, isValidSession } = useAuth();

  const [menuShown, setMenuShown] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0]; //sliding animation prep

  const router = useRouter();

  const { width, height } = useWindowDimensions();

  const [baseList, setBaseList] = useState(null);
  const [notifsOnLocal, setNotifsOnLocal] = useState(true);

  const [snack, setSnack] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
         const res = await fetch(`${BaseUrl.api}/lists/${listId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
         });
         if (res.status === 200) {
          const json = await res.json();
          setBaseList(json);
          setNotifsOnLocal(json.notificationsOn);
         }
      } catch {
        console.log('Network error!');
      }
    })();
  }, [user, listId]);

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
    if (!user || !isValidSession()) router.replace('/login');
    try {
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/lists/${baseList?.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });
      if (res.status === 200) router.replace(`profile/${user.userId}`);
      else {
        setMsg('Delete failed - please make sure your session is valid, and you are viewing the correct list.');
        setSnack(true);
      }
    } catch {
      setMsg('Network error. Check your internet connection.');
      setSnack(true);
    }
  }

  async function handleNotifications() {
    if (!user || !isValidSession()) router.replace('/login');
    try {
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/lists/toggle-notifications/${baseList?.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });
      if (res.status === 200) {
        if (notifsOnLocal) setMsg('You will no longer recieve notifications for this list.');
        else setMsg('You will now recieve notifications for this list.')
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
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]}
          onPress={closeMenu}
        />

        <Animated.View style={[styles.menu, { transform: [{ translateY }], width: widescreen ? '50%' : width, alignSelf: 'center' }]}>
          {
            user?.tier.toLowerCase() === 'admin' ? (
              <TouchableOpacity style={styles.option} onPress={handleDelete}>
                <Text style={styles.optionText}>Delete w/ Admin Privileges </Text>
                <MaterialIcons name="delete-forever" size={20} color={Colors.text} />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.option} onPress={() => {}}>
                  <Text style={styles.optionText}>Edit List </Text>
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
                  <Text style={styles.optionText}>Delete List </Text>
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

export default ListOptionsButton;

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
    flexDirection: 'row'
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
});
