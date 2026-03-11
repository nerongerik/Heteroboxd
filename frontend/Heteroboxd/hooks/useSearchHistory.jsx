import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const HISTORY_KEY = 'searchHistory'
const MAX_HISTORY = 10

export const useSearchHistory = () => {
  const [ searches, setSearches ] = useState([])
  useEffect(() => {
    const loadHistory = async () => {
      try {
        let stored
        if (Platform.OS === 'web') {
          stored = localStorage.getItem(HISTORY_KEY)
        } else {
          stored = await SecureStore.getItemAsync(HISTORY_KEY)
        }
        if (stored) {
          const parsed = JSON.parse(stored)
          setSearches(parsed.sort((a, b) => b.timestamp - a.timestamp))
        }
      } catch (error) {
        console.log('failed to load search; ', error)
        setSearches([])
      }
    }
    loadHistory()
  }, [])

  const saveSearch = useCallback(async (query, tab) => {
    const newEntry = { query, tab, timestamp: Date.now() }
    setSearches(prev => {
      const filtered = prev.filter(s => !(s.query === query && s.tab === tab))
      const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY)
      const toStore = JSON.stringify(updated)
      if (Platform.OS === 'web') {
        localStorage.setItem(HISTORY_KEY, toStore)
      } else {
        SecureStore.setItemAsync(HISTORY_KEY, toStore)
      }
      return updated
    })
  }, [])
  return { searches, saveSearch }
}