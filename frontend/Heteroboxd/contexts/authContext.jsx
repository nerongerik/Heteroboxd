import { createContext, useEffect, useState } from 'react'
import { Platform, View } from 'react-native'
import * as auth from '../helpers/auth'
import { Colors } from '../constants/colors'
import LoadingResponse from '../components/loadingResponse'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [ user, setUser ] = useState(null)
  const [ hydrated, setHydrated ] = useState(false)

  const isValidSession = async () => {
    let token = await auth.getJwt()
    if (!token) return false
    if (!auth.isJwtExpired(token)) return true
    if (await auth.refreshToken()) {
      let newToken = await auth.getJwt()
      setUser(auth.decodeUser(newToken))
      return true
    }
    setUser(null)
    return false
  }

  const login = async (jwt, refresh) => {
    auth.handleLogin(jwt, refresh)
    setUser(auth.decodeUser(jwt))
  }

  const logout = async (userId) => {
    await auth.logout(userId)
    setUser(null)
  }

  const reloadUser = async () => {
    const token = await auth.getJwt()
    if (token) setUser(auth.decodeUser(token))
  }

  useEffect(() => {
    (async () => {
      let token = await auth.getJwt()
      if (!token) setUser(null)
      else if (!auth.isJwtExpired(token)) setUser(auth.decodeUser(token))
      else if (await auth.refreshToken()) setUser(auth.decodeUser(await auth.getJwt()))
      else setUser(null)
      setHydrated(true)
    })()
  }, [])

  if (!hydrated) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        backgroundColor: Colors.background
      }}>
        <LoadingResponse visible={true} />
      </View>
    )
  }

  return (
    <AuthContext.Provider value={{user, login, logout, reloadUser, isValidSession}}>
      { children }
    </AuthContext.Provider>
  )
}