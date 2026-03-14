import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { onStorageUpdate } from './storageEvents'

export const useCountries = () => {
  const [countries, setCountries] = useState([])

  const load = async () => {
    try {
      const stored = await AsyncStorage.getItem('countries')
      if (stored) setCountries(JSON.parse(stored))
    } catch (error) {
      console.warn('Failed to load countries: ', error)
      setCountries([])
    }
  }

  useEffect(() => {
    load()
    const unsub = onStorageUpdate('countries', load)
    return unsub
  }, [])

  return { countries }
}