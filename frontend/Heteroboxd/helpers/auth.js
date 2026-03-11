import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { jwtDecode } from 'jwt-decode'
import { BaseUrl } from '../constants/api'

export const handleWebLogin = (jwt, refresh) => {
  if (!jwt || !refresh) return
  localStorage.setItem('token', jwt)
  localStorage.setItem('refresh', refresh)
}

export const handleMobileLogin = async (jwt, refresh) => {
  if (!jwt || !refresh) return
  await SecureStore.setItemAsync('token', jwt)
  await SecureStore.setItemAsync('refresh', refresh)
}

export const getJwt = async () => {
  return Platform.OS === 'web'
    ? localStorage.getItem('token')
    : await SecureStore.getItemAsync('token')
}

export const isJwtExpired = (token) => {
  if (!token) return true
  try {
    const { exp } = jwtDecode(token)
    return exp * 1000 < Date.now()
  } catch {
    return true
  }    
}

export const refreshToken = async () => {
  try {
    const refresh = Platform.OS === 'web' ? localStorage.getItem('refresh') : await SecureStore.getItemAsync('refresh')
    if (!refresh) {
      return false
    }
    const res = await fetch(`${BaseUrl.api}/auth/refresh?Token=${encodeURIComponent(refresh)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    if (!res.ok) {
      return false
    }
    const json = await res.json()
    const jwt = json?.jwt ?? json?.token ?? null
    const newRefresh = json?.refresh ?? json?.refreshToken ?? null
    if (jwt) {
      Platform.OS === 'web' ? handleWebLogin(jwt, newRefresh) : await handleMobileLogin(jwt, newRefresh)
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function logout(userId) {
  try {
    const refresh = Platform.OS === 'web' ? localStorage.getItem('refresh') : await SecureStore.getItemAsync('refresh')
    const res = await fetch(`${BaseUrl.api}/auth/logout/${userId}?Token=${encodeURIComponent(refresh)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    if (!res.ok) {
      console.log(`logout failed; ${res.status}`)
    }
    if (Platform.OS === 'web') {
      localStorage.removeItem('token')
      localStorage.removeItem('refresh')
    }
    else {
      await SecureStore.deleteItemAsync('token')
      await SecureStore.deleteItemAsync('refresh')
    }
    return res.ok
  } catch {
    return false
  }
}

export function decodeUser(token) {
  let decoded = jwtDecode(token)
  return {
    userId: decoded.sub,
    name: decoded.name,
    pictureUrl: decoded.pictureUrl,
    admin: decoded.admin.toLowerCase() === 'true'
  }
}