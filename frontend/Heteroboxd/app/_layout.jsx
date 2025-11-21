import { Platform, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { Colors } from '../constants/colors'
import { AuthProvider } from '../contexts/authContext'
import ProfileOptionsButton from '../components/profileOptionsButton'
import './browser.css'

const RootLayout = () => {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: styles.headerStyle,
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          title: '',
          headerLeft: Platform.OS === 'web' ? () => null : undefined, // hide back arrow on web globally
        }}
      >
        <Stack.Screen name='index' options={{ headerShown: false }} />
        <Stack.Screen name='login' options={{ headerShown: false }} />
        <Stack.Screen name='register' options={{ headerShown: false }} />
        <Stack.Screen 
          name="profile/[userId]" 
          options={({ route }) => ({
            headerRight: () => <ProfileOptionsButton userId={route.params?.userId} />
          })}
        />
        <Stack.Screen
          name='film/[navprop]'
          options={{
            headerShown: Platform.OS === 'web' ? false : true,
            headerTransparent: true,
            headerBackground: () => null,
            headerTitle: '',
            headerStyle: {backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0}
            }}
        />
      </Stack>
    </AuthProvider>
  )
}

export default RootLayout

const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: Colors.background,
    elevation: 0, // android
    shadowOpacity: 0, // ios
  },
})
