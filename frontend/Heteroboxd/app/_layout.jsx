import { Stack } from 'expo-router'
import { StyleSheet } from 'react-native'
import { Colors } from '../constants/colors'
import { AuthProvider } from '../contexts/authContext'

const RootLayout = () => {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: styles.headerStyle,
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          title: ''
        }}>
          <Stack.Screen name='index' options={ {headerShown: false }} />
          <Stack.Screen name='login' options={{ headerShown: false }} />
          <Stack.Screen name='register' options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  )
}

export default RootLayout

const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: Colors.background,
    elevation: 0, //android
    shadowOpacity: 0, //ios
  },
})