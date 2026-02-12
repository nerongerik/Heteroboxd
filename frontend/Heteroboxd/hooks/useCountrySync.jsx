import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { BaseUrl } from "../constants/api";

export function useCountrySync() {
  const syncInProgress = useRef(false);
  
  useEffect(() => {
    (async () => {
      if (syncInProgress.current) return;
      syncInProgress.current = true;
      try {
        let lastSync;
        if (Platform.OS === 'web') {
          lastSync = localStorage.getItem('countryLastSync');
        } else {
          lastSync = await SecureStore.getItemAsync('countryLastSync');
        }

        const res = await fetch(
          `${BaseUrl.api}/auth/country${lastSync ? `?LastSync=${encodeURIComponent(lastSync)}` : ''}`,
          { headers: {'Accept': 'application/json'} }
        );

        if (res.status === 400) return; //already up-to-date
        
        if (res.status === 200) {
          const json = await res.json();
          
          if (Platform.OS === 'web') {
            localStorage.setItem('countryLastSync', json[0].lastSync);
            localStorage.setItem('countries', JSON.stringify(json));
          } else {
            await SecureStore.setItemAsync('countryLastSync', json[0].lastSync);
            await SecureStore.setItemAsync('countries', JSON.stringify(json));
          }
        } else {
          console.warn(`${res.status}: failed to sync countries`);
        }
      } catch (error) {
        console.warn('Country sync error:', error);
      } finally {
        syncInProgress.current = false;
      }
    })();
  }, []);
}