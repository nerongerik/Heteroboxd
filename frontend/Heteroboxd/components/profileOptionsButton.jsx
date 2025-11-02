import { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Modal, Animated, Pressable } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useRouter } from 'expo-router';

const ProfileOptionsButton = ({ userId }) => {
  const { user, logout } = useAuth();
  const [other, setOther] = useState(false);
  const [menuShown, setMenuShown] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0]; //sliding animation prep
  const router = useRouter();

  useEffect(() => {
    setOther(user.userId !== userId);
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
    await logout(user.userId);
    router.replace('/');
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
              <TouchableOpacity style={styles.option}>
                <Text style={styles.optionText}>Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.option}>
                <Text style={styles.optionText}>Block</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.option} onPress={handleLogout}>
                <Text style={styles.optionText}>Logout</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.option}>
                <Text style={styles.optionText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.option}>
                <Text style={styles.optionText}>Share</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </Modal>
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
