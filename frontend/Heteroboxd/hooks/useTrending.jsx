import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { onStorageUpdate } from './storageEvents';

async function getItem(key) {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
}

export function useTrending() {
  const [trending, setTrending] = useState([]);

  const load = async () => {
    try {
      const stored = await getItem('trending');
      if (stored) {
        setTrending(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load trending: ', error);
      setTrending([]);
    }
  };

  useEffect(() => {
    load();
    const unsub = onStorageUpdate('trending', load);

    return unsub;
  }, []);

  return { trending };
}