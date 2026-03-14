import { useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BaseUrl } from '../constants/api'
import { emitStorageUpdate } from './storageEvents'

export const useTrendingSync = () => {
  const syncInProgress = useRef(false)

  useEffect(() => {
    (async () => {
      if (syncInProgress.current) return
      syncInProgress.current = true
      try {
        const lastSync = await AsyncStorage.getItem('trendingLastSync')
        const res = await fetch(`${BaseUrl.api}/films/trending${lastSync ? `?LastSync=${encodeURIComponent(lastSync)}` : ''}`)
        if (res.ok) {
          const json = await res.json()
          const lastSyncValue = json[0]?.LastSync ?? json[0]?.lastSync ?? null
          if (lastSyncValue) await AsyncStorage.setItem('trendingLastSync', lastSyncValue)
          await AsyncStorage.setItem('trending', JSON.stringify(json))
          emitStorageUpdate('trending')
        } else if (res.status === 400) {
          return
        } else {
          console.log(`failed to sync trending; ${res.status}`)
        }
      } catch (error) {
        console.log(`failed to sync trending; ${error}`)
      } finally {
        syncInProgress.current = false
      }
    })()
  }, [])
}