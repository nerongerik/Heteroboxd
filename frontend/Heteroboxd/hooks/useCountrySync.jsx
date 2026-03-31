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
        const [lastSync, cached] = await Promise.all([
          AsyncStorage.getItem('countryLastSync'),
          AsyncStorage.getItem('countries'),
        ])

        const today = new Date()
        const alreadySyncedThisMonth = lastSync && cached && (() => {
          const last = new Date(lastSync)
          return (
            last.getFullYear() === today.getFullYear() &&
            last.getMonth() === today.getMonth()
          )
        })()

        if (alreadySyncedThisMonth) {
          emitStorageUpdate('countries')
          return
        }

        const res = await fetch(`${BaseUrl.api}/auth/country${lastSync ? `?LastSync=${encodeURIComponent(lastSync)}` : ''}`)
        if (res.ok) {
          const json = await res.json()
          const lastSyncValue = json[0]?.LastSync ?? json[0]?.lastSync ?? null
          if (lastSyncValue) await AsyncStorage.setItem('countryLastSync', lastSyncValue)
          await AsyncStorage.setItem('countries', JSON.stringify(json))
          emitStorageUpdate('countries')
        } else if (res.status === 304 || res.status === 400) {
          await AsyncStorage.setItem('countryLastSync', today.toISOString())
          if (cached) emitStorageUpdate('countries')
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