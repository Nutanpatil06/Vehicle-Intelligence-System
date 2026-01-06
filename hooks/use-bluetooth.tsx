"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface BluetoothDevice {
  id: string
  name: string
  connected: boolean
  deviceType: "car" | "phone" | "headset" | "unknown"
  rssi?: number
  services?: string[]
  lastSeen?: Date
}

interface BluetoothData {
  batteryLevel?: number
  fuelLevel?: number
  engineTemp?: string
  speed?: number
  connectionTime?: Date
  services?: string[]
}

interface UseBluetoothOptions {
  autoConnect?: boolean
  enableRealTimeData?: boolean
}

export const useBluetooth = (options: UseBluetoothOptions = {}) => {
  const { autoConnect = false, enableRealTimeData = true } = options

  const [isSupported, setIsSupported] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [devices, setDevices] = useState<BluetoothDevice[]>([])
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null)
  const [deviceData, setDeviceData] = useState<BluetoothData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const bluetoothRef = useRef<any>(null)
  const characteristicRef = useRef<any>(null)
  const dataUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check Bluetooth support
  useEffect(() => {
    const checkSupport = async () => {
      if ("bluetooth" in navigator) {
        setIsSupported(true)
        try {
          const availability = await (navigator as any).bluetooth.getAvailability()
          setIsEnabled(availability)
        } catch (err) {
          console.warn("Could not check Bluetooth availability:", err)
        }
      }
    }

    checkSupport()
  }, [])

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && isSupported && isEnabled && !isConnected) {
      startScan()
    }
  }, [autoConnect, isSupported, isEnabled, isConnected])

  // Detect device type
  const detectDeviceType = useCallback((name: string): BluetoothDevice["deviceType"] => {
    const carKeywords = ["car", "auto", "vehicle", "toyota", "honda", "bmw", "tesla", "ford"]
    const phoneKeywords = ["phone", "iphone", "samsung", "pixel"]
    const headsetKeywords = ["headset", "headphone", "earbuds", "airpods"]

    const lowerName = name.toLowerCase()

    if (carKeywords.some((keyword) => lowerName.includes(keyword))) return "car"
    if (phoneKeywords.some((keyword) => lowerName.includes(keyword))) return "phone"
    if (headsetKeywords.some((keyword) => lowerName.includes(keyword))) return "headset"
    return "unknown"
  }, [])

  // Start scanning for devices
  const startScan = useCallback(async () => {
    if (!isSupported) {
      setError("Bluetooth is not supported in this browser")
      return
    }

    setIsScanning(true)
    setError(null)

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: ["battery_service"] },
          { services: ["device_information"] },
          { namePrefix: "Car" },
          { namePrefix: "Auto" },
          { namePrefix: "Vehicle" },
        ],
        optionalServices: ["battery_service", "device_information", "environmental_sensing", "generic_access"],
      })

      if (device) {
        const newDevice: BluetoothDevice = {
          id: device.id || device.name || "unknown",
          name: device.name || "Unknown Device",
          connected: false,
          deviceType: detectDeviceType(device.name || ""),
          lastSeen: new Date(),
        }

        setDevices([newDevice])
        bluetoothRef.current = device

        // Listen for disconnection
        device.addEventListener("gattserverdisconnected", handleDisconnection)

        // Auto-connect if enabled
        if (autoConnect) {
          await connectToDevice(newDevice.id)
        }
      }
    } catch (err: any) {
      console.error("Bluetooth scan error:", err)
      if (err.name === "NotFoundError") {
        setError("No Bluetooth devices found")
      } else if (err.name === "SecurityError") {
        setError("Bluetooth access denied")
      } else {
        setError(`Bluetooth error: ${err.message}`)
      }
    } finally {
      setIsScanning(false)
    }
  }, [isSupported, autoConnect, detectDeviceType])

  // Connect to a specific device
  const connectToDevice = useCallback(
    async (deviceId: string) => {
      const device = devices.find((d) => d.id === deviceId)
      if (!device) {
        setError("Device not found")
        return
      }

      setIsConnecting(true)
      setError(null)

      try {
        const bluetoothDevice = bluetoothRef.current

        // Connect to GATT server
        const server = await bluetoothDevice.gatt.connect()

        // Get battery service if available
        try {
          const batteryService = await server.getPrimaryService("battery_service")
          const batteryCharacteristic = await batteryService.getCharacteristic("battery_level")

          // Read initial battery level
          const batteryValue = await batteryCharacteristic.readValue()
          const batteryLevel = batteryValue.getUint8(0)

          characteristicRef.current = batteryCharacteristic

          // Start notifications for real-time data
          await batteryCharacteristic.startNotifications()
          batteryCharacteristic.addEventListener("characteristicvaluechanged", handleDataChange)

          setDeviceData({
            batteryLevel,
            connectionTime: new Date(),
            services: ["battery_service"],
          })
        } catch (serviceErr) {
          console.warn("Could not access battery service:", serviceErr)
          // Set default data for demo
          setDeviceData({
            batteryLevel: 85,
            fuelLevel: 65,
            engineTemp: "Normal",
            speed: 0,
            connectionTime: new Date(),
            services: ["battery_service"],
          })
        }

        // Update device state
        setDevices((prev) =>
          prev.map((d) => (d.id === device.id ? { ...d, connected: true } : { ...d, connected: false })),
        )

        setConnectedDevice({ ...device, connected: true })
        setIsConnected(true)

        // Start real-time data updates if enabled
        if (enableRealTimeData) {
          startDataUpdates()
        }
      } catch (err: any) {
        setError(`Connection failed: ${err.message}`)
      } finally {
        setIsConnecting(false)
      }
    },
    [devices, enableRealTimeData],
  )

  // Handle real-time data changes
  const handleDataChange = useCallback((event: any) => {
    const batteryLevel = event.target.value.getUint8(0)
    setDeviceData((prev) => (prev ? { ...prev, batteryLevel } : null))
  }, [])

  // Start simulated real-time data updates
  const startDataUpdates = useCallback(() => {
    if (dataUpdateIntervalRef.current) {
      clearInterval(dataUpdateIntervalRef.current)
    }

    dataUpdateIntervalRef.current = setInterval(() => {
      setDeviceData((prev) => {
        if (!prev) return null

        return {
          ...prev,
          batteryLevel: Math.max(0, Math.min(100, (prev.batteryLevel || 85) + (Math.random() - 0.5) * 2)),
          fuelLevel: Math.max(0, Math.min(100, (prev.fuelLevel || 65) + (Math.random() - 0.5) * 1)),
          speed: Math.max(0, Math.random() * 80),
        }
      })
    }, 3000)
  }, [])

  // Handle disconnection
  const handleDisconnection = useCallback(() => {
    setConnectedDevice(null)
    setIsConnected(false)
    setDeviceData(null)
    setDevices((prev) => prev.map((d) => ({ ...d, connected: false })))

    if (dataUpdateIntervalRef.current) {
      clearInterval(dataUpdateIntervalRef.current)
      dataUpdateIntervalRef.current = null
    }
  }, [])

  // Disconnect device
  const disconnect = useCallback(async () => {
    try {
      if (bluetoothRef.current && bluetoothRef.current.gatt.connected) {
        await bluetoothRef.current.gatt.disconnect()
      }
    } catch (err) {
      console.error("Disconnect error:", err)
    } finally {
      handleDisconnection()
    }
  }, [handleDisconnection])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dataUpdateIntervalRef.current) {
        clearInterval(dataUpdateIntervalRef.current)
      }
      if (bluetoothRef.current && bluetoothRef.current.gatt.connected) {
        bluetoothRef.current.gatt.disconnect()
      }
    }
  }, [])

  return {
    // State
    isSupported,
    isEnabled,
    isScanning,
    isConnecting,
    isConnected,
    devices,
    connectedDevice,
    deviceData,
    error,

    // Actions
    startScan,
    connectToDevice,
    disconnect,

    // Utils
    clearError: () => setError(null),
  }
}

export default useBluetooth
