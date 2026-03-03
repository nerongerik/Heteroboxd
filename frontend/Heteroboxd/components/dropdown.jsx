import { View, StyleSheet, Pressable, Text, Modal, Animated } from 'react-native'
import { Colors } from '../constants/colors'
import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { UserAvatar } from './userAvatar'
import { FontAwesome } from '@expo/vector-icons';

const Dropdown = forwardRef(({user, notifs, children}, ref) => {
  const [menuShown, setMenuShown] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const animValue = useRef(new Animated.Value(0)).current

  useImperativeHandle(ref, () => ({
    close: () => closeMenu()
  }))

  const [triggerLayout, setTriggerLayout] = useState(null)
  const triggerRef = useRef(null)

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height })
      setModalVisible(true)
      setMenuShown(true)
      animValue.setValue(0)
      Animated.timing(animValue, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start()
    })
  }

  const closeMenu = () => {
    Animated.timing(animValue, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false)
      setMenuShown(false)
    })
  }

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  })

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  return (
    <View>
      <Pressable
        ref={triggerRef}
        onPress={menuShown ? closeMenu : openMenu}
        style={{ width: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}
      >
        {
          user?.userId ? (
            <>
              <View style={{ width: 32, alignItems: 'center' }}>
                <UserAvatar pictureUrl={user.pictureUrl ?? null} style={{ width: 32, height: 32, borderRadius: 16 }} />
                {notifs && <View style={styles.badge} />}
              </View>
              <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.text_title }}>{!menuShown ? ' ▼' : ' ▲'}</Text>
            </>
          ) : (
            <>
              <FontAwesome name="user-circle" size={24} color={Colors.text} />
              <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.text_title }}>{!menuShown ? ' ▼' : ' ▲'}</Text>
            </>
          )
        }
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.backdrop} onPress={closeMenu} />

        {triggerLayout && (
          <Animated.View style={[
            styles.dropdownMenu,
            {
              top: triggerLayout.y + triggerLayout.height + 5,
              left: triggerLayout.x + triggerLayout.width - 220,
              opacity,
              transform: [{ translateY }],
            }
          ]}>
            {children}
          </Animated.View>
        )}
      </Modal>
    </View>
  )
})

export default Dropdown

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 5,
    minWidth: 220,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
  },
})