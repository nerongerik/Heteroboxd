import { createContext, useEffect, useState } from "react";
import * as auth from "../helpers/auth";
import { Platform } from "react-native";
import LoadingResponse from "../components/loadingResponse";
import { View } from "react-native";
import { Colors } from "../constants/colors";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => {
      (async () => {
        let token = await auth.getJwt();
        if (!token) setUser(null);
        else if (!auth.isJwtExpired(token)) setUser(auth.decodeUser(token));
        else if (await auth.refreshToken()) setUser(auth.decodeUser(await auth.getJwt()));
        else setUser(null);
        //UI can now safely render
        setHydrated(true);
      })();
    }, []);

    async function isValidSession() {
      let token = await auth.getJwt();

      //no session at all -> return false
      if (!token) return false;

      //token still valid -> allow action
      if (!auth.isJwtExpired(token)) return true;

      //expired -> try to refresh
      if (await auth.refreshToken()) {
        let newToken = await auth.getJwt();
        setUser(auth.decodeUser(newToken));
        return true;
      }

      //refresh failed + session dead
      setUser(null);
      return false;
    }

    async function login(jwt, refresh) {
      Platform.OS === 'web' ? auth.handleWebLogin(jwt, refresh) : auth.handleMobileLogin(jwt, refresh);
      setUser(auth.decodeUser(jwt));
    }

    async function logout(userId) {
      await auth.logout(userId);
      //whether backend succeeds in invalidating the user's tokens, the front should still log them out
      setUser(null);
    }

    if (!hydrated) return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: "5%",
        backgroundColor: Colors.background,
      }}>
        <LoadingResponse visible={true} />
      </View>
    )
    return (
        <AuthContext.Provider value={{user, login, logout, isValidSession}}>
            { children }
        </AuthContext.Provider>
    )
}