import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export function useCountries() {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        let stored;
        if (Platform.OS === 'web') {
          stored = localStorage.getItem('countries');
        } else {
          stored = await SecureStore.getItemAsync('countries');
        }
        
        if (stored) {
          setCountries(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Failed to load countries:', error);
        setCountries([]);
      }
    };

    loadCountries();
  }, []);

  return countries;
}