"use client"

import { useState, useCallback, useRef } from "react"
import { useEmergencyContacts, type EmergencyContact } from "./use-emergency-contacts"
import { useSettings } from "./use-settings"

interface Location {
  lat: number
  lng: number
}

interface SOSAlert {
  id: string
  timestamp: Date
  location: Location
  status: "active" | "resolved" | "cancelled"
  contacts: string[]
  message: string
}

interface UseSOSSystemReturn {
  isActive: boolean
  isActivating: boolean
  currentAlert: SOSAlert | null
  alertHistory: SOSAlert[]
  activateSOS: (location: Location) => Promise<boolean>
  cancelSOS: () => void
  resolveSOS: () => void
  testSOS: (location: Location) => Promise<boolean>
  clearHistory: () => void
}

export const useSOSSystem = (): UseSOSSystemReturn => {
  const { getActiveContacts, getPrimaryContact } = useEmergencyContacts()
  const { settings } = useSettings()
  const [isActive, setIsActive] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [currentAlert, setCurrentAlert] = useState<SOSAlert | null>(null)
  const [alertHistory, setAlertHistory] = useState<SOSAlert[]>([])
  const cancelTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get user's current address from coordinates
  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      )
      const data = await response.json()
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch (error) {
      console.error("Failed to get address:", error)
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }

  // Send SMS alert (simulated - would integrate with SMS service)
  const sendSMSAlert = async (contact: EmergencyContact, location: Location): Promise<boolean> => {
    try {
      const address = location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
      const message = `🚨 EMERGENCY ALERT 🚨\n\nThis is an automated SOS message from Vehicle Intelligence App.\n\nLocation: ${address}\nCoordinates: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}\nAccuracy: ±${Math.round(location.accuracy)}m\nTime: ${new Date(location.timestamp).toLocaleString()}\n\nGoogle Maps: https://maps.google.com/?q=${location.lat},${location.lng}\n\nPlease check on the sender immediately.`

      // Simulate SMS sending (in real app, would use Twilio, AWS SNS, etc.)
      console.log(`Sending SMS to ${contact.name} (${contact.phone}):`, message)

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

      // Simulate 95% success rate
      return Math.random() > 0.05
    } catch (error) {
      console.error("Failed to send SMS:", error)
      return false
    }
  }

  // Send email alert (simulated - would integrate with email service)
  const sendEmailAlert = async (contact: EmergencyContact, location: Location): Promise<boolean> => {
    if (!contact.email) return false

    try {
      const address = location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
      const subject = "🚨 EMERGENCY ALERT - Immediate Assistance Required"
      const body = `
        <h2 style="color: #dc2626;">🚨 EMERGENCY ALERT 🚨</h2>
        <p><strong>This is an automated SOS message from Vehicle Intelligence App.</strong></p>
        
        <h3>Location Details:</h3>
        <ul>
          <li><strong>Address:</strong> ${address}</li>
          <li><strong>Coordinates:</strong> ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</li>
          <li><strong>Accuracy:</strong> ±${Math.round(location.accuracy)} meters</li>
          <li><strong>Time:</strong> ${new Date(location.timestamp).toLocaleString()}</li>
        </ul>
        
        <p><a href="https://maps.google.com/?q=${location.lat},${location.lng}" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">📍 View on Google Maps</a></p>
        
        <p style="color: #dc2626; font-weight: bold;">Please check on the sender immediately and contact emergency services if needed.</p>
      `

      // Simulate email sending (in real app, would use SendGrid, AWS SES, etc.)
      console.log(`Sending email to ${contact.name} (${contact.email}):`, { subject, body })

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1500))

      // Simulate 98% success rate
      return Math.random() > 0.02
    } catch (error) {
      console.error("Failed to send email:", error)
      return false
    }
  }

  // Make emergency call (simulated - would use WebRTC or phone integration)
  const makeEmergencyCall = async (contact: EmergencyContact): Promise<boolean> => {
    try {
      console.log(`Initiating call to ${contact.name} (${contact.phone})`)

      // In a real app, this would:
      // 1. Use WebRTC for browser-based calling
      // 2. Use tel: protocol to trigger phone app
      // 3. Integrate with VoIP services
      // 4. Use native mobile APIs for direct calling

      // For now, we'll open the phone dialer
      if (typeof window !== "undefined") {
        window.open(`tel:${contact.phone}`, "_self")
      }

      return true
    } catch (error) {
      console.error("Failed to make emergency call:", error)
      return false
    }
  }

  // Send alerts to all contacts
  const sendAlertsToContacts = async (alert: SOSAlert): Promise<boolean> => {
    const results = await Promise.allSettled(
      alert.contacts.map(async (contactId) => {
        const contact = getActiveContacts().find((c) => c.id === contactId)
        if (!contact) return false

        const smsResult = await sendSMSAlert(contact, alert.location)
        const emailResult = contact.email ? await sendEmailAlert(contact, alert.location) : true

        // If this is the primary contact or emergency services, also try to call
        if (contact.isPrimary || contact.phone === "911") {
          await makeEmergencyCall(contact)
        }

        return smsResult && emailResult
      }),
    )

    // Return true if at least one alert was sent successfully
    return results.some((result) => result.status === "fulfilled" && result.value === true)
  }

  // Activate SOS system
  const activateSOS = useCallback(
    async (location: Location): Promise<boolean> => {
      try {
        setIsActivating(true)

        const activeContacts = getActiveContacts()
        if (activeContacts.length === 0) {
          throw new Error("No active emergency contacts configured")
        }

        // Create SOS alert
        const alert: SOSAlert = {
          id: Date.now().toString(),
          timestamp: new Date(),
          location,
          status: "active",
          contacts: activeContacts.map((c) => c.id),
          message: settings.emergency.emergencyMessage,
        }

        setCurrentAlert(alert)
        setIsActive(true)

        // Send notifications to all active contacts
        const notifications = activeContacts.map(async (contact) => {
          try {
            // In a real app, this would send SMS/email/push notifications
            console.log(`Sending SOS alert to ${contact.name} (${contact.phone})`)

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // For demo purposes, we'll show browser notifications if supported
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("SOS Alert Sent", {
                body: `Emergency alert sent to ${contact.name}`,
                icon: "/favicon.ico",
              })
            }

            return { contactId: contact.id, success: true }
          } catch (error) {
            console.error(`Failed to notify ${contact.name}:`, error)
            return { contactId: contact.id, success: false }
          }
        })

        await Promise.all(notifications)

        // Add to history
        setAlertHistory((prev) => [alert, ...prev])

        return true
      } catch (error) {
        console.error("Failed to activate SOS:", error)
        return false
      } finally {
        setIsActivating(false)
      }
    },
    [getActiveContacts, settings.emergency.emergencyMessage],
  )

  // Cancel SOS alert
  const cancelSOS = useCallback(() => {
    if (cancelTimeoutRef.current) {
      clearTimeout(cancelTimeoutRef.current)
      cancelTimeoutRef.current = null
    }

    if (currentAlert) {
      const updatedAlert = {
        ...currentAlert,
        status: "cancelled" as const,
      }

      setCurrentAlert(updatedAlert)
      setAlertHistory((prev) => prev.map((alert) => (alert.id === currentAlert.id ? updatedAlert : alert)))
    }

    setIsActive(false)
    setIsActivating(false)
  }, [currentAlert])

  // Resolve SOS alert
  const resolveSOS = useCallback(() => {
    if (currentAlert) {
      const updatedAlert = {
        ...currentAlert,
        status: "resolved" as const,
      }

      setCurrentAlert(updatedAlert)
      setAlertHistory((prev) => prev.map((alert) => (alert.id === currentAlert.id ? updatedAlert : alert)))
    }

    setIsActive(false)
  }, [currentAlert])

  // Get alert history sorted by timestamp
  const getAlertHistory = useCallback(() => {
    return alertHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [alertHistory])

  // Clear alert history
  const clearHistory = useCallback(() => {
    setAlertHistory([])
  }, [])

  return {
    isActive,
    isActivating,
    currentAlert,
    alertHistory: getAlertHistory(),
    activateSOS,
    cancelSOS,
    resolveSOS,
    clearHistory,
  }
}

export default useSOSSystem
