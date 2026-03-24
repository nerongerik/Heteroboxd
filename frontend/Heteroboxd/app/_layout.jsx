import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { Colors } from '../constants/colors'
import { AuthProvider } from '../contexts/authContext'
import { useCountrySync } from '../hooks/useCountrySync'
import { useTrendingSync } from '../hooks/useTrendingSync'
import './browser.css'
import Back from '../assets/icons/back.svg'

SplashScreen.preventAutoHideAsync()

const RootLayout = () => {
  const [loaded, error] = useFonts({Inter_400Regular: require('../assets/fonts/Inter_400Regular.ttf')})

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
    </AuthProvider>
  )
}

export default RootLayout