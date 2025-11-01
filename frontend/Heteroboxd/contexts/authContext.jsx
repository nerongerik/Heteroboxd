import { createContext, useEffect, useState } from "react";
import * as auth from "../helpers/Auth";
import { Platform } from "react-native";

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

      //refresh failed => session dead
      setUser(null);
      return false;
    }

    async function login(jwt, refresh) {
        if (Platform.OS === 'web') {
            auth.handleWebLogin(jwt);
        } else {
            auth.handleMobileLogin(jwt, refresh);
        }
        setUser(auth.decodeUser(jwt));
    }

    async function logout(userId) {
        console.log(auth.logout(userId));
        //whether backend succeeds in invalidating the user's tokens, the front should still log them out
        setUser(null);
    }

    if (!hydrated) return <LoadingResponse visible={true} />;
    return (
        <AuthContext.Provider value={{user, login, logout, isValidSession}}>
            { children }
        </AuthContext.Provider>
    )
}