import { useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BaseUrl } from '../constants/api'
import { emitStorageUpdate } from './storageEvents'

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

export const useTrendingSync = () => {
  const syncInProgress = useRef(false)

  useEffect(() => {
    (async () => {
      if (syncInProgress.current) return
      syncInProgress.current = true
      try {
        const [lastFetched, cached] = await Promise.all([
          AsyncStorage.getItem('trendingLastFetched'),
          AsyncStorage.getItem('trending'),
        ])

        if (lastFetched && cached && Date.now() - Number(lastFetched) < TWENTY_FOUR_HOURS) {
          emitStorageUpdate('trending')
          return
        }

        const lastSync = await AsyncStorage.getItem('trendingLastSync')
        const res = await fetch(`${BaseUrl.api}/films/trending${lastSync ? `?LastSync=${encodeURIComponent(lastSync)}` : ''}`)
        if (res.ok) {
          const json = await res.json()
          const lastSyncValue = json[0]?.LastSync ?? json[0]?.lastSync ?? null
          if (lastSyncValue) await AsyncStorage.setItem('trendingLastSync', lastSyncValue)
          await Promise.all([
            AsyncStorage.setItem('trending', JSON.stringify(json)),
            AsyncStorage.setItem('trendingLastFetched', String(Date.now())),
          ])
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