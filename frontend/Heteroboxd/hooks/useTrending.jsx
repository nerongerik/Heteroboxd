import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { onStorageUpdate } from './storageEvents'

export const useTrending = () => {
  const [trending, setTrending] = useState(null)

  const load = async () => {
    try {
      const stored = await AsyncStorage.getItem('trending')
      if (stored) setTrending(JSON.parse(stored))
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