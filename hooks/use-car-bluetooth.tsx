"use client"

import { useState, useEffect, useRef, useCallback } from "react"

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

interface UseCarBluetoothOptions {
  autoConnect?: boolean
  dataUpdateInterval?: number
  enableDiagnostics?: boolean
  enableRealTimeData?: boolean
}

export const useCarBluetooth = (options: UseCarBluetoothOptions = {}) => {
  const {
    autoConnect = false,
    dataUpdateInterval = 1000,
    enableDiagnostics = true,
    enableRealTimeData = true,
  } = options

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

  // OBD-II PIDs for car data
  const OBD_PIDS = {
    ENGINE_RPM: "010C",
    VEHICLE_SPEED: "010D",
    ENGINE_COOLANT_TEMP: "0105",
    FUEL_LEVEL: "012F",
    THROTTLE_POSITION: "0111",
    ENGINE_LOAD: "0104",
    INTAKE_AIR_TEMP: "010F",
    FUEL_PRESSURE: "010A",
    BATTERY_VOLTAGE: "0142",
  }

  // Check Bluetooth support
  useEffect(() => {
    setIsSupported("bluetooth" in navigator && "serviceWorker" in navigator)
  }, [])

  // Detect car device type
  const detectCarDeviceType = useCallback((name: string, services: string[]): CarBluetoothDevice["deviceType"] => {
    const lowerName = name.toLowerCase()

    // OBD-II devices
    if (lowerName.includes("obd") || lowerName.includes("elm327") || lowerName.includes("obdlink")) {
      return "obd2"
    }

    // Car manufacturer systems
    if (services.includes("vehicle_data") || services.includes("automotive")) {
      return "car_system"
    }

    // Aftermarket devices
    if (lowerName.includes("torque") || lowerName.includes("carista") || lowerName.includes("bimmercode")) {
      return "aftermarket"
    }

    return "unknown"
  }, [])

  // Start scanning for car devices
  const startScan = useCallback(async () => {
    if (!isSupported) {
      setError("Bluetooth is not supported in this browser")
      return
    }

    setIsScanning(true)
    setError(null)

    try {
      // Request car-specific Bluetooth devices
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          // OBD-II devices
          { namePrefix: "OBD" },
          { namePrefix: "ELM327" },
          { namePrefix: "OBDLink" },
          { namePrefix: "OBDII" },

          // Car manufacturer systems
          { namePrefix: "BMW" },
          { namePrefix: "Mercedes" },
          { namePrefix: "Audi" },
          { namePrefix: "Toyota" },
          { namePrefix: "Honda" },
          { namePrefix: "Ford" },
          { namePrefix: "Tesla" },

          // Generic automotive
          { namePrefix: "Car" },
          { namePrefix: "Auto" },
          { namePrefix: "Vehicle" },
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
      }
    } catch (err: any) {
      console.error("Car Bluetooth scan error:", err)
      if (err.name === "NotFoundError") {
        setError("No car devices found. Make sure your OBD-II adapter or car system is discoverable.")
      } else if (err.name === "SecurityError") {
        setError("Bluetooth access denied. Please allow Bluetooth permissions.")
      } else {
        setError(`Bluetooth error: ${err.message}`)
      }
    } finally {
      setIsScanning(false)
    }
  }, [isSupported, autoConnect, detectCarDeviceType])

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
    async (deviceId: string) => {
      const device = devices.find((d) => d.id === deviceId)
      if (!device) {
        setError("Device not found")
        return
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

        // Start real-time data updates
        if (enableRealTimeData) {
          startDataUpdates()
        }

        // Start connection monitoring
        startConnectionMonitoring()
      } catch (err: any) {
        setError(`Connection failed: ${err.message}`)
        setConnectionQuality("disconnected")
      } finally {
        setIsConnecting(false)
      }
    },
    [devices, enableRealTimeData],
  )

  // Handle characteristic value changes
  const handleCharacteristicChange = useCallback((event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic
    const value = characteristic.value

    if (!value) return

    // Parse OBD-II data or custom car data
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
          // For demo purposes, generate realistic car data
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
        // Update car data with realistic values
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
          // Simulate connection quality based on data freshness
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

  // Send OBD-II command
  const sendOBDCommand = useCallback(
    async (pid: string): Promise<any> => {
      if (!isConnected || !gattServerRef.current) {
        throw new Error("Not connected to car")
      }

      try {
        // This would send actual OBD-II commands in a real implementation
        // For demo, return simulated data
        return generateRealisticCarData()
      } catch (err) {
        console.error("Error sending OBD command:", err)
        throw err
      }
    },
    [isConnected],
  )

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

    // Actions
    startScan,
    connectToDevice,
    disconnect,
    sendOBDCommand,

    // Utils
    clearError: () => setError(null),
  }
}

export default useCarBluetooth
