import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { BaseUrl } from "../constants/api";
import { emitStorageUpdate } from "./storageEvents";

async function getItem(key) {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
}

async function setItem(key, value) {
  if (Platform.OS === 'web') localStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}

export function useTrendingSync() {
  const syncInProgress = useRef(false);

  useEffect(() => {
    (async () => {
      if (syncInProgress.current) return;
      syncInProgress.current = true;

      try {
        const lastSync = await getItem('trendingLastSync') || null;

        const res = await fetch(
          `${BaseUrl.api}/films/trending${lastSync ? `?LastSync=${encodeURIComponent(lastSync)}` : ''}`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (res.status === 400) return;

        if (res.status === 200) {
          const json = await res.json();
          const lastSyncValue = json[0]?.LastSync ?? json[0]?.lastSync ?? null;

          if (lastSyncValue) await setItem('trendingLastSync', lastSyncValue);

          await setItem('trending', JSON.stringify(json));

          emitStorageUpdate('trending');
        } else {
          console.warn(`${res.status}: failed to sync trending`);
        }
      } catch (error) {
        console.warn('Trending sync error: ', error);
      } finally {
        syncInProgress.current = false;
      }
    })();
  }, []);
}