import { useContext } from "react";
import { AuthContext } from "../contexts/authContext";

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) throw new Error('useAuth can only be accessed with AuthProvider!');
    return context;
}