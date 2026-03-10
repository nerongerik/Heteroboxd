import { Platform } from 'react-native'
import { Stack } from 'expo-router'
import { Colors } from '../constants/colors'
import { AuthProvider } from '../contexts/authContext'
import { useCountrySync } from '../hooks/useCountrySync'
import { useTrendingSync } from '../hooks/useTrendingSync'
import './browser.css'

const RootLayout = () => {
  useCountrySync()
  useTrendingSync()

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
        }}
      >
        <Stack.Screen name='login' options={{ headerShown: false }} />
        <Stack.Screen name='register' options={{ headerShown: false }} />
        <Stack.Screen
          name='film/[filmId]'
          options={{
            headerShown: Platform.OS === 'web' ? false : true,
            headerTransparent: true,
            headerBackground: () => null,
            headerTitle: '',
            headerStyle: {backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0}
          }}
        />
        <Stack.Screen 
          name="films/watchlist/[userId]" 
          options={{
            headerTitle: 'Watchlist',
            headerTitleAlign: 'center',
            headerTitleStyle: {color: Colors.text_title},
          }}
        />
        <Stack.Screen 
          name="films/user-watched/[userId]" 
          options={{
            headerTitle: 'Recents',
            headerTitleAlign: 'center',
            headerTitleStyle: {color: Colors.text_title},
          }}
        />
        <Stack.Screen 
          name="list/create" 
          options={{
            headerTitle: 'New List',
            headerTitleAlign: 'center',
            headerTitleStyle: {color: Colors.text_title},
          }}
        />
        <Stack.Screen 
          name="notifications" 
          options={{
            headerTitle: 'Your notifications',
            headerTitleAlign: 'center',
            headerTitleStyle: {color: Colors.text_title},
          }}
        />
        <Stack.Screen 
          name="search" 
          options={{
            headerTitle: 'Search',
            headerTitleAlign: 'center',
            headerTitleStyle: {color: Colors.text_title},
          }}
        />
        <Stack.Screen 
          name="likes/[userId]"
          options={{
            headerTitle: 'Likes',
            headerTitleAlign: 'center',
            headerTitleStyle: {color: Colors.text_title},
          }}
        />
      </Stack>
    </AuthProvider>
  )
}

export default RootLayout