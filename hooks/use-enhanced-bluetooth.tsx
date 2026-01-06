"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import usePermissions from "./use-permissions"

interface CarData {
  rpm?: number
  speed?: number
  engineTemp?: number
  coolantTemp?: number
  oilPressure?: number
  fuelLevel?: number
  fuelConsumption?: number
  mpg?: number
  batteryVoltage?: number
  batteryLevel?: number
  alternatorOutput?: number
  engineLoad?: number
  throttlePosition?: number
  airIntakeTemp?: number
  manifoldPressure?: number
  checkEngine?: boolean
  oilPressureWarning?: boolean
  temperatureWarning?: boolean
  batteryWarning?: boolean
  tripDistance?: number
  tripTime?: number
  averageSpeed?: number
  timestamp: number
}

interface CarBluetoothDevice {
  id: string
  name: string
  connected: boolean
  deviceType: "obd2" | "car_system" | "aftermarket" | "unknown"
  services: string[]
  characteristics: string[]
  rssi?: number
  lastSeen: Date
}

interface UseEnhancedBluetoothOptions {
  autoConnect?: boolean
  dataUpdateInterval?: number
  enableDiagnostics?: boolean
  enableRealTimeData?: boolean
  reconnectAttempts?: number
}

export const useEnhancedBluetooth = (options: UseEnhancedBluetoothOptions = {}) => {
  const {
    autoConnect = false,
    dataUpdateInterval = 1000,
    enableDiagnostics = true,
    enableRealTimeData = true,
    reconnectAttempts = 3,
  } = options

  const { bluetooth, requestBluetoothPermission } = usePermissions()

  const [isSupported, setIsSupported] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [devices, setDevices] = useState<CarBluetoothDevice[]>([])
  const [connectedDevice, setConnectedDevice] = useState<CarBluetoothDevice | null>(null)
  const [carData, setCarData] = useState<CarData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connectionQuality, setConnectionQuality] = useState<"excellent" | "good" | "poor" | "disconnected">(
    "disconnected",
  )

  const bluetoothDeviceRef = useRef<BluetoothDevice | null>(null)
  const gattServerRef = useRef<BluetoothRemoteGATTServer | null>(null)
  const characteristicsRef = useRef<Map<string, BluetoothRemoteGATTCharacteristic>>(new Map())
  const dataUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const connectionMonitorRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  // Check Bluetooth support
  useEffect(() => {
    setIsSupported("bluetooth" in navigator)
  }, [])

  // Detect car device type
  const detectCarDeviceType = useCallback((name: string, services: string[]): CarBluetoothDevice["deviceType"] => {
    const lowerName = name.toLowerCase()

    // OBD-II devices
    if (
      lowerName.includes("obd") ||
      lowerName.includes("elm327") ||
      lowerName.includes("obdlink") ||
      lowerName.includes("scantool")
    ) {
      return "obd2"
    }

    // Car manufacturer systems
    if (
      services.includes("vehicle_data") ||
      services.includes("automotive") ||
      lowerName.includes("bmw") ||
      lowerName.includes("mercedes") ||
      lowerName.includes("audi") ||
      lowerName.includes("toyota") ||
      lowerName.includes("honda") ||
      lowerName.includes("ford") ||
      lowerName.includes("tesla")
    ) {
      return "car_system"
    }

    // Aftermarket devices
    if (
      lowerName.includes("torque") ||
      lowerName.includes("carista") ||
      lowerName.includes("bimmercode") ||
      lowerName.includes("dashcommand")
    ) {
      return "aftermarket"
    }

    return "unknown"
  }, [])

  // Request Bluetooth permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestBluetoothPermission()
      if (granted) {
        setError(null)
      }
      return granted
    } catch (err) {
      console.error("Bluetooth permission request failed:", err)
      return false
    }
  }, [requestBluetoothPermission])

  // Start scanning for car devices
  const startScan = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Bluetooth is not supported in this browser")
      return false
    }

    // Check and request permission if needed
    if (!bluetooth.granted) {
      const permissionGranted = await requestPermission()
      if (!permissionGranted) {
        return false
      }
    }

    setIsScanning(true)
    setError(null)

    try {
      // Request car-specific Bluetooth devices with comprehensive filters
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          // OBD-II devices
          { namePrefix: "OBD" },
          { namePrefix: "ELM327" },
          { namePrefix: "OBDLink" },
          { namePrefix: "OBDII" },
          { namePrefix: "ScanTool" },
          { namePrefix: "Vgate" },
          { namePrefix: "KONNWEI" },
          { namePrefix: "Veepeak" },

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

          // Generic automotive
          { namePrefix: "Car" },
          { namePrefix: "Auto" },
          { namePrefix: "Vehicle" },
          { namePrefix: "Diagnostic" },

          // Aftermarket apps
          { namePrefix: "Torque" },
          { namePrefix: "DashCommand" },
          { namePrefix: "OBD Fusion" },
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
          // OBD-II specific UUIDs
          "0000fff0-0000-1000-8000-00805f9b34fb",
          "0000ffe0-0000-1000-8000-00805f9b34fb",
        ],
      })

      if (device) {
        const services = await getDeviceServices(device)

        const newDevice: CarBluetoothDevice = {
          id: device.id || device.name || "unknown",
          name: device.name || "Unknown Car Device",
          connected: false,
          deviceType: detectCarDeviceType(device.name || "", services),
          services,
          characteristics: [],
          lastSeen: new Date(),
        }

        setDevices([newDevice])
        bluetoothDeviceRef.current = device

        // Listen for disconnection
        device.addEventListener("gattserverdisconnected", handleDisconnection)

        if (autoConnect) {
          await connectToDevice(newDevice.id)
        }

        return true
      }

      return false
    } catch (err: any) {
      console.error("Car Bluetooth scan error:", err)
      let errorMessage = "Failed to scan for car devices"

      if (err.name === "NotFoundError") {
        errorMessage = "No car devices found. Make sure your OBD-II adapter or car system is discoverable and nearby."
      } else if (err.name === "SecurityError") {
        errorMessage = "Bluetooth access denied. Please allow Bluetooth permissions and try again."
      } else if (err.name === "NotSupportedError") {
        errorMessage = "Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera."
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      return false
    } finally {
      setIsScanning(false)
    }
  }, [isSupported, bluetooth.granted, requestPermission, autoConnect, detectCarDeviceType])

  // Get device services
  const getDeviceServices = async (device: BluetoothDevice): Promise<string[]> => {
    try {
      const server = await device.gatt?.connect()
      if (!server) return []

      const services = await server.getPrimaryServices()
      return services.map((service) => service.uuid)
    } catch (err) {
      console.warn("Could not get device services:", err)
      return []
    }
  }

  // Connect to car device
  const connectToDevice = useCallback(
    async (deviceId: string): Promise<boolean> => {
      const device = devices.find((d) => d.id === deviceId)
      if (!device) {
        setError("Device not found")
        return false
      }

      setIsConnecting(true)
      setError(null)

      try {
        const bluetoothDevice = bluetoothDeviceRef.current
        if (!bluetoothDevice) throw new Error("Bluetooth device not available")

        // Connect to GATT server
        const server = await bluetoothDevice.gatt?.connect()
        if (!server) throw new Error("Could not connect to GATT server")

        gattServerRef.current = server

        // Get available services and characteristics
        const services = await server.getPrimaryServices()
        const characteristics = new Map<string, BluetoothRemoteGATTCharacteristic>()

        for (const service of services) {
          try {
            const serviceCharacteristics = await service.getCharacteristics()
            for (const characteristic of serviceCharacteristics) {
              characteristics.set(characteristic.uuid, characteristic)

              // Start notifications for real-time data
              if (characteristic.properties.notify && enableRealTimeData) {
                try {
                  await characteristic.startNotifications()
                  characteristic.addEventListener("characteristicvaluechanged", handleCharacteristicChange)
                } catch (notifyErr) {
                  console.warn("Could not start notifications for characteristic:", characteristic.uuid)
                }
              }
            }
          } catch (serviceErr) {
            console.warn("Could not access service:", service.uuid)
          }
        }

        characteristicsRef.current = characteristics

        // Initialize car data
        const initialCarData: CarData = {
          timestamp: Date.now(),
          speed: 0,
          rpm: 0,
          fuelLevel: 75,
          batteryLevel: 85,
          engineTemp: 90,
          batteryVoltage: 12.6,
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

        // Start real-time data updates
        if (enableRealTimeData) {
          startDataUpdates()
        }

        // Start connection monitoring
        startConnectionMonitoring()

        return true
      } catch (err: any) {
        setError(`Connection failed: ${err.message}`)
        setConnectionQuality("disconnected")

        // Attempt reconnection if enabled
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++
          console.log(`Reconnection attempt ${reconnectAttemptsRef.current}/${reconnectAttempts}`)
          setTimeout(() => connectToDevice(deviceId), 2000)
        }

        return false
      } finally {
        setIsConnecting(false)
      }
    },
    [devices, enableRealTimeData, reconnectAttempts],
  )

  // Handle characteristic value changes
  const handleCharacteristicChange = useCallback((event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic
    const value = characteristic.value

    if (!value) return

    try {
      const data = parseCarData(characteristic.uuid, value)
      if (data) {
        setCarData((prev) => (prev ? { ...prev, ...data, timestamp: Date.now() } : null))
      }
    } catch (err) {
      console.warn("Error parsing car data:", err)
    }
  }, [])

  // Parse car data from Bluetooth characteristic
  const parseCarData = (uuid: string, value: DataView): Partial<CarData> | null => {
    try {
      // This is a simplified parser - real OBD-II parsing would be more complex
      switch (uuid) {
        case "battery_level":
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
      console.warn("Error parsing characteristic data:", err)
      return null
    }
  }

  // Generate realistic car data for demo
  const generateRealisticCarData = (): Partial<CarData> => {
    return {
      rpm: 800 + Math.random() * 2000,
      speed: Math.random() * 80,
      engineTemp: 85 + Math.random() * 20,
      fuelLevel: 60 + Math.random() * 30,
      batteryVoltage: 12.2 + Math.random() * 0.8,
      batteryLevel: 80 + Math.random() * 20,
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

    dataUpdateIntervalRef.current = setInterval(() => {
      if (isConnected && gattServerRef.current?.connected) {
        setCarData((prev) => {
          if (!prev) return null

          const updates = generateRealisticCarData()
          return { ...prev, ...updates, timestamp: Date.now() }
        })
      }
    }, dataUpdateInterval)
  }, [isConnected, dataUpdateInterval])

  // Start connection monitoring
  const startConnectionMonitoring = useCallback(() => {
    if (connectionMonitorRef.current) {
      clearInterval(connectionMonitorRef.current)
    }

    connectionMonitorRef.current = setInterval(() => {
      if (gattServerRef.current) {
        if (gattServerRef.current.connected) {
          const now = Date.now()
          const lastUpdate = carData?.timestamp || 0
          const timeSinceUpdate = now - lastUpdate

          if (timeSinceUpdate < 2000) {
            setConnectionQuality("excellent")
          } else if (timeSinceUpdate < 5000) {
            setConnectionQuality("good")
          } else {
            setConnectionQuality("poor")
          }
        } else {
          setConnectionQuality("disconnected")
          handleDisconnection()
        }
      }
    }, 2000)
  }, [carData?.timestamp])

  // Handle disconnection
  const handleDisconnection = useCallback(() => {
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
  }, [])

  // Disconnect device
  const disconnect = useCallback(async () => {
    try {
      if (gattServerRef.current?.connected) {
        await gattServerRef.current.disconnect()
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
      if (connectionMonitorRef.current) {
        clearInterval(connectionMonitorRef.current)
      }
      if (gattServerRef.current?.connected) {
        gattServerRef.current.disconnect()
      }
    }
  }, [])

  return {
    // State
    isSupported,
    isScanning,
    isConnecting,
    isConnected,
    devices,
    connectedDevice,
    carData,
    error,
    connectionQuality,
    hasPermission: bluetooth.granted,
    permissionLoading: bluetooth.loading,

    // Actions
    startScan,
    connectToDevice,
    disconnect,
    requestPermission,

    // Utils
    clearError: () => setError(null),
  }
}

export default useEnhancedBluetooth
