import { useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BaseUrl } from '../constants/api'
import { emitStorageUpdate } from './storageEvents'

export const useCountrySync = () => {
  const syncInProgress = useRef(false)

  useEffect(() => {
    (async () => {
      if (syncInProgress.current) return
      syncInProgress.current = true
      try {
        const lastSync = await AsyncStorage.getItem('countryLastSync')
        const res = await fetch(`${BaseUrl.api}/auth/country${lastSync ? `?LastSync=${encodeURIComponent(lastSync)}` : ''}`)
        if (res.ok) {
          const json = await res.json()
          const lastSyncValue = json[0]?.LastSync ?? json[0]?.lastSync ?? null
          if (lastSyncValue) await AsyncStorage.setItem('countryLastSync', lastSyncValue)
          await AsyncStorage.setItem('countries', JSON.stringify(json))
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