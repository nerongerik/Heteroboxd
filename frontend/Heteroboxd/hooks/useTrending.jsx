import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { onStorageUpdate } from './storageEvents'

const getItem = async (key) => {
  if (Platform.OS === 'web') return localStorage.getItem(key)
  return await SecureStore.getItemAsync(key)
}

export const useTrending = () => {
  const [ trending, setTrending ] = useState(null)
  const load = async () => {
    try {
      const stored = await getItem('trending')
      if (stored) {
        setTrending(JSON.parse(stored))
      }
    } catch (error) {
      console.log('failed to load trending; ', error)
      setTrending([])
    }
  }
  useEffect(() => {
    load()
    const unsub = onStorageUpdate('trending', load)
    return unsub
  }, [])
  return { trending }
}