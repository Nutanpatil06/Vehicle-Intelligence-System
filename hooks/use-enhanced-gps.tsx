"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import usePermissions from "./use-permissions"

interface GPSPosition {
  lat: number
  lng: number
  accuracy: number
  altitude?: number
  altitudeAccuracy?: number
  heading?: number
  speed?: number
  timestamp: number
}

interface GPSTrackingOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  trackingInterval?: number
  distanceFilter?: number
  autoStart?: boolean
}

interface UseEnhancedGPSReturn {
  currentPosition: GPSPosition | null
  isTracking: boolean
  isSupported: boolean
  accuracy: number | null
  speed: number | null
  heading: number | null
  error: string | null
  hasPermission: boolean
  permissionLoading: boolean
  startTracking: () => Promise<boolean>
  stopTracking: () => void
  requestPermission: () => Promise<boolean>
  getLocationHistory: () => GPSPosition[]
  clearHistory: () => void
  totalDistance: number
  averageSpeed: number
  maxSpeed: number
}

export const useEnhancedGPS = (options: GPSTrackingOptions = {}): UseEnhancedGPSReturn => {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 1000,
    trackingInterval = 1000,
    distanceFilter = 2,
    autoStart = false,
  } = options

  const { gps, requestGPSPermission } = usePermissions()

  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [speed, setSpeed] = useState<number | null>(null)
  const [heading, setHeading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [locationHistory, setLocationHistory] = useState<GPSPosition[]>([])
  const [totalDistance, setTotalDistance] = useState(0)
  const [averageSpeed, setAverageSpeed] = useState(0)
  const [maxSpeed, setMaxSpeed] = useState(0)

  const watchIdRef = useRef<number | null>(null)
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastPositionRef = useRef<GPSPosition | null>(null)
  const speedHistoryRef = useRef<number[]>([])

  // Check GPS support
  useEffect(() => {
    setIsSupported("geolocation" in navigator)
  }, [])

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((pos1: GPSPosition, pos2: GPSPosition): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (pos1.lat * Math.PI) / 180
    const φ2 = (pos2.lat * Math.PI) / 180
    const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180
    const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }, [])

  // Process new GPS position
  const processPosition = useCallback(
    (position: GeolocationPosition) => {
      const newPosition: GPSPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: position.timestamp,
      }

      // Validate position accuracy
      if (newPosition.accuracy > 100) {
        console.warn("Low GPS accuracy:", newPosition.accuracy)
      }

      // Apply distance filter to reduce noise
      if (lastPositionRef.current) {
        const distance = calculateDistance(lastPositionRef.current, newPosition)
        if (distance < distanceFilter && newPosition.accuracy > 20) {
          return // Skip this update if movement is too small and accuracy is poor
        }

        // Update total distance
        setTotalDistance((prev) => prev + distance)
      }

      // Update speed tracking
      if (newPosition.speed !== null && newPosition.speed !== undefined) {
        const speedKmh = newPosition.speed * 3.6 // Convert m/s to km/h
        speedHistoryRef.current.push(speedKmh)

        // Keep only last 100 speed readings
        if (speedHistoryRef.current.length > 100) {
          speedHistoryRef.current = speedHistoryRef.current.slice(-100)
        }

        // Update max speed
        setMaxSpeed((prev) => Math.max(prev, speedKmh))

        // Update average speed
        const avgSpeed = speedHistoryRef.current.reduce((a, b) => a + b, 0) / speedHistoryRef.current.length
        setAverageSpeed(avgSpeed)
      }

      setCurrentPosition(newPosition)
      setAccuracy(newPosition.accuracy)
      setSpeed(newPosition.speed)
      setHeading(newPosition.heading)
      setError(null)

      // Add to history
      setLocationHistory((prev) => {
        const newHistory = [...prev, newPosition]
        // Keep only last 1000 positions to prevent memory issues
        return newHistory.slice(-1000)
      })

      lastPositionRef.current = newPosition
    },
    [calculateDistance, distanceFilter],
  )

  // Handle GPS errors
  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = "GPS error occurred"

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "GPS access denied. Please enable location permissions."
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = "GPS position unavailable. Please check your device's location services."
        break
      case error.TIMEOUT:
        errorMessage = "GPS request timed out. Please try again."
        break
    }

    setError(errorMessage)
    setIsTracking(false)
    console.error("GPS Error:", errorMessage, error)
  }, [])

  // Request GPS permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestGPSPermission()
      if (granted) {
        setError(null)
      }
      return granted
    } catch (err) {
      console.error("Permission request failed:", err)
      return false
    }
  }, [requestGPSPermission])

  // Start GPS tracking
  const startTracking = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("GPS is not supported on this device")
      return false
    }

    if (isTracking) return true

    // Check and request permission if needed
    if (!gps.granted) {
      const permissionGranted = await requestPermission()
      if (!permissionGranted) {
        return false
      }
    }

    setIsTracking(true)
    setError(null)

    const gpsOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    }

    try {
      // Get initial high-accuracy position
      const initialPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          ...gpsOptions,
          timeout: 20000, // Longer timeout for initial position
          maximumAge: 0, // Force fresh reading
        })
      })

      processPosition(initialPosition)

      // Start continuous tracking with watchPosition
      watchIdRef.current = navigator.geolocation.watchPosition(processPosition, handleError, gpsOptions)

      // Additional high-frequency tracking for better accuracy
      if (trackingInterval < 5000) {
        trackingIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            processPosition,
            (err) => console.warn("High-frequency GPS update failed:", err),
            {
              ...gpsOptions,
              maximumAge: 0, // Force fresh reading
              timeout: 10000, // Shorter timeout for frequent updates
            },
          )
        }, trackingInterval)
      }

      return true
    } catch (err: any) {
      handleError(err)
      return false
    }
  }, [
    isSupported,
    isTracking,
    gps.granted,
    requestPermission,
    enableHighAccuracy,
    timeout,
    maximumAge,
    trackingInterval,
    processPosition,
    handleError,
  ])

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false)

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current)
      trackingIntervalRef.current = null
    }
  }, [])

  // Get location history
  const getLocationHistory = useCallback(() => {
    return [...locationHistory]
  }, [locationHistory])

  // Clear location history
  const clearHistory = useCallback(() => {
    setLocationHistory([])
    setTotalDistance(0)
    setAverageSpeed(0)
    setMaxSpeed(0)
    speedHistoryRef.current = []
    lastPositionRef.current = null
  }, [])

  // Auto-start tracking if enabled and permission granted
  useEffect(() => {
    if (autoStart && gps.granted && !isTracking) {
      startTracking()
    }
  }, [autoStart, gps.granted, isTracking, startTracking])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking()
    }
  }, [stopTracking])

  return {
    currentPosition,
    isTracking,
    isSupported,
    accuracy,
    speed,
    heading,
    error,
    hasPermission: gps.granted,
    permissionLoading: gps.loading,
    startTracking,
    stopTracking,
    requestPermission,
    getLocationHistory,
    clearHistory,
    totalDistance,
    averageSpeed,
    maxSpeed,
  }
}

export default useEnhancedGPS
