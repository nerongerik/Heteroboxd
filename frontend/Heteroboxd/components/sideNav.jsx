import { Animated, Image, Modal, Platform, Pressable, StyleSheet, View } from 'react-native'
import { Colors } from '../constants/colors'
import HText from '../components/htext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Application from 'expo-application'

const SideNav = ({ menuShown, closeMenu, translateX, width, children, footerImage }) => {
  const insets = useSafeAreaInsets()
  return (
    <Modal transparent visible={menuShown} animationType='fade' onRequestClose={closeMenu}>
      <Pressable 
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]}
        onPress={closeMenu}
      />
      <Animated.View style={[styles.menu, { transform: [{ translateX }], width: width / 1.5, height: '100%', alignSelf: 'left', paddingTop: insets.top + 5, paddingBottom: insets.bottom }]}>
        <View style={{ flex: 0.75 }}>
          {children}
        </View>
        {footerImage && (
          <View style={{ flex: 0.25, alignItems: 'center', justifyContent: 'flex-start' }}>
            <Image source={footerImage} style={{ width: 175, height: 175, resizeMode: 'contain' }} />
            {Platform.OS !== 'web' && <HText style={{color: Colors.text, fontWeight: '300', fontSize: 12}}>version {Application.nativeApplicationVersion}</HText>}
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
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12
  }
})