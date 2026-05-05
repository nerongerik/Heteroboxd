import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { onStorageUpdate } from './storageEvents'

export const usePopular = () => {
  const [ popular, setPopular ] = useState(null)

  const load = async () => {
    try {
      const stored = await AsyncStorage.getItem('popular')
      if (stored) setPopular(JSON.parse(stored))
    } catch (error) {
      console.log('failed to load popular; ', error)
      setPopular([])
    }
  }

  useEffect(() => {
    load()
    const unsub = onStorageUpdate('popular', load)
    return unsub
  }, [])

  return { popular }
}