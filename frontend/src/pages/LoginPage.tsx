import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login, register } from "../api";
import { useAuthStore } from "../store/authStore";
import "./LoginPage.css";

function validatePasswordStrength(password: string): { isValid: boolean; message: string | null } {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter." };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number." };
  }
  if (!/[!@#$%^&*(),.?":{}|<>_]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one special character." };
  }
  return { isValid: true, message: null };
}

export function LoginPage() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loginMutation = useMutation({
    mutationFn: () => login(username, password),
    onSuccess: (response) => {
      const { token, player_id, username: authName } = response.data;
      setAuth(token, player_id, authName);
    },
    onError: (err: any) => {
      const errorText = err.response?.data || "Invalid credentials. Try again.";
      setErrorMessage(errorText);
    },
  });

  const registerMutation = useMutation({
    mutationFn: () => register(username, password),
    onSuccess: (response) => {
      const { token, player_id, username: authName } = response.data;
      setAuth(token, player_id, authName);
    },
    onError: (err: any) => {
      setErrorMessage(
        err.response?.data?.error ||
          "Registration failed. User may already exist.",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username || !password) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (isRegistering) {
      const strength = validatePasswordStrength(password);
      if (!strength.isValid) {
        setErrorMessage(strength.message || "Weak password.");
        return;
      }
      registerMutation.mutate();
    } else {
      loginMutation.mutate();
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title">Storm of Swords</h1>
        <p className="login-subtitle"> {isRegistering ? "Claim your territory in Westeros" : "Return to your stronghold"} </p>
        {errorMessage && <div className="login-error">{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Username</label>
            <input
              type="text"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="LordStark"
            />
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loginMutation.isPending || registerMutation.isPending}
          >
            {loginMutation.isPending || registerMutation.isPending ? "Processing..." : isRegistering ? "Create Account" : "Enter Realm"}
          </button>
        </form>

        <div className="login-switch">
          {isRegistering ? "Already have a stronghold?" : "New to the war?"}{" "}
          <button
            className="login-switch-button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMessage("");
            }}
          >
            {isRegistering ? "Sign In Here" : "Register Account Here"}
          </button>
        </div>
      </div>
    </div>
  );
}
