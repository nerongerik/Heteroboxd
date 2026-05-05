import { useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BaseUrl } from '../constants/api'
import { emitStorageUpdate } from './storageEvents'

const PAGE_SIZE = 10

export const usePopularSync = () => {
  const syncInProgress = useRef(false)
  useEffect(() => {
    (async () => {
      if (syncInProgress.current) return
      syncInProgress.current = true
      try {
        const [lastSync, cached] = await Promise.all([
          AsyncStorage.getItem('popularLastSync'),
          AsyncStorage.getItem('popular'),
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
          emitStorageUpdate('popular')
          return
        }

        const res = await fetch(`${BaseUrl.api}/films/popular?PageSize=${PAGE_SIZE}`)
        if (res.ok) {
          const json = await res.json()
          await AsyncStorage.setItem('popularLastSync', (new Date()).toISOString())
          await AsyncStorage.setItem('popular', JSON.stringify(json))
          emitStorageUpdate('popular')
        } else {
          if (cached) emitStorageUpdate('popular')
          console.log(`failed to sync popular; ${res.status}`)
        }
      } catch (error) {
        console.log(`failed to sync popular; ${error}`)
      } finally {
        syncInProgress.current = false
      }
    })()
  }, [])
}