import { useEffect, useMemo, useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Animated, Pressable, useWindowDimensions, Platform } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';
import { useRouter, Link } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Octicons from '@expo/vector-icons/Octicons';
import { BaseUrl } from '../../constants/api';
import * as auth from '../../helpers/auth';
import Popup from '../popup';
import LoadingResponse from '../loadingResponse';
import { useFocusEffect } from '@react-navigation/native';
import SlidingMenu from '../slidingMenu';

const ProfileOptionsButton = ({ userId }) => {
  const { user, logout, isValidSession } = useAuth();
  const [other, setOther] = useState(false);

  const [menuShown, setMenuShown] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0]; //sliding animation prep

  const [message, setMessage] = useState("");
  const [result, setResult] = useState(-1);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [reportConfirm, setReportConfirm] = useState(false);
  const [blockConfirm, setBlockConfirm] = useState(false);

  const [blocked, setBlocked] = useState(false);

  const router = useRouter();

  const { width } = useWindowDimensions();

  useEffect(() => {
    if (!user) setOther(true);
    else setOther(user.userId !== userId);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (!user || !other) return;
    
      let isActive = true;
    
      (async () => {
        try {
          const res = await fetch(`${BaseUrl.api}/users/user-relationships/${user.userId}`);
          if (!isActive) return;
        
          if (res.status === 200) {
            const json = await res.json();
            const blockedSet = new Set(json.blocked.map(uir => uir.id));
            setBlocked(blockedSet.has(userId));
          }
        } catch {
          console.log('failure.');
        }
      })();
    
      return () => {
        isActive = false; // clean up so state isn't set after unmount
      };
    }, [user, userId, other])
  );

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
    if (!(isValidSession())) {
      setMessage("Session invalid - you cannot edit your account.")
      setResult(401);
    } else {
      router.replace(`/profile/edit/${userId}`);
    }
  }
  async function handleShare() {
    if (!(isValidSession())) {
      //fail
    } else {
      //todo
    }
  }
  async function handleReport() {
    if (!(isValidSession())) {
      setMessage("Session invalid - you cannot report this account.")
      setResult(401);
    } else {
      const jwt = await auth.getJwt();
      await fetch(`${BaseUrl.api}/users/report/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      }).then((res) => {
        if (res.status === 200) {
          setMessage("You have successfully reported this user.");
          setResult(400); //to make the popup show, who cares lol
        } else if (res.status === 400 || res.status === 404) {
          setMessage("The user you are trying to report doesn't seem to exist, or your request was malformed.");
          setResult(404);
        } else {
          setMessage("Something went wrong! Contact Heteroboxd support for more information!");
          setResult(500);
        }
      })
    }
  }
  async function handleBlock() {
    if (!(isValidSession())) {
      setMessage("Session invalid - you cannot block this account.")
      setResult(401);
    } else {
      const jwt = await auth.getJwt();
      await fetch(`${BaseUrl.api}/users/relationships/${user.userId}/${userId}?Action=block-unblock`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      }).then((res) => {
        if (res.status === 200) {
          blocked ? setMessage('You have successfully unblocked this user') : setMessage('You have successfully blocked this user.');
          setResult(400); //to make the popup show, who cares lol
          setBlocked(prev => !prev);
        } else if (res.status === 404) {
          setMessage("The user you are trying to block no longer exists.");
          setResult(404);
        } else {
          setMessage("Something went wrong. Please contact Heteroboxd support for more information.")
          setResult(500);
        }
      });
    }
  }

  const widescreen = useMemo((() => Platform.OS === 'web' && width > 1000), [width]);

  return (
    <View>
      <Pressable onPress={openMenu}>
        <MaterialIcons name="more-vert" size={24} color={Colors.text} />
      </Pressable>

      <SlidingMenu menuShown={menuShown} closeMenu={closeMenu} translateY={translateY} widescreen={widescreen} width={width}>
        {other ? (
          <>
            <TouchableOpacity style={styles.option} onPress={() => {setReportConfirm(true)}}>
              <Text style={styles.optionText}>Report User  <Octicons name="report" size={18} color={Colors.text} /></Text>
            </TouchableOpacity>
            {
              blocked ? (
                <TouchableOpacity style={styles.option} onPress={handleBlock}>
                  <Text style={styles.optionText}>Unblock User  <Entypo name="lock-open" size={18} color={Colors.text} /></Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.option} onPress={handleBlock}>
                  <Text style={styles.optionText}>Block User  <Entypo name="block" size={18} color={Colors.text} /></Text>
                </TouchableOpacity>
              )
            }
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
            <TouchableOpacity style={styles.option} onPress={() => {setDeleteConfirm(true)}}>
              <Text style={styles.optionText}>Delete Profile  <AntDesign name="user-delete" size={18} color={Colors.text} /></Text>
            </TouchableOpacity>
          </>
        )}
      </SlidingMenu>

      <Popup visible={result === 400 || result === 401 || result === 404 || result === 500} message={message} onClose={() => {
          result === 500 ? router.replace('/contact') : router.replace(`/profile/${userId}`);
        }}
      />

      <Popup visible={deleteConfirm} message={"This action cannot be undone, and you may be unable to make a new account with the same e-mail until we finish processing the removal request. Are you sure you want to delete your account?"}
        onClose={() => {setDeleteConfirm(false)}} confirm={true} onConfirm={() => {handleDelete()}}
      />

      <Popup visible={reportConfirm} message={<Text>Are you sure this user has violated{' '}<Link style={styles.link} href="/guidelines">Heteroboxd community guidelines</Link>?</Text>}
        onClose={() => {setReportConfirm(false)}} confirm={true} onConfirm={() => {handleReport()}}
      />

      <Popup visible={blockConfirm} message={"Are you sure you want to block this user? Interactions will be disabled unless you unblock this account."}
        onClose={() => {setBlockConfirm(false)}} confirm={true} onConfirm={() => {handleBlock()}}
      />

      <LoadingResponse visible={result === 0} />
    </View>
  );
};

export default ProfileOptionsButton;

const styles = StyleSheet.create({
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
  link: {
    color: Colors.text_link,
    fontWeight: "600",
  },
});
