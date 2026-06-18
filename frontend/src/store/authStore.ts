import { create } from "zustand";

interface AuthState {
  token: string | null;
  playerID: number | null;
  username: string | null;
  isLoggedIn: boolean;

  // call this after a successful login or register response
  setAuth: (token: string, playerID: number, username: string) => void;

  // call this on logout or 401
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // initialise from localStorage so auth survives page refresh
  token: localStorage.getItem("token"),
  playerID: Number(localStorage.getItem("player_id")) || null,
  username: localStorage.getItem("username"),
  isLoggedIn: !!localStorage.getItem("token"),

  setAuth: (token, playerID, username) => {
    // persist to localStorage so the Axios interceptor can read it
    localStorage.setItem("token", token);
    localStorage.setItem("player_id", String(playerID));
    localStorage.setItem("username", username);
    set({ token, playerID, username, isLoggedIn: true });
  },

  clearAuth: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("player_id");
    localStorage.removeItem("username");
    set({ token: null, playerID: null, username: null, isLoggedIn: false });
  },
}));
