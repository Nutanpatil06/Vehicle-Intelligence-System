"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useSettings } from "@/hooks/use-settings"

type Theme = "light" | "dark" | "auto"

interface ThemeContextType {
  theme: Theme
  resolvedTheme: "light" | "dark"
  accentColor: string
  setTheme: (theme: Theme) => void
  setAccentColor: (color: string) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings()
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")

  // Resolve theme based on settings and system preference
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (settings.appearance.theme === "auto") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        setResolvedTheme(prefersDark ? "dark" : "light")
      } else {
        setResolvedTheme(settings.appearance.theme as "light" | "dark")
      }
    }

    updateResolvedTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (settings.appearance.theme === "auto") {
        updateResolvedTheme()
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [settings.appearance.theme])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement

    if (resolvedTheme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }

    // Apply accent color as CSS custom property
    root.style.setProperty("--accent-color", settings.appearance.accentColor)

    // Apply other appearance settings
    root.style.setProperty(
      "--font-size",
      settings.appearance.fontSize === "small"
        ? "14px"
        : settings.appearance.fontSize === "large"
          ? "18px"
          : settings.appearance.fontSize === "extra-large"
            ? "20px"
            : "16px",
    )

    if (settings.appearance.reducedMotion) {
      root.style.setProperty("--animation-duration", "0s")
    } else {
      root.style.removeProperty("--animation-duration")
    }

    if (settings.appearance.highContrast) {
      root.classList.add("high-contrast")
    } else {
      root.classList.remove("high-contrast")
    }
  }, [resolvedTheme, settings.appearance])

  const setTheme = (theme: Theme) => {
    updateSettings({ appearance: { theme } })
  }

  const setAccentColor = (accentColor: string) => {
    updateSettings({ appearance: { accentColor } })
  }

  const toggleTheme = () => {
    const newTheme = resolvedTheme === "light" ? "dark" : "light"
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: settings.appearance.theme,
        resolvedTheme,
        accentColor: settings.appearance.accentColor,
        setTheme,
        setAccentColor,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
