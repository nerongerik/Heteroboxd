import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { BaseUrl } from '../constants/api'
import { emitStorageUpdate } from './storageEvents'

const getItem = async (key) => {
  if (Platform.OS === 'web') return localStorage.getItem(key)
  return await SecureStore.getItemAsync(key)
}

const setItem = async (key, value) => {
  if (Platform.OS === 'web') localStorage.setItem(key, value)
  else await SecureStore.setItemAsync(key, value)
}

export const useCountrySync = () => {
  const syncInProgress = useRef(false)
  useEffect(() => {
    (async () => {
      if (syncInProgress.current) return
      syncInProgress.current = true
      try {
        const lastSync = await getItem('countryLastSync') || null
        const res = await fetch(`${BaseUrl.api}/auth/country${lastSync ? `?LastSync=${encodeURIComponent(lastSync)}` : ''}`)
        if (res.ok) {
          const json = await res.json()
          const lastSyncValue = json[0]?.LastSync ?? json[0]?.lastSync ?? null
          if (lastSyncValue) await setItem('countryLastSync', lastSyncValue)
          await setItem('countries', JSON.stringify(json))
          emitStorageUpdate('countries')
        } else if (res.status === 400) {
          return
        } else {
          console.log(`failed to sync countries; ${res.status}`)
        }
      } catch (error) {
        console.log('failed to sync countries; ', error)
      } finally {
        syncInProgress.current = false
      }
    })()
  }, [])
}