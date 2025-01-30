import React, { createContext, useContext, useState, useCallback } from "react"
import { login as apiLogin, logout as apiLogout } from "../utils/api"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user")
    return storedUser ? JSON.parse(storedUser) : null
  })

  const login = useCallback((userData) => {
    // Ensure we store the complete user data including role
    const userWithRole = {
      ...userData,
      role: userData.role || "user", // Default to "user" if no role specified
    }
    localStorage.setItem("user", JSON.stringify(userWithRole))
    setUser(userWithRole)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setUser(null)
    }
  }, [])

  const hasRole = useCallback(
    (requiredRole) => {
      return user?.role === requiredRole
    },
    [user],
  )

  const value = {
    user,
    login,
    logout,
    hasRole,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

