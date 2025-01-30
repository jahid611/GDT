"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext()

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "gdt-theme" }) {
  // Initialize theme from localStorage or default
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem(storageKey)
    if (storedTheme) return storedTheme

    // If no stored theme, check system preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark"
    }
    return defaultTheme
  })

  // Update theme class and localStorage
  const updateTheme = (newTheme) => {
    const root = window.document.documentElement

    // Remove existing theme classes
    root.classList.remove("light", "dark")

    // Apply new theme
    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(newTheme)
    }

    // Store theme preference
    localStorage.setItem(storageKey, newTheme)
    setTheme(newTheme)
  }

  // Initial theme setup
  useEffect(() => {
    updateTheme(theme)
  }, [theme, updateTheme]) // Added updateTheme to dependencies

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (theme === "system") {
        updateTheme("system")
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, updateTheme]) // Added updateTheme to dependencies

  return <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

