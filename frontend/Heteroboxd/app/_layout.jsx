import { Stack } from 'expo-router'
import { StyleSheet } from 'react-native'
import { Colors } from '../constants/Colors';

const RootLayout = () => {
  return (
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