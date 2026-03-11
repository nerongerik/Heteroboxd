import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { onStorageUpdate } from './storageEvents'

const getItem = async (key) => {
  if (Platform.OS === 'web') return localStorage.getItem(key)
  return await SecureStore.getItemAsync(key)
}

export const useCountries = () => {
  const [ countries, setCountries ] = useState([])
  const load = async () => {
    try {
      const stored = await getItem('countries')
      if (stored) {
        setCountries(JSON.parse(stored))
      }
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