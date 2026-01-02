import { StyleSheet, Modal, Animated, Pressable } from 'react-native'
import { Colors } from '../constants/colors'

const SlidingMenu = ({menuShown, closeMenu, translateY, widescreen, width, children}) => {
  return (
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