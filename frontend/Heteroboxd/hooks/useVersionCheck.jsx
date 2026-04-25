import { useEffect, useState } from 'react'
import { Linking, Platform } from 'react-native'
import * as Application from 'expo-application'

const VERSION_URL = 'https://www.heteroboxd.com/version.json'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.nerongerik.heteroboxd'

const parseVersion = (v) => v.split('.').map(Number)

const isOutdated = (installed, minimum) => {
  const a = parseVersion(installed)
  const b = parseVersion(minimum)
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) < (b[i] ?? 0)) return true
    if ((a[i] ?? 0) > (b[i] ?? 0)) return false
  }
  return false
}

export const useVersionCheck = () => {
  const [ updateRequired, setUpdateRequired ] = useState(false)
  const [ updateAvailable, setUpdateAvailable ] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'android') return
    (async () => {
      try {
        const res = await fetch(VERSION_URL, { cache: 'no-store' })
        const { android } = await res.json()
        const installed = Application.nativeApplicationVersion

        if (isOutdated(installed, android.minimumVersion)) {
          setUpdateRequired(true)
        } else if (isOutdated(installed, android.currentVersion)) {
          setUpdateAvailable(true)
        }
      } catch {
        console.log('version check failed on Android - proceeding silently')
      }
    })()
  }, [])

  const openStore = () => Linking.openURL(PLAY_STORE_URL)

  return { updateRequired, updateAvailable, openStore }
}