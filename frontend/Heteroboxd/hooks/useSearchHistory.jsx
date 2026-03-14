import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const HISTORY_KEY = 'searchHistory'
const MAX_HISTORY = 10

export const useSearchHistory = () => {
  const [searches, setSearches] = useState([])

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(HISTORY_KEY)
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
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  return { searches, saveSearch }
}