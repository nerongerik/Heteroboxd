import { useEffect, useState } from 'react'
import { Modal, View, Text, Pressable, StyleSheet, BackHandler } from 'react-native'
import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { Colors } from '../constants/colors'
import { AuthProvider } from '../contexts/authContext'
import { useCountrySync } from '../hooks/useCountrySync'
import { useTrendingSync } from '../hooks/useTrendingSync'
import { useVersionCheck } from '../hooks/useVersionCheck'
import './browser.css'
import Back from '../assets/icons/back.svg'
import { SafeAreaProvider } from 'react-native-safe-area-context'

SplashScreen.preventAutoHideAsync()

const UpdateModal = ({ visible, optional, onUpdate, onDismiss }) => {
  useEffect(() => {
    if (!visible || optional) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
    return () => sub.remove()
  }, [visible, optional])

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {optional ? 'Update Available!' : 'Update Required!'}
          </Text>
          <Text style={styles.body}>
            {optional
              ? 'Your Heteroboxd version is outdated. Please update to gain access to new features and bug fixes.'
              : 'Your Heteroboxd version is outdated and no longer supported. Please update to continue.'}
          </Text>
          <Pressable style={styles.button} onPress={onUpdate}>
            <Text style={styles.buttonText}>Update</Text>
          </Pressable>
          {optional && (
            <Pressable style={styles.dismiss} onPress={onDismiss}>
              <Text style={styles.dismissText}>Later</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  )
}

const RootLayout = () => {
  const [loaded, error] = useFonts({Inter_400Regular: require('../assets/fonts/Inter_400Regular.ttf')})
  const { updateRequired, updateAvailable, openStore } = useVersionCheck()
  const [ softDismissed, setSoftDismissed ] = useState(false)

  useCountrySync()
  useTrendingSync()

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync()
    }
  }, [loaded, error])

  if (!loaded && !error) {
    return null
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <UpdateModal
          visible={updateRequired || (updateAvailable && !softDismissed)}
          optional={!updateRequired}
          onUpdate={openStore}
          onDismiss={() => setSoftDismissed(true)}
        />
        <Stack initialRouteName='index'
          screenOptions={{
            headerStyle: {
              backgroundColor: Colors.background,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
            title: '',
            headerTitleStyle: {fontFamily: 'Inter_400Regular'},
            headerBackImage: () => (<Back width={24} height={24} />)
          }}
        >
          <Stack.Screen name='login' options={{ headerShown: false }} />
          <Stack.Screen name='register' options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </AuthProvider>
  )
}

export default RootLayout

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: Colors.background, borderRadius: 16, padding: 24, width: '80%', alignItems: 'center' },
  title: { color: Colors.text_title, fontSize: 20, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  body: { color: Colors.text, fontSize: 14, textAlign: 'center', opacity: 0.7, marginBottom: 24 },
  button: { backgroundColor: Colors._heteroboxd, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32 },
  buttonText: { color: Colors.text_button, fontSize: 16, fontFamily: 'Inter_400Regular' },
  dismiss: { marginTop: 16 },
  dismissText: { color: Colors.text, opacity: 0.5, fontSize: 14 },
})