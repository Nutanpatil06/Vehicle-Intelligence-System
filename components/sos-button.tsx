"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Phone } from "lucide-react"
import useSOSSystem from "@/hooks/use-sos-system"
import useEnhancedGPS from "@/hooks/use-enhanced-gps"
import { useEmergencyContacts } from "@/hooks/use-emergency-contacts"

interface SOSButtonProps {
  size?: "sm" | "md" | "lg"
  variant?: "floating" | "inline"
  showLabel?: boolean
  className?: string
}

const SOSButton = ({ size = "lg", variant = "floating", showLabel = true, className = "" }: SOSButtonProps) => {
  const { isActive, isActivating, activateSOS, cancelSOS } = useSOSSystem()
  const { currentPosition, startTracking } = useEnhancedGPS({ enableHighAccuracy: true })
  const { getActiveContacts, getPrimaryContact } = useEmergencyContacts()
  const [countdown, setCountdown] = useState(0)
  const [isPressed, setIsPressed] = useState(false)

  // Countdown timer for activation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleSOSActivation()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [countdown])

  const handleSOSActivation = async () => {
    if (!currentPosition) {
      // Try to get current position first
      await startTracking()
      if (!currentPosition) {
        alert("Unable to get your location. Please enable GPS and try again.")
        return
      }
    }

    // Check if emergency contacts are configured
    const activeContacts = getActiveContacts()
    if (activeContacts.length === 0) {
      alert("Please configure emergency contacts in settings before using SOS.")
      return
    }

    const success = await activateSOS(currentPosition)
    if (success) {
      // Immediately call primary contact
      const primaryContact = getPrimaryContact()
      if (primaryContact) {
        // Open phone dialer for immediate call
        window.open(`tel:${primaryContact.phone}`, "_self")
      }
    } else {
      alert("Failed to send SOS alert. Please try again or call emergency services directly.")
    }
  }

  const handleButtonPress = () => {
    if (isActive) {
      // If SOS is active, cancel it
      cancelSOS()
      setCountdown(0)
      setIsPressed(false)
    } else if (countdown > 0) {
      // If countdown is active, cancel it
      setCountdown(0)
      setIsPressed(false)
    } else {
      // Start countdown
      setCountdown(3)
      setIsPressed(true)
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-12 h-12 text-sm"
      case "md":
        return "w-16 h-16 text-base"
      case "lg":
        return "w-20 h-20 text-lg"
      default:
        return "w-20 h-20 text-lg"
    }
  }

  const getVariantClasses = () => {
    if (variant === "floating") {
      return "fixed bottom-24 right-4 z-50 shadow-2xl"
    }
    return "relative"
  }

  const getButtonState = () => {
    if (isActive) return "active"
    if (isActivating || countdown > 0) return "activating"
    return "idle"
  }

  const buttonState = getButtonState()

  return (
    <div className={`${getVariantClasses()} ${className}`}>
      <button
        onClick={handleButtonPress}
        disabled={isActivating}
        className={`
          ${getSizeClasses()}
          rounded-full font-bold transition-all duration-200 ease-in-out
          flex items-center justify-center relative overflow-hidden
          ${
            buttonState === "active"
              ? "bg-green-500 hover:bg-green-600 text-white animate-pulse"
              : buttonState === "activating"
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white hover:scale-105 active:scale-95"
          }
          ${isPressed ? "animate-pulse" : ""}
          disabled:opacity-50 disabled:cursor-not-allowed
          border-4 border-white shadow-lg
        `}
        aria-label={
          buttonState === "active"
            ? "SOS Active - Tap to cancel"
            : buttonState === "activating"
              ? `SOS Activating in ${countdown} seconds`
              : "Emergency SOS Button"
        }
      >
        {/* Background pulse animation */}
        {(buttonState === "active" || countdown > 0) && (
          <div className="absolute inset-0 bg-white opacity-20 animate-ping rounded-full"></div>
        )}

        {/* Button content */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {buttonState === "active" ? (
            <Phone className="w-6 h-6 mb-1" />
          ) : countdown > 0 ? (
            <div className="text-2xl font-bold">{countdown}</div>
          ) : (
            <AlertTriangle className="w-6 h-6 mb-1" />
          )}

          {showLabel && size !== "sm" && (
            <span className="text-xs font-semibold">
              {buttonState === "active" ? "CALLING" : buttonState === "activating" ? "CANCEL" : "SOS"}
            </span>
          )}
        </div>
      </button>

      {/* Status indicator */}
      {variant === "floating" && (
        <div className="absolute -top-2 -right-2">
          {buttonState === "active" && (
            <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
          )}
          {countdown > 0 && (
            <div className="w-4 h-4 bg-orange-400 rounded-full animate-pulse border-2 border-white"></div>
          )}
        </div>
      )}

      {/* Countdown overlay */}
      {countdown > 0 && variant === "floating" && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
          Activating in {countdown}s
        </div>
      )}

      {/* Active status overlay */}
      {isActive && variant === "floating" && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
          SOS Active - Calling...
        </div>
      )}
    </div>
  )
}

export default SOSButton
