import { Animated, Modal, Pressable, StyleSheet } from 'react-native'
import { Colors } from '../constants/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const SlidingMenu = ({ menuShown, closeMenu, translateY, widescreen, width, height, children }) => {
  const insets = useSafeAreaInsets()
  return (
    <Modal transparent visible={menuShown} animationType='fade' onRequestClose={closeMenu}>
      <Pressable 
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.05)' }]}
        onPress={closeMenu}
      />
      <Animated.View style={[styles.menu, { transform: [{ translateY }], width: widescreen ? '50%' : width, height: height, alignSelf: 'center', paddingBottom: insets.bottom }]}>
        {children}
      </Animated.View>
    </Modal>
  )
}

export default SlidingMenu

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
})