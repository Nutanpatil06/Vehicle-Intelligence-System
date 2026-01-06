"use client"

import { useState, useEffect, useRef, useCallback } from "react"

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
}

interface UseGPSTrackingReturn {
  currentPosition: GPSPosition | null
  isTracking: boolean
  isSupported: boolean
  accuracy: number | null
  speed: number | null
  heading: number | null
  error: string | null
  startTracking: () => void
  stopTracking: () => void
  getLocationHistory: () => GPSPosition[]
  clearHistory: () => void
  totalDistance: number
}

export const useGPSTracking = (options: GPSTrackingOptions = {}): UseGPSTrackingReturn => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 1000,
    trackingInterval = 1000,
    distanceFilter = 5, // meters
  } = options

  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [speed, setSpeed] = useState<number | null>(null)
  const [heading, setHeading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [locationHistory, setLocationHistory] = useState<GPSPosition[]>([])
  const [totalDistance, setTotalDistance] = useState(0)

  const watchIdRef = useRef<number | null>(null)
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastPositionRef = useRef<GPSPosition | null>(null)

  // Check GPS support
  useEffect(() => {
    setIsSupported("geolocation" in navigator)
  }, [])

  // Calculate distance between two points
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

  // Process new position
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

      // Apply distance filter
      if (lastPositionRef.current) {
        const distance = calculateDistance(lastPositionRef.current, newPosition)
        if (distance < distanceFilter) {
          return // Skip this update if movement is too small
        }

        // Update total distance
        setTotalDistance((prev) => prev + distance)
      }

      setCurrentPosition(newPosition)
      setAccuracy(newPosition.accuracy)
      setSpeed(newPosition.speed || null)
      setHeading(newPosition.heading || null)
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
    let errorMessage = "Unknown GPS error"

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "GPS access denied by user"
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = "GPS position unavailable"
        break
      case error.TIMEOUT:
        errorMessage = "GPS request timed out"
        break
    }

    setError(errorMessage)
    console.error("GPS Error:", errorMessage, error)
  }, [])

  // Start GPS tracking
  const startTracking = useCallback(() => {
    if (!isSupported) {
      setError("GPS is not supported on this device")
      return
    }

    if (isTracking) return

    setIsTracking(true)
    setError(null)

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        processPosition(position)

        // Start continuous tracking
        watchIdRef.current = navigator.geolocation.watchPosition(processPosition, handleError, options)
      },
      handleError,
      options,
    )

    // Start high-frequency tracking for better accuracy
    if (trackingInterval < 5000) {
      trackingIntervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(processPosition, handleError, {
          ...options,
          maximumAge: 0, // Force fresh reading
        })
      }, trackingInterval)
    }
  }, [isSupported, isTracking, enableHighAccuracy, timeout, maximumAge, trackingInterval, processPosition, handleError])

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
    lastPositionRef.current = null
  }, [])

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
    startTracking,
    stopTracking,
    getLocationHistory,
    clearHistory,
    totalDistance,
  }
}

export default useGPSTracking
