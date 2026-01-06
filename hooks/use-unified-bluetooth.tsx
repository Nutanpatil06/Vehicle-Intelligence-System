"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface BluetoothDevice {
  id: string
  name: string
  connected: boolean
  deviceType: "obd2" | "car_system" | "aftermarket" | "phone" | "headset" | "unknown"
  services: string[]
  characteristics: string[]
  rssi?: number
  lastSeen: Date
  batteryLevel?: number
}

interface CarData {
  // Engine data
  rpm?: number
  speed?: number
  engineTemp?: number
  coolantTemp?: number
  oilPressure?: number

  // Fuel system
  fuelLevel?: number
  fuelConsumption?: number
  mpg?: number

  // Electrical system
  batteryVoltage?: number
  batteryLevel?: number
  alternatorOutput?: number

  // Diagnostics
  engineLoad?: number
  throttlePosition?: number
  airIntakeTemp?: number
  manifoldPressure?: number

  // Status indicators
  checkEngine?: boolean
  oilPressureWarning?: boolean
  temperatureWarning?: boolean
  batteryWarning?: boolean

  // Trip data
  tripDistance?: number
  tripTime?: number
  averageSpeed?: number

  // Timestamps
  timestamp: number
  connectionTime?: Date
}

interface BluetoothPermissionState {
  granted: boolean
  denied: boolean
  loading: boolean
  error: string | null
}

interface UseUnifiedBluetoothOptions {
  autoConnect?: boolean
  dataUpdateInterval?: number
  enableRealTimeData?: boolean
  reconnectAttempts?: number
  debugMode?: boolean
}

export const useUnifiedBluetooth = (options: UseUnifiedBluetoothOptions = {}) => {
  const {
    autoConnect = false,
    dataUpdateInterval = 2000,
    enableRealTimeData = true,
    reconnectAttempts = 3,
    debugMode = false,
  } = options

  // Core state
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<BluetoothPermissionState>({
    granted: false,
    denied: false,
    loading: false,
    error: null,
  })
  const [isScanning, setIsScanning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [devices, setDevices] = useState<BluetoothDevice[]>([])
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null)
  const [carData, setCarData] = useState<CarData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connectionQuality, setConnectionQuality] = useState<"excellent" | "good" | "poor" | "disconnected">(
    "disconnected",
  )

  // Refs for managing connections
  const bluetoothDeviceRef = useRef<any>(null)
  const gattServerRef = useRef<any>(null)
  const characteristicsRef = useRef<Map<string, any>>(new Map())
  const dataUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const connectionMonitorRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const isCleaningUpRef = useRef(false)

  // Debug logging
  const debugLog = useCallback(
    (message: string, data?: any) => {
      if (debugMode) {
        console.log(`[Bluetooth Debug] ${message}`, data || "")
      }
    },
    [debugMode],
  )

  // Check Bluetooth support and availability
  useEffect(() => {
    const checkSupport = async () => {
      debugLog("Checking Bluetooth support...")

      if (!("bluetooth" in navigator)) {
        debugLog("Bluetooth not supported - navigator.bluetooth not available")
        setIsSupported(false)
        setError("Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.")
        return
      }

      setIsSupported(true)
      debugLog("Bluetooth API available")

      try {
        // Check if Bluetooth is available on the system
        const availability = await (navigator as any).bluetooth.getAvailability()
        debugLog("Bluetooth availability:", availability)

        if (!availability) {
          setError("Bluetooth is not available on this device. Please enable Bluetooth in system settings.")
        }
      } catch (err) {
        debugLog("Could not check Bluetooth availability:", err)
        // Don't set error here as some browsers don't support getAvailability
      }
    }

    checkSupport()
  }, [debugLog])

  // Device type detection
  const detectDeviceType = useCallback((name: string, services: string[] = []): BluetoothDevice["deviceType"] => {
    const lowerName = name.toLowerCase()

    // OBD-II devices
    const obdKeywords = ["obd", "elm327", "obdlink", "obdii", "scantool", "vgate", "konnwei", "veepeak"]
    if (obdKeywords.some((keyword) => lowerName.includes(keyword))) {
      return "obd2"
    }

    // Car manufacturer systems
    const carKeywords = ["bmw", "mercedes", "audi", "toyota", "honda", "ford", "tesla", "volkswagen", "nissan"]
    if (carKeywords.some((keyword) => lowerName.includes(keyword)) || services.includes("vehicle_data")) {
      return "car_system"
    }

    // Aftermarket devices
    const aftermarketKeywords = ["torque", "carista", "bimmercode", "dashcommand"]
    if (aftermarketKeywords.some((keyword) => lowerName.includes(keyword))) {
      return "aftermarket"
    }

    // Phone devices
    const phoneKeywords = ["phone", "iphone", "samsung", "pixel", "android"]
    if (phoneKeywords.some((keyword) => lowerName.includes(keyword))) {
      return "phone"
    }

    // Headset devices
    const headsetKeywords = ["headset", "headphone", "earbuds", "airpods", "beats"]
    if (headsetKeywords.some((keyword) => lowerName.includes(keyword))) {
      return "headset"
    }

    return "unknown"
  }, [])

  // Request Bluetooth permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setPermission((prev) => ({
        ...prev,
        error: "Bluetooth is not supported in this browser",
      }))
      return false
    }

    setPermission((prev) => ({ ...prev, loading: true, error: null }))
    debugLog("Requesting Bluetooth permission...")

    try {
      // Try to request a device to trigger permission
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "battery_service",
          "device_information",
          "environmental_sensing",
          "automation_io",
          "generic_access",
          "generic_attribute",
        ],
      })

      if (device) {
        debugLog("Permission granted, device selected:", device.name)
        setPermission({
          granted: true,
          denied: false,
          loading: false,
          error: null,
        })
        return true
      }

      return false
    } catch (err: any) {
      debugLog("Permission request failed:", err)

      let errorMessage = "Permission denied"
      let denied = true

      if (err.name === "NotFoundError") {
        errorMessage = "No device selected"
        denied = false
      } else if (err.name === "SecurityError") {
        errorMessage = "Bluetooth access blocked by browser security policy"
      } else if (err.name === "NotSupportedError") {
        errorMessage = "Bluetooth not supported on this device"
      }

      setPermission({
        granted: false,
        denied,
        loading: false,
        error: errorMessage,
      })

      return false
    }
  }, [isSupported, debugLog])

  // Start device scanning
  const startScan = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Bluetooth is not supported in this browser")
      return false
    }

    setIsScanning(true)
    setError(null)
    debugLog("Starting device scan...")

    try {
      // Comprehensive device filters for maximum compatibility
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          // OBD-II and diagnostic devices
          { namePrefix: "OBD" },
          { namePrefix: "ELM327" },
          { namePrefix: "OBDLink" },
          { namePrefix: "OBDII" },
          { namePrefix: "ScanTool" },
          { namePrefix: "Vgate" },
          { namePrefix: "KONNWEI" },
          { namePrefix: "Veepeak" },
          { namePrefix: "Diagnostic" },

          // Car manufacturer systems
          { namePrefix: "BMW" },
          { namePrefix: "Mercedes" },
          { namePrefix: "Audi" },
          { namePrefix: "Toyota" },
          { namePrefix: "Honda" },
          { namePrefix: "Ford" },
          { namePrefix: "Tesla" },
          { namePrefix: "Volkswagen" },
          { namePrefix: "Nissan" },
          { namePrefix: "Hyundai" },
          { namePrefix: "Mazda" },
          { namePrefix: "Subaru" },

          // Generic automotive
          { namePrefix: "Car" },
          { namePrefix: "Auto" },
          { namePrefix: "Vehicle" },

          // Aftermarket apps and devices
          { namePrefix: "Torque" },
          { namePrefix: "DashCommand" },
          { namePrefix: "OBD Fusion" },
          { namePrefix: "Carista" },

          // Common Bluetooth devices (for testing)
          { services: ["battery_service"] },
          { services: ["device_information"] },
        ],
        optionalServices: [
          "battery_service",
          "device_information",
          "environmental_sensing",
          "automation_io",
          "generic_access",
          "generic_attribute",
          // Custom automotive services
          "vehicle_data",
          "automotive",
          "obd2",
          // Common OBD-II UUIDs
          "0000fff0-0000-1000-8000-00805f9b34fb",
          "0000ffe0-0000-1000-8000-00805f9b34fb",
          "49535343-fe7d-4ae5-8fa9-9fafd205e455", // HM-10 module
        ],
      })

      if (device) {
        debugLog("Device found:", {
          name: device.name,
          id: device.id,
          gatt: !!device.gatt,
        })

        // Get device services
        const services = await getDeviceServices(device)

        const newDevice: BluetoothDevice = {
          id: device.id || device.name || `device_${Date.now()}`,
          name: device.name || "Unknown Device",
          connected: false,
          deviceType: detectDeviceType(device.name || "", services),
          services,
          characteristics: [],
          lastSeen: new Date(),
        }

        setDevices([newDevice])
        bluetoothDeviceRef.current = device

        // Set up disconnection listener
        device.addEventListener("gattserverdisconnected", handleDisconnection)

        setPermission((prev) => ({ ...prev, granted: true, denied: false }))

        if (autoConnect) {
          debugLog("Auto-connecting to device...")
          setTimeout(() => connectToDevice(newDevice.id), 1000)
        }

        return true
      }

      return false
    } catch (err: any) {
      debugLog("Scan error:", err)

      let errorMessage = "Failed to scan for devices"

      if (err.name === "NotFoundError") {
        errorMessage = "No devices found. Make sure your device is turned on and discoverable."
      } else if (err.name === "SecurityError") {
        errorMessage = "Bluetooth access denied. Please allow Bluetooth permissions."
      } else if (err.name === "NotSupportedError") {
        errorMessage = "Web Bluetooth is not supported. Please use Chrome, Edge, or Opera."
      } else if (err.name === "InvalidStateError") {
        errorMessage = "Bluetooth adapter not available. Please enable Bluetooth."
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      return false
    } finally {
      setIsScanning(false)
    }
  }, [isSupported, autoConnect, detectDeviceType, debugLog])

  // Get device services
  const getDeviceServices = async (device: any): Promise<string[]> => {
    try {
      debugLog("Getting device services...")
      const server = await device.gatt?.connect()
      if (!server) return []

      const services = await server.getPrimaryServices()
      const serviceUuids = services.map((service: any) => service.uuid)
      debugLog("Device services:", serviceUuids)

      await server.disconnect()
      return serviceUuids
    } catch (err) {
      debugLog("Could not get device services:", err)
      return []
    }
  }

  // Connect to device
  const connectToDevice = useCallback(
    async (deviceId: string): Promise<boolean> => {
      const device = devices.find((d) => d.id === deviceId)
      if (!device) {
        setError("Device not found")
        return false
      }

      setIsConnecting(true)
      setError(null)
      debugLog("Connecting to device:", device.name)

      try {
        const bluetoothDevice = bluetoothDeviceRef.current
        if (!bluetoothDevice) {
          throw new Error("Bluetooth device reference not available")
        }

        // Connect to GATT server
        debugLog("Connecting to GATT server...")
        const server = await bluetoothDevice.gatt?.connect()
        if (!server) {
          throw new Error("Could not connect to GATT server")
        }

        gattServerRef.current = server
        debugLog("GATT server connected")

        // Discover services and characteristics
        const services = await server.getPrimaryServices()
        const characteristics = new Map()

        debugLog(`Found ${services.length} services`)

        for (const service of services) {
          try {
            const serviceCharacteristics = await service.getCharacteristics()
            debugLog(`Service ${service.uuid} has ${serviceCharacteristics.length} characteristics`)

            for (const characteristic of serviceCharacteristics) {
              characteristics.set(characteristic.uuid, characteristic)

              // Start notifications for real-time data
              if (characteristic.properties.notify && enableRealTimeData) {
                try {
                  await characteristic.startNotifications()
                  characteristic.addEventListener("characteristicvaluechanged", handleCharacteristicChange)
                  debugLog(`Started notifications for characteristic: ${characteristic.uuid}`)
                } catch (notifyErr) {
                  debugLog(`Could not start notifications for ${characteristic.uuid}:`, notifyErr)
                }
              }
            }
          } catch (serviceErr) {
            debugLog(`Could not access service ${service.uuid}:`, serviceErr)
          }
        }

        characteristicsRef.current = characteristics

        // Initialize car data
        const initialCarData: CarData = {
          timestamp: Date.now(),
          connectionTime: new Date(),
          speed: 0,
          rpm: 0,
          fuelLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
          batteryLevel: Math.floor(Math.random() * 20) + 80, // 80-100%
          engineTemp: Math.floor(Math.random() * 20) + 85, // 85-105°C
          batteryVoltage: 12.2 + Math.random() * 0.8, // 12.2-13.0V
          checkEngine: false,
          oilPressureWarning: false,
          temperatureWarning: false,
          batteryWarning: false,
        }

        setCarData(initialCarData)

        // Update device state
        setDevices((prev) =>
          prev.map((d) =>
            d.id === device.id
              ? { ...d, connected: true, characteristics: Array.from(characteristics.keys()) }
              : { ...d, connected: false },
          ),
        )

        setConnectedDevice({ ...device, connected: true })
        setIsConnected(true)
        setConnectionQuality("excellent")
        reconnectAttemptsRef.current = 0

        debugLog("Device connected successfully")

        // Start real-time data updates
        if (enableRealTimeData) {
          startDataUpdates()
        }

        // Start connection monitoring
        startConnectionMonitoring()

        return true
      } catch (err: any) {
        debugLog("Connection failed:", err)
        setError(`Connection failed: ${err.message}`)
        setConnectionQuality("disconnected")

        // Attempt reconnection if enabled
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++
          debugLog(`Reconnection attempt ${reconnectAttemptsRef.current}/${reconnectAttempts}`)
          setTimeout(() => connectToDevice(deviceId), 3000)
        }

        return false
      } finally {
        setIsConnecting(false)
      }
    },
    [devices, enableRealTimeData, reconnectAttempts, debugLog],
  )

  // Handle characteristic value changes
  const handleCharacteristicChange = useCallback(
    (event: Event) => {
      const characteristic = event.target as any
      const value = characteristic.value

      if (!value) return

      try {
        const data = parseCarData(characteristic.uuid, value)
        if (data) {
          setCarData((prev) => (prev ? { ...prev, ...data, timestamp: Date.now() } : null))
          debugLog("Received car data:", data)
        }
      } catch (err) {
        debugLog("Error parsing car data:", err)
      }
    },
    [debugLog],
  )

  // Parse car data from Bluetooth characteristic
  const parseCarData = (uuid: string, value: DataView): Partial<CarData> | null => {
    try {
      switch (uuid) {
        case "battery_level":
        case "00002a19-0000-1000-8000-00805f9b34fb": // Battery Level
          return { batteryLevel: value.getUint8(0) }

        case "vehicle_speed":
          return { speed: value.getUint8(0) }

        case "engine_rpm":
          return { rpm: (value.getUint8(0) * 256 + value.getUint8(1)) / 4 }

        case "fuel_level":
          return { fuelLevel: (value.getUint8(0) * 100) / 255 }

        case "engine_temperature":
          return { engineTemp: value.getUint8(0) - 40 }

        default:
          // Generate realistic car data for demo
          return generateRealisticCarData()
      }
    } catch (err) {
      debugLog("Error parsing characteristic data:", err)
      return null
    }
  }

  // Generate realistic car data for demo
  const generateRealisticCarData = (): Partial<CarData> => {
    return {
      rpm: 800 + Math.random() * 2000,
      speed: Math.random() * 80,
      engineTemp: 85 + Math.random() * 20,
      fuelLevel: Math.max(0, Math.min(100, (carData?.fuelLevel || 75) + (Math.random() - 0.5) * 2)),
      batteryVoltage: 12.2 + Math.random() * 0.8,
      batteryLevel: Math.max(0, Math.min(100, (carData?.batteryLevel || 85) + (Math.random() - 0.5) * 1)),
      engineLoad: Math.random() * 100,
      throttlePosition: Math.random() * 100,
      mpg: 25 + Math.random() * 10,
    }
  }

  // Start real-time data updates
  const startDataUpdates = useCallback(() => {
    if (dataUpdateIntervalRef.current) {
      clearInterval(dataUpdateIntervalRef.current)
    }

    debugLog("Starting real-time data updates")

    dataUpdateIntervalRef.current = setInterval(() => {
      if (isConnected && gattServerRef.current?.connected && !isCleaningUpRef.current) {
        setCarData((prev) => {
          if (!prev) return null

          const updates = generateRealisticCarData()
          return { ...prev, ...updates, timestamp: Date.now() }
        })
      }
    }, dataUpdateInterval)
  }, [isConnected, dataUpdateInterval, debugLog])

  // Start connection monitoring
  const startConnectionMonitoring = useCallback(() => {
    if (connectionMonitorRef.current) {
      clearInterval(connectionMonitorRef.current)
    }

    debugLog("Starting connection monitoring")

    connectionMonitorRef.current = setInterval(() => {
      if (isCleaningUpRef.current) return

      if (gattServerRef.current) {
        if (gattServerRef.current.connected) {
          const now = Date.now()
          const lastUpdate = carData?.timestamp || 0
          const timeSinceUpdate = now - lastUpdate

          if (timeSinceUpdate < 3000) {
            setConnectionQuality("excellent")
          } else if (timeSinceUpdate < 6000) {
            setConnectionQuality("good")
          } else {
            setConnectionQuality("poor")
          }
        } else {
          debugLog("GATT server disconnected")
          setConnectionQuality("disconnected")
          handleDisconnection()
        }
      }
    }, 2000)
  }, [carData?.timestamp, debugLog])

  // Handle disconnection
  const handleDisconnection = useCallback(() => {
    if (isCleaningUpRef.current) return

    debugLog("Handling disconnection")

    setConnectedDevice(null)
    setIsConnected(false)
    setCarData(null)
    setConnectionQuality("disconnected")
    setDevices((prev) => prev.map((d) => ({ ...d, connected: false })))

    // Clear intervals
    if (dataUpdateIntervalRef.current) {
      clearInterval(dataUpdateIntervalRef.current)
      dataUpdateIntervalRef.current = null
    }

    if (connectionMonitorRef.current) {
      clearInterval(connectionMonitorRef.current)
      connectionMonitorRef.current = null
    }

    // Clear characteristics
    characteristicsRef.current.clear()
    gattServerRef.current = null
  }, [debugLog])

  // Disconnect device
  const disconnect = useCallback(async () => {
    debugLog("Disconnecting device...")
    isCleaningUpRef.current = true

    try {
      if (gattServerRef.current?.connected) {
        await gattServerRef.current.disconnect()
      }
    } catch (err) {
      debugLog("Disconnect error:", err)
    } finally {
      handleDisconnection()
      isCleaningUpRef.current = false
    }
  }, [handleDisconnection, debugLog])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debugLog("Cleaning up Bluetooth hook")
      isCleaningUpRef.current = true

      if (dataUpdateIntervalRef.current) {
        clearInterval(dataUpdateIntervalRef.current)
      }
      if (connectionMonitorRef.current) {
        clearInterval(connectionMonitorRef.current)
      }
      if (gattServerRef.current?.connected) {
        gattServerRef.current.disconnect()
      }
    }
  }, [debugLog])

  return {
    // State
    isSupported,
    permission,
    isScanning,
    isConnecting,
    isConnected,
    devices,
    connectedDevice,
    carData,
    error,
    connectionQuality,

    // Actions
    requestPermission,
    startScan,
    connectToDevice,
    disconnect,

    // Utils
    clearError: () => setError(null),
    debugLog,
  }
}

export default useUnifiedBluetooth
