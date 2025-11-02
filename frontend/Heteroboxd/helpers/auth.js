import { jwtDecode } from "jwt-decode";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { BaseUrl } from "../constants/api";

export function handleWebLogin(jwt) {
    if (!jwt) return;
    localStorage.setItem('token', jwt);
}

export async function handleMobileLogin(jwt, refresh) {
    if (!jwt || !refresh) return;
    if (typeof jwt === 'string') {
        await SecureStore.setItemAsync("token", jwt);
    } else {
        await SecureStore.setItemAsync("token", JSON.stringify(jwt));
    }
    if (typeof refresh === 'string') {
        await SecureStore.setItemAsync("refresh", refresh);
    } else {
        await SecureStore.setItemAsync("refresh", JSON.stringify(refresh));
    }
}

export async function getJwt() {
    return Platform.OS === "web"
        ? localStorage.getItem('token')
        : await SecureStore.getItemAsync("token");
}

export function isJwtExpired(token) {
    if (!token) return true;
    try {
        const { exp } = jwtDecode(token);
        return exp * 1000 < Date.now();
    } catch {
        return true;
    }
    
}

export async function refreshToken() {
    try {
        if (Platform.OS === 'web') {
            return await fetch(`${BaseUrl.api}/auth/refresh`, {
                method: "POST",
                credentials: "include", //send HttpOnly cookie
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Token: null })
            }).then(async (res) => {
                if (res.status !== 200) return false;
                const json = await res.json();
                const jwt = json?.jwt ?? json?.token ?? null;
                if (jwt) {
                    handleWebLogin(jwt);
                    return true;
                }
                return false;
            });
        } else {
            const refresh = await SecureStore.getItemAsync("refresh");
            if (!refresh) return false;
            return await fetch(`${BaseUrl.api}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Token: refresh })
            }).then(async (res) => {
                if (!res.ok) return false;
                const json = await res.json();
                const jwt = json?.jwt ?? json?.token ?? null;
                const newRefresh = json?.refresh ?? json?.refreshToken ?? null;
                if (jwt) {
                  await handleMobileLogin(jwt, newRefresh);
                  return true;
                }
                return false;
            });
        }
    } catch {
        return false;
    }
}

export async function logout(userId) {
    try {
        const refresh = Platform.OS === "web"
            ? null
            : await SecureStore.getItemAsync("refresh");
        if (Platform.OS === "web") {
            await fetch(`${BaseUrl.api}/auth/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ Token: refresh, UserId: userId })
            }).then((res) => {
                localStorage.clear(); //regardless
                return res.status === 200;
            })
        } else {
            await fetch(`${BaseUrl.api}/auth/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Token: refresh, UserId: userId })
            }).then(async (res) => {
                await SecureStore.deleteItemAsync("token");
                await SecureStore.deleteItemAsync("refresh");
                return res.status === 200;
            });
        }
    } catch {
        //failsafe
        if (Platform.OS === "web") localStorage.clear();
        else {
            await SecureStore.deleteItemAsync("token");
            await SecureStore.deleteItemAsync("refresh");
        }
        return false;
    }
}

export function decodeUser(token) {
    let decoded = jwtDecode(token);
    return {
        userId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        pictureUrl: decoded.pictureUrl,
        bio: decoded.bio,
        tier: decoded.tier,
        expiry: decoded.expiry,
        patron: decoded.patron,
        joined: decoded.joined,
        listsCount: decoded.listsCount,
        followersCount: decoded.followersCount,
        followingCount: decoded.followingCount,
        blockedCount: decoded.blockedCount,
        reviewsCount: decoded.reviewsCount,
        likes: decoded.likes,
        watched: decoded.watched
    };
}