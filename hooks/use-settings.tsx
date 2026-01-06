"use client"

import { useState, useEffect, useCallback } from "react"

export interface AppSettings {
  profile: {
    name: string
    email: string
    phone: string
    photo?: string
  }
  notifications: {
    pushEnabled: boolean
    emailEnabled: boolean
    smsEnabled: boolean
    emergencyAlerts: boolean
    maintenanceReminders: boolean
    fuelAlerts: boolean
    parkingReminders: boolean
    trafficUpdates: boolean
    soundEnabled: boolean
    vibrationEnabled: boolean
  }
  privacy: {
    locationSharing: boolean
    dataCollection: boolean
    analytics: boolean
    crashReporting: boolean
    personalizedAds: boolean
    thirdPartySharing: boolean
  }
  appearance: {
    theme: "light" | "dark" | "auto"
    accentColor: string
    fontSize: "small" | "medium" | "large" | "extra-large"
    reducedMotion: boolean
    highContrast: boolean
  }
  devices: {
    bluetoothAutoConnect: boolean
    gpsAccuracy: "low" | "medium" | "high"
    backgroundSync: boolean
    offlineMode: boolean
    dataUsage: "low" | "medium" | "high"
  }
  emergency: {
    sosEnabled: boolean
    autoCallEmergency: boolean
    shareLocationWithContacts: boolean
    emergencyMessage: string
  }
}

const defaultSettings: AppSettings = {
  profile: {
    name: "",
    email: "",
    phone: "",
  },
  notifications: {
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    emergencyAlerts: true,
    maintenanceReminders: true,
    fuelAlerts: true,
    parkingReminders: true,
    trafficUpdates: true,
    soundEnabled: true,
    vibrationEnabled: true,
  },
  privacy: {
    locationSharing: true,
    dataCollection: true,
    analytics: true,
    crashReporting: true,
    personalizedAds: false,
    thirdPartySharing: false,
  },
  appearance: {
    theme: "auto",
    accentColor: "#f97316",
    fontSize: "medium",
    reducedMotion: false,
    highContrast: false,
  },
  devices: {
    bluetoothAutoConnect: true,
    gpsAccuracy: "high",
    backgroundSync: true,
    offlineMode: false,
    dataUsage: "medium",
  },
  emergency: {
    sosEnabled: true,
    autoCallEmergency: true,
    shareLocationWithContacts: true,
    emergencyMessage: "Emergency! I need help. This is my current location.",
  },
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("vehicle-intelligence-settings")
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem("vehicle-intelligence-settings", JSON.stringify(settings))
      } catch (error) {
        console.error("Failed to save settings:", error)
      }
    }
  }, [settings, isLoading])

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev }

      // Deep merge the updates
      Object.keys(updates).forEach((key) => {
        const typedKey = key as keyof AppSettings
        if (typeof updates[typedKey] === "object" && updates[typedKey] !== null) {
          newSettings[typedKey] = { ...prev[typedKey], ...updates[typedKey] } as any
        } else {
          newSettings[typedKey] = updates[typedKey] as any
        }
      })

      return newSettings
    })
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings)
  }, [])

  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2)
  }, [settings])

  const importSettings = useCallback((settingsJson: string) => {
    try {
      const imported = JSON.parse(settingsJson)
      setSettings({ ...defaultSettings, ...imported })
      return true
    } catch (error) {
      console.error("Failed to import settings:", error)
      return false
    }
  }, [])

  return {
    settings,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    isLoading,
  }
}
