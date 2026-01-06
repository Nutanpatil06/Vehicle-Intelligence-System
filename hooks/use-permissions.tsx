"use client"

import { useState, useEffect, useCallback } from "react"

interface PermissionState {
  granted: boolean
  denied: boolean
  loading: boolean
  error: string | null
}

interface UsePermissionsReturn {
  gps: PermissionState
  bluetooth: PermissionState
  requestGPSPermission: () => Promise<boolean>
  requestBluetoothPermission: () => Promise<boolean>
  checkPermissions: () => Promise<void>
}

export const usePermissions = (): UsePermissionsReturn => {
  const [gps, setGPS] = useState<PermissionState>({
    granted: false,
    denied: false,
    loading: false,
    error: null,
  })

  const [bluetooth, setBluetooth] = useState<PermissionState>({
    granted: false,
    denied: false,
    loading: false,
    error: null,
  })

  // Check GPS permission
  const checkGPSPermission = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setGPS((prev) => ({ ...prev, error: "Geolocation is not supported" }))
      return false
    }

    try {
      if ("permissions" in navigator) {
        const result = await navigator.permissions.query({ name: "geolocation" as PermissionName })
        setGPS((prev) => ({
          ...prev,
          granted: result.state === "granted",
          denied: result.state === "denied",
          error: null,
        }))
        return result.state === "granted"
      }
      return false
    } catch (err) {
      console.warn("Could not check GPS permission:", err)
      return false
    }
  }, [])

  // Check Bluetooth permission
  const checkBluetoothPermission = useCallback(async () => {
    if (!("bluetooth" in navigator)) {
      setBluetooth((prev) => ({ ...prev, error: "Bluetooth is not supported" }))
      return false
    }

    try {
      const available = await (navigator as any).bluetooth.getAvailability()
      setBluetooth((prev) => ({
        ...prev,
        granted: available,
        denied: !available,
        error: null,
      }))
      return available
    } catch (err) {
      console.warn("Could not check Bluetooth permission:", err)
      return false
    }
  }, [])

  // Request GPS permission
  const requestGPSPermission = useCallback(async (): Promise<boolean> => {
    if (!("geolocation" in navigator)) {
      setGPS((prev) => ({ ...prev, error: "Geolocation is not supported in this browser" }))
      return false
    }

    setGPS((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      setGPS({
        granted: true,
        denied: false,
        loading: false,
        error: null,
      })
      return true
    } catch (err: any) {
      let errorMessage = "GPS permission denied"

      if (err.code === 1) {
        errorMessage = "GPS access denied. Please enable location permissions in your browser settings."
      } else if (err.code === 2) {
        errorMessage = "GPS position unavailable. Please check your device's location services."
      } else if (err.code === 3) {
        errorMessage = "GPS request timed out. Please try again."
      }

      setGPS({
        granted: false,
        denied: true,
        loading: false,
        error: errorMessage,
      })
      return false
    }
  }, [])

  // Request Bluetooth permission
  const requestBluetoothPermission = useCallback(async (): Promise<boolean> => {
    if (!("bluetooth" in navigator)) {
      setBluetooth((prev) => ({
        ...prev,
        error: "Bluetooth is not supported. Please use Chrome, Edge, or Opera browser.",
      }))
      return false
    }

    setBluetooth((prev) => ({ ...prev, loading: true, error: null }))

    try {
      // Try to request a device to trigger permission
      await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["battery_service"],
      })

      setBluetooth({
        granted: true,
        denied: false,
        loading: false,
        error: null,
      })
      return true
    } catch (err: any) {
      let errorMessage = "Bluetooth permission denied"

      if (err.name === "NotFoundError") {
        errorMessage = "No Bluetooth devices found. Make sure Bluetooth is enabled."
      } else if (err.name === "SecurityError") {
        errorMessage = "Bluetooth access denied. Please allow Bluetooth permissions."
      } else if (err.name === "NotSupportedError") {
        errorMessage = "Bluetooth is not supported in this browser."
      }

      setBluetooth({
        granted: false,
        denied: true,
        loading: false,
        error: errorMessage,
      })
      return false
    }
  }, [])

  // Check all permissions
  const checkPermissions = useCallback(async () => {
    await Promise.all([checkGPSPermission(), checkBluetoothPermission()])
  }, [checkGPSPermission, checkBluetoothPermission])

  // Initial permission check
  useEffect(() => {
    checkPermissions()
  }, [checkPermissions])

  return {
    gps,
    bluetooth,
    requestGPSPermission,
    requestBluetoothPermission,
    checkPermissions,
  }
}

export default usePermissions
