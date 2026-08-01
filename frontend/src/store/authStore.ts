import { create } from "zustand";
import { QueryClient } from "@tanstack/react-query";

interface AuthState {
  token: string | null;
  playerID: number | null;
  username: string | null;
  isLoggedIn: boolean;
  setAuth: (token: string, playerID: number, username: string) => void;
  clearAuth: () => void;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // data stays fresh for 30 seconds
      retry: 1, // retry failed requests once before showing error
    },
  },
});

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  playerID: Number(localStorage.getItem("player_id")) || null,
  username: localStorage.getItem("username"),
  isLoggedIn: !!localStorage.getItem("token"),

  setAuth: (token, playerID, username) => {
    // wipe any previous user's cached queries (village, army, etc.)
    // before adopting the new identity
    queryClient.clear();

    localStorage.setItem("token", token);
    localStorage.setItem("player_id", String(playerID));
    localStorage.setItem("username", username);
    set({ token, playerID, username, isLoggedIn: true });
  },

  clearAuth: () => {
    queryClient.clear();

    localStorage.removeItem("token");
    localStorage.removeItem("player_id");
    localStorage.removeItem("username");
    set({ token: null, playerID: null, username: null, isLoggedIn: false });
  },
}));