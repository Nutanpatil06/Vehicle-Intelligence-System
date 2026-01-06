"use client"

import { useState } from "react"
import { Bluetooth, Search, Check, AlertCircle, Car, Settings, Battery, Signal } from "lucide-react"
import PermissionManager from "@/components/permission-manager"
import useEnhancedBluetooth from "@/hooks/use-enhanced-bluetooth"

interface BluetoothConnectProps {
  onConnect: (connected: boolean, deviceInfo?: any) => void
}

const BluetoothConnect = ({ onConnect }: BluetoothConnectProps) => {
  const {
    isSupported,
    isScanning,
    isConnecting,
    isConnected,
    devices,
    connectedDevice,
    carData,
    error,
    connectionQuality,
    hasPermission,
    startScan,
    connectToDevice,
    disconnect,
    requestPermission,
  } = useEnhancedBluetooth({
    autoConnect: false,
    enableRealTimeData: true,
    dataUpdateInterval: 1000,
    reconnectAttempts: 3,
  })

  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)

  // Handle connection
  const handleConnect = async (deviceId: string) => {
    setSelectedDevice(deviceId)
    const success = await connectToDevice(deviceId)

    if (success && connectedDevice) {
      onConnect(true, {
        device: connectedDevice,
        carData,
        connectionTime: new Date(),
      })
    }
  }

  // Handle disconnection
  const handleDisconnect = async () => {
    await disconnect()
    onConnect(false)
    setSelectedDevice(null)
  }

  // Get device icon
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "obd2":
      case "car_system":
        return <Car className="w-5 h-5" />
      case "aftermarket":
        return <Settings className="w-5 h-5" />
      default:
        return <Bluetooth className="w-5 h-5" />
    }
  }

  // Get signal strength color
  const getSignalColor = (rssi?: number) => {
    if (!rssi) return "text-gray-500"
    if (rssi > -50) return "text-green-500"
    if (rssi > -70) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <Bluetooth className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center mb-2">Connect Your Vehicle</h2>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
        {isSupported
          ? "Make sure your vehicle's Bluetooth is turned on and discoverable"
          : "Bluetooth not supported - using demo mode"}
      </p>

      {/* Permission Check */}
      {!hasPermission && (
        <div className="mb-6">
          <PermissionManager
            showGPS={false}
            showBluetooth={true}
            onPermissionsGranted={() => {
              // Auto-start scan when permission is granted
              setTimeout(() => startScan(), 1000)
            }}
          />
        </div>
      )}

      {/* Bluetooth Status */}
      {!isSupported && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">Demo Mode Active</p>
              <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                Real Bluetooth requires Chrome, Edge, or Opera browser
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Connected Device Info */}
      {isConnected && connectedDevice && carData && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              {getDeviceIcon(connectedDevice.deviceType)}
              <div className="ml-3">
                <h3 className="font-medium text-green-800 dark:text-green-300">{connectedDevice.name}</h3>
                <p className="text-sm text-green-600 dark:text-green-400">Connected • {connectionQuality} signal</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-red-600 dark:text-red-400 text-sm font-medium hover:text-red-700 dark:hover:text-red-300"
            >
              Disconnect
            </button>
          </div>

          {/* Real-time data */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center mb-1">
                <Battery className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Battery</span>
              </div>
              <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {carData.batteryLevel ? Math.round(carData.batteryLevel) : "N/A"}%
              </span>
            </div>

            {carData.fuelLevel && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-1"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Fuel</span>
                </div>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {Math.round(carData.fuelLevel)}%
                </span>
              </div>
            )}

            {carData.speed !== undefined && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 col-span-2">
                <div className="flex items-center mb-1">
                  <Signal className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Speed</span>
                </div>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {Math.round(carData.speed)} km/h
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 text-xs text-green-600 dark:text-green-400">
            Connected at {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Device List */}
      {hasPermission && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Available Devices</h3>
            <button
              className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center"
              onClick={startScan}
              disabled={isScanning || isConnecting}
            >
              <Search className="w-4 h-4 mr-1" />
              {isScanning ? "Scanning..." : "Scan"}
            </button>
          </div>

          {isScanning && devices.length === 0 && (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {isSupported ? "Scanning for Bluetooth devices..." : "Simulating device discovery..."}
              </p>
            </div>
          )}

          {!isScanning && devices.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No devices found</p>
              <button className="mt-2 text-blue-600 dark:text-blue-400 text-sm font-medium" onClick={startScan}>
                Try Again
              </button>
            </div>
          )}

          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`p-3 rounded-lg border flex justify-between items-center ${
                  device.connected
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : selectedDevice === device.id && isConnecting
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                      : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center flex-1">
                  <div className={`mr-3 ${device.connected ? "text-green-500" : "text-gray-500 dark:text-gray-400"}`}>
                    {getDeviceIcon(device.deviceType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium">{device.name}</span>
                      {(device.deviceType === "obd2" || device.deviceType === "car_system") && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                          Vehicle
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      {device.rssi && (
                        <span className={`mr-2 ${getSignalColor(device.rssi)}`}>Signal: {device.rssi}dBm</span>
                      )}
                      {device.lastSeen && <span>Last seen: {device.lastSeen.toLocaleTimeString()}</span>}
                    </div>
                  </div>
                </div>

                {device.connected ? (
                  <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                    <Check className="w-4 h-4 mr-1" />
                    Connected
                  </div>
                ) : selectedDevice === device.id && isConnecting ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <button
                    className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
                    onClick={() => handleConnect(device.id)}
                    disabled={isConnecting}
                  >
                    Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
          onClick={() => onConnect(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default BluetoothConnect
