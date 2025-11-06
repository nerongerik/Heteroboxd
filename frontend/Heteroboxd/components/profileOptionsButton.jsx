import { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Modal, Animated, Pressable } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/colors';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Octicons from '@expo/vector-icons/Octicons';
import { BaseUrl } from '../constants/api';
import * as auth from '../helpers/auth';
import Popup from './popup';
import LoadingResponse from './loadingResponse';

const ProfileOptionsButton = ({ userId }) => {
  const { user, logout, isValidSession } = useAuth();
  const [other, setOther] = useState(false);

  const [menuShown, setMenuShown] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0]; //sliding animation prep

  const [message, setMessage] = useState("");
  const [result, setResult] = useState(-1);

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!user) setOther(true);
    else setOther(user.userId !== userId);
  }, []);

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

  //button functionalities
  async function handleLogout() {
    setResult(0);
    if (!(isValidSession)) {
      setMessage("Session invalid - you cannot sign out of your account.")
      setResult(401);
    } else {
      await logout(userId);
      router.replace('/');
    }
  }
  async function handleDelete() {
    setResult(0);
    if (!(await isValidSession())) {
      setMessage("Session invalid - you cannot delete your account.")
      setResult(401);
    }
    else {
      await fetch(`${BaseUrl.api}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await auth.getJwt()}`
        }
      }).then(async (res) => {
        if (res.status === 200) {
          setResult(200);
          await handleLogout();
        } else if (res.status === 400) {
          setMessage("The request user doesn't belong to our database!");
          setResult(400);
        } else if (res.status === 401) {
          //special case -> since this is astronomically unlikely to occur (and then, only due to stale tokens),
          //straight up just lie to the user that they are successfully deleted and log them out (empty their storage) lol
          setResult(-1);
          await handleLogout();
        } else if (res.status === 404) {
          setMessage("This user no longer exists.");
          setResult(404);
        } else {
          setMessage("Something went wrong! Contact Heteroboxd support for more information!");
          setResult(500);
        }
      })
    }
  }
  async function handleEdit() {
    if (!(isValidSession)) {
      //fail
    } else {
      //todo
    }
  }
  async function handleShare() {
    if (!(isValidSession)) {
      //fail
    } else {
      //todo
    }
  }
  async function handleReport() {
    if (!(isValidSession)) {
      //fail
    } else {
      //todo
    }
  }
  async function handleBlock() {
    if (!(isValidSession)) {
      //fail
    } else {
      //todo
    }
  }

  return (
    <View>
      <TouchableOpacity onPress={openMenu}>
        <MaterialIcons name="more-vert" size={24} color={Colors.text} />
      </TouchableOpacity>

      <Modal transparent visible={menuShown} animationType="fade">
        <Pressable style={styles.overlay} onPress={closeMenu}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
        </Pressable>

        <Animated.View style={[styles.menu, { transform: [{ translateY }] }]}>
          {other ? (
            <>
              <TouchableOpacity style={styles.option} onPress={handleReport}>
                <Text style={styles.optionText}>Report User  <Octicons name="report" size={18} color={Colors.text} /></Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.option} onPress={handleBlock}>
                <Text style={styles.optionText}>Block User  <Entypo name="block" size={18} color={Colors.text} /></Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.option} onPress={handleShare}>
                <Text style={styles.optionText}>Share Profile  <Entypo name="share" size={18} color={Colors.text} /></Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.option} onPress={handleEdit}>
                <Text style={styles.optionText}>Edit Profile  <Feather name="edit" size={18} color={Colors.text} /></Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.option} onPress={handleLogout}>
                <Text style={styles.optionText}>Sign Out  <FontAwesome name="sign-out" size={18} color={Colors.text} /></Text>
              </TouchableOpacity>
              {/* only delete account need have a confirmation dialog, since it's the only one that cannot be undone*/}
              <TouchableOpacity style={styles.option} onPress={() => {setDeleteConfirm(true)}}>
                <Text style={styles.optionText}>Delete Profile  <AntDesign name="user-delete" size={18} color={Colors.text} /></Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </Modal>

      <Popup visible={result === 400 || result === 401 || result === 404 || result === 500} message={message} onClose={() => {
          result === 500 ? router.replace('/contact') : router.replace(`/profile/${userId}`);
        }}
      />

      <Popup visible={deleteConfirm} message={"This action cannot be undone, and you may be unable to make a new account with the same e-mail until the next database purge. Are you sure you want to delete your account?"}
        onClose={() => {setDeleteConfirm(false)}} confirm={true} onConfirm={() => {handleDelete()}}
      />

      <LoadingResponse visible={result === 0} />
    </View>
  );
};

export default ProfileOptionsButton;

const styles = StyleSheet.create({
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
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
});
