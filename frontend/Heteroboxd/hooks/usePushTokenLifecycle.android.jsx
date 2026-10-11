import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import * as auth from '../helpers/auth'
import {
  acquireAndroidPushToken,
  cacheCurrentPushToken,
  isSupportedPushTokenDevice,
  isValidAndroidPushToken,
  registerPushToken
} from '../helpers/pushToken'

export const usePushTokenLifecycle = (hydrated, user) => {
  const stopRef = useRef(() => {})

  useEffect(() => {
    stopRef.current = () => {}
    if (!hydrated || !user || !isSupportedPushTokenDevice()) return

    let active = true
    let listener = null
    let latestListenerToken = null
    let registrationQueue = Promise.resolve()
    const attemptedTokens = new Set()
    const abortController = new AbortController()

    const stop = () => {
      active = false
      abortController.abort()
      try {
        listener?.remove()
      } catch {
      }
    }
    stopRef.current = stop

    const enqueueToken = (token, jwt) => {
      registrationQueue = registrationQueue
        .then(async () => {
          if (!active) return

          await cacheCurrentPushToken(token)
          if (!active || attemptedTokens.has(token)) return

          attemptedTokens.add(token)
          await registerPushToken(token, jwt, abortController.signal)
        })
        .catch(() => {})
    }

    const start = async () => {
      try {
        const jwt = await auth.getJwt()
        if (!active || typeof jwt !== 'string' || jwt.trim().length === 0) return

        try {
          listener = Notifications.addPushTokenListener((token) => {
            try {
              if (!active || !isValidAndroidPushToken(token)) return
              latestListenerToken = token.data
              enqueueToken(token.data, jwt)
            } catch {
            }
          })
        } catch {
        }

        const token = await acquireAndroidPushToken()
        if (!active || !token) return
        if (latestListenerToken && latestListenerToken !== token) return
        enqueueToken(token, jwt)
      } catch {
      }
    }

    start()

    return () => {
      stop()
      if (stopRef.current === stop) stopRef.current = () => {}
    }
  }, [hydrated, user])

  return () => stopRef.current()
}
