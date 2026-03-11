import { Animated, Image, Modal, Pressable, StyleSheet, View } from 'react-native'
import { Colors } from '../constants/colors'

const SideNav = ({ menuShown, closeMenu, translateX, width, children, footerImage }) => {
  return (
    <Modal
      transparent
      visible={menuShown}
      animationType='fade'
      onRequestClose={closeMenu}
    >
      <Pressable 
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]}
        onPress={closeMenu}
      />
      <Animated.View style={[styles.menu, { transform: [{ translateX }], width: width / 1.5, height: '100%', alignSelf: 'left' }]}>
        <View style={{ flex: 0.75 }}>
          {children}
        </View>
        {footerImage && (
          <View style={{ flex: 0.25, alignItems: 'center', justifyContent: 'center' }}>
            <Image
              source={footerImage}
              style={{ width: 100, height: 100, resizeMode: 'contain' }}
            />
          </View>
        )}
      </Animated.View>
    </Modal>
  )
}

export default SideNav

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    left: 0,
    backgroundColor: Colors.card,
    paddingVertical: 10,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12
  }
})