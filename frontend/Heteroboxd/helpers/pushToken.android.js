import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { BaseUrl } from '../constants/api'
import {
  ANDROID_NOTIFICATION_CHANNEL_ID,
  ANDROID_NOTIFICATION_VIBRATION_PATTERN
} from '../constants/notifications'

const PUSH_TOKEN_STORAGE_KEY = 'androidPushToken'

const isNonblankString = (value) => typeof value === 'string' && value.trim().length > 0

export const isSupportedPushTokenDevice = () => Platform.OS === 'android' && Device.isDevice

export const isValidAndroidPushToken = (token) => {
  return token?.type === 'android' && isNonblankString(token.data)
}

export const acquireAndroidPushToken = async () => {
  if (!isSupportedPushTokenDevice()) return null

  try {
    await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNEL_ID, {
      name: 'Heteroboxd',
      importance: Notifications.AndroidImportance.HIGH,
      sound: null,
      enableVibrate: true,
      vibrationPattern: ANDROID_NOTIFICATION_VIBRATION_PATTERN
    })

    let permissions = await Notifications.getPermissionsAsync()
    if (!permissions.granted) permissions = await Notifications.requestPermissionsAsync()
    if (!permissions.granted) return null

    const token = await Notifications.getDevicePushTokenAsync()
    return isValidAndroidPushToken(token) ? token.data : null
  } catch {
    return null
  }
}

export const cacheCurrentPushToken = async (token) => {
  if (!isNonblankString(token)) return false

  try {
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token)
    return true
  } catch {
    return false
  }
}

export const registerPushToken = async (token, jwt, signal) => {
  if (!isNonblankString(token) || !isNonblankString(jwt)) return false

  try {
    const res = await fetch(`${BaseUrl.api}/push-tokens`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({ Token: token }),
      signal
    })
    return res.ok
  } catch {
    return false
  }
}

const unregisterNatively = async () => {
  if (!isSupportedPushTokenDevice()) return

  try {
    await Notifications.unregisterForNotificationsAsync()
  } catch {
  }
}

export const removeCurrentPushToken = async (jwt) => {
  let token = null
  let cacheReadFailed = false

  try {
    token = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY)
  } catch {
    cacheReadFailed = true
  }

  try {
    if (!isNonblankString(token)) {
      if (cacheReadFailed) await unregisterNatively()
      return
    }

    let deleted = false
    if (isNonblankString(jwt)) {
      try {
        const res = await fetch(`${BaseUrl.api}/push-tokens`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify({ Token: token })
        })
        deleted = res.ok
      } catch {
      }
    }

    if (!deleted) await unregisterNatively()
  } finally {
    try {
      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY)
    } catch {
    }
  }
}
