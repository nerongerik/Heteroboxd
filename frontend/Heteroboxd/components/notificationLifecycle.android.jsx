import { useEffect, useRef } from 'react'
import { AppState, Vibration } from 'react-native'
import { useRootNavigationState, useRouter } from 'expo-router'
import * as Notifications from 'expo-notifications'
import * as auth from '../helpers/auth'
import { BaseUrl } from '../constants/api'
import { ANDROID_NOTIFICATION_VIBRATION_PATTERN } from '../constants/notifications'
import { getNotificationRoute, isCanonicalGuid } from '../helpers/notifications'

const handledNotificationIds = new Set()

const clearLastNotificationResponse = () => {
  try {
    Notifications.clearLastNotificationResponse()
  } catch {
  }
}

const markNotificationRead = async (notificationId) => {
  try {
    const jwt = await auth.getJwt()
    if (typeof jwt !== 'string' || jwt.trim().length === 0) return

    await fetch(`${BaseUrl.api}/notifications/${notificationId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${jwt}` }
    })
  } catch {
  }
}

const getValidatedResponse = (response) => {
  if (response?.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return null

  const data = response?.notification?.request?.content?.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  if (typeof data.notificationId !== 'string' || !isCanonicalGuid(data.notificationId)) return null
  if (typeof data.referencedObject !== 'string' || typeof data.referenceId !== 'string') return null

  const route = getNotificationRoute(data.referencedObject, data.referenceId)
  if (!route) return null

  return {
    notificationId: data.notificationId.toLowerCase(),
    route
  }
}

const NotificationLifecycle = () => {
  const router = useRouter()
  const rootNavigationState = useRootNavigationState()
  const routerRef = useRef(router)
  const routerReadyRef = useRef(false)
  const pendingResponsesRef = useRef([])
  const coldStartCheckedRef = useRef(false)

  routerRef.current = router

  const handleResponseRef = useRef(null)
  handleResponseRef.current = (response) => {
    const validatedResponse = getValidatedResponse(response)
    if (!validatedResponse) return

    const { notificationId, route } = validatedResponse
    if (handledNotificationIds.has(notificationId)) return
    handledNotificationIds.add(notificationId)

    markNotificationRead(notificationId)
    routerRef.current.push(route)
  }

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: false,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        priority: Notifications.AndroidNotificationPriority.HIGH
      })
    })

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      if (AppState.currentState === 'active') {
        Vibration.vibrate(ANDROID_NOTIFICATION_VIBRATION_PATTERN)
      }
    })

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      clearLastNotificationResponse()
      if (!routerReadyRef.current) {
        pendingResponsesRef.current.push(response)
        return
      }
      handleResponseRef.current(response)
    })

    return () => {
      receivedSubscription.remove()
      responseSubscription.remove()
      Notifications.setNotificationHandler(null)
    }
  }, [])

  useEffect(() => {
    if (!rootNavigationState?.key || coldStartCheckedRef.current) return

    routerReadyRef.current = true
    const pendingResponses = pendingResponsesRef.current
    pendingResponsesRef.current = []
    pendingResponses.forEach(response => handleResponseRef.current(response))

    coldStartCheckedRef.current = true
    let active = true

    const handleColdStartResponse = async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync()
        if (!active) return
        clearLastNotificationResponse()
        if (response) handleResponseRef.current(response)
      } catch {
      }
    }

    handleColdStartResponse()

    return () => {
      active = false
    }
  }, [rootNavigationState?.key])

  return null
}

export default NotificationLifecycle
