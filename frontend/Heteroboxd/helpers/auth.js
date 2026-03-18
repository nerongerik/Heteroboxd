import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode } from 'jwt-decode'
import { BaseUrl } from '../constants/api'

export const handleLogin = async (jwt, refresh) => {
  if (!jwt || !refresh) return
  await AsyncStorage.setItem('token', jwt)
  await AsyncStorage.setItem('refresh', refresh)
}

export const getJwt = async () => {
  return await AsyncStorage.getItem('token')
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
    const refresh = await AsyncStorage.getItem('refresh')
    if (!refresh) return false

    const res = await fetch(`${BaseUrl.api}/auth/refresh?Token=${encodeURIComponent(refresh)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    if (!res.ok) return false

    const json = await res.json()
    const jwt = json?.jwt ?? json?.token ?? null
    const newRefresh = json?.refresh ?? json?.refreshToken ?? null
    if (jwt) {
      await handleLogin(jwt, newRefresh)
      return true
    }
    return false
  } catch {
    return false
  }
}

export const logout = async (userId) => {
  try {
    const refresh = await AsyncStorage.getItem('refresh')
    const res = await fetch(`${BaseUrl.api}/auth/logout/${userId}?Token=${encodeURIComponent(refresh)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    if (!res.ok) console.log(`logout failed; ${res.status}`)
    await AsyncStorage.removeItem('token')
    await AsyncStorage.removeItem('refresh')
    return res.ok
  } catch {
    return false
  }
}

export const decodeUser = (token) => {
  const decoded = jwtDecode(token)
  return {
    userId: decoded.sub,
    name: decoded.name,
    pictureUrl: decoded.pictureUrl,
    admin: decoded.admin.toLowerCase() === 'true'
  }
}