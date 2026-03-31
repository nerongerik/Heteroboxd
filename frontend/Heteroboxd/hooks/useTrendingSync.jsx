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
        const [lastSync, cached] = await Promise.all([
          AsyncStorage.getItem('trendingLastSync'),
          AsyncStorage.getItem('trending'),
        ])

        const today = new Date()
        const alreadySyncedToday = lastSync && cached && (() => {
          const last = new Date(lastSync)
          return (
            last.getFullYear() === today.getFullYear() &&
            last.getMonth() === today.getMonth() &&
            last.getDate() === today.getDate()
          )
        })()

        if (alreadySyncedToday) {
          emitStorageUpdate('trending')
          return
        }

        const res = await fetch(`${BaseUrl.api}/films/trending${lastSync ? `?LastSync=${encodeURIComponent(lastSync)}` : ''}`)
        if (res.ok) {
          const json = await res.json()
          const lastSyncValue = json[0]?.LastSync ?? json[0]?.lastSync ?? null
          if (lastSyncValue) await AsyncStorage.setItem('trendingLastSync', lastSyncValue)
          await AsyncStorage.setItem('trending', JSON.stringify(json))
          emitStorageUpdate('trending')
        } else if (res.status === 304 || res.status === 400) {
          await AsyncStorage.setItem('trendingLastSync', today.toISOString())
          if (cached) emitStorageUpdate('trending')
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