"use client"

import { useState } from "react"
import {
  Bluetooth,
  Search,
  Check,
  AlertTriangle,
  Car,
  Settings,
  Battery,
  Signal,
  Wifi,
  RefreshCw,
  Info,
  X,
} from "lucide-react"
import useUnifiedBluetooth from "@/hooks/use-unified-bluetooth"

interface EnhancedBluetoothConnectProps {
  onConnect: (connected: boolean, deviceInfo?: any) => void
  debugMode?: boolean
}

const EnhancedBluetoothConnect = ({ onConnect, debugMode = false }: EnhancedBluetoothConnectProps) => {
  const {
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
    requestPermission,
    startScan,
    connectToDevice,
    disconnect,
    clearError,
    debugLog,
  } = useUnifiedBluetooth({
    autoConnect: false,
    enableRealTimeData: true,
    dataUpdateInterval: 2000,
    reconnectAttempts: 3,
    debugMode,
  })

  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [showDebugInfo, setShowDebugInfo] = useState(debugMode)

  // Handle connection
  const handleConnect = async (deviceId: string) => {
    setSelectedDevice(deviceId)
    const success = await connectToDevice(deviceId)

    if (success && connectedDevice) {
      onConnect(true, {
        device: connectedDevice,
        carData,
        connectionTime: new Date(),
        connectionQuality,
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
        return <Car className="w-5 h-5 text-blue-600" />
      case "car_system":
        return <Car className="w-5 h-5 text-green-600" />
      case "aftermarket":
        return <Settings className="w-5 h-5 text-purple-600" />
      case "phone":
        return <Wifi className="w-5 h-5 text-gray-600" />
      case "headset":
        return <Signal className="w-5 h-5 text-orange-600" />
      default:
        return <Bluetooth className="w-5 h-5 text-gray-600" />
    }
  }

  // Get device type label
  const getDeviceTypeLabel = (deviceType: string) => {
    switch (deviceType) {
      case "obd2":
        return "OBD-II"
      case "car_system":
        return "Car System"
      case "aftermarket":
        return "Aftermarket"
      case "phone":
        return "Phone"
      case "headset":
        return "Headset"
      default:
        return "Unknown"
    }
  }

  // Get connection quality color
  const getConnectionQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "text-green-500"
      case "good":
        return "text-yellow-500"
      case "poor":
        return "text-orange-500"
      default:
        return "text-red-500"
    }
  }

  return (
    <div className="py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <Bluetooth className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center mb-2">Connect Your Vehicle</h2>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
        {isSupported
          ? "Connect to your car's OBD-II port or Bluetooth system for real-time data"
          : "Bluetooth not supported - Demo mode will be used"}
      </p>

      {/* Debug Toggle */}
      {debugMode && (
        <div className="mb-4 flex justify-center">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="text-sm text-blue-600 dark:text-blue-400 flex items-center"
          >
            <Info className="w-4 h-4 mr-1" />
            {showDebugInfo ? "Hide" : "Show"} Debug Info
          </button>
        </div>
      )}

      {/* Browser Support Warning */}
      {!isSupported && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">Web Bluetooth Not Supported</h3>
              <p className="text-yellow-700 dark:text-yellow-400 text-sm mb-2">
                Your browser doesn't support Web Bluetooth. For real Bluetooth connectivity, please use:
              </p>
              <ul className="text-yellow-600 dark:text-yellow-400 text-sm space-y-1">
                <li>• Google Chrome (recommended)</li>
                <li>• Microsoft Edge</li>
                <li>• Opera</li>
              </ul>
              <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-2">
                Demo mode will simulate car data for testing purposes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Permission Status */}
      {isSupported && !permission.granted && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bluetooth className="w-5 h-5 text-blue-500 mr-3" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-300">Bluetooth Permission Required</h3>
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  Grant permission to discover and connect to Bluetooth devices
                </p>
              </div>
            </div>
            <button
              onClick={requestPermission}
              disabled={permission.loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {permission.loading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Bluetooth className="w-4 h-4 mr-1" />
              )}
              {permission.loading ? "Requesting..." : "Grant Permission"}
            </button>
          </div>
        </div>
      )}

      {/* Permission Error */}
      {permission.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-red-800 dark:text-red-300 mb-1">Permission Error</h3>
              <p className="text-red-700 dark:text-red-400 text-sm">{permission.error}</p>
            </div>
            <button onClick={() => clearError()} className="text-red-500 hover:text-red-700 dark:hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* General Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
            <button onClick={clearError} className="text-red-500 hover:text-red-700 dark:hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Connected Device Info */}
      {isConnected && connectedDevice && carData && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {getDeviceIcon(connectedDevice.deviceType)}
              <div className="ml-3">
                <h3 className="font-medium text-green-800 dark:text-green-300">{connectedDevice.name}</h3>
                <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <span>Connected</span>
                  <span className="mx-2">•</span>
                  <span className={getConnectionQualityColor(connectionQuality)}>{connectionQuality} signal</span>
                  <span className="mx-2">•</span>
                  <span>{getDeviceTypeLabel(connectedDevice.deviceType)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-3 py-1 text-red-600 dark:text-red-400 text-sm font-medium hover:text-red-700 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded"
            >
              Disconnect
            </button>
          </div>

          {/* Real-time data display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center mb-1">
                <Battery className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Battery</span>
              </div>
              <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {carData.batteryLevel ? Math.round(carData.batteryLevel) : "N/A"}%
              </span>
            </div>

            {carData.fuelLevel && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-1"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Fuel</span>
                </div>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {Math.round(carData.fuelLevel)}%
                </span>
              </div>
            )}

            {carData.speed !== undefined && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <Signal className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Speed</span>
                </div>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {Math.round(carData.speed)} km/h
                </span>
              </div>
            )}

            {carData.engineTemp && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-1"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Engine</span>
                </div>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {Math.round(carData.engineTemp)}°C
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 text-xs text-green-600 dark:text-green-400">
            Connected at {carData.connectionTime?.toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Device Discovery */}
      {(permission.granted || !isSupported) && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Available Devices</h3>
            <button
              className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
              onClick={startScan}
              disabled={isScanning || isConnecting}
            >
              {isScanning ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
              {isScanning ? "Scanning..." : "Scan for Devices"}
            </button>
          </div>

          {/* Scanning State */}
          {isScanning && devices.length === 0 && (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                {isSupported ? "Scanning for Bluetooth devices..." : "Simulating device discovery..."}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Make sure your device is discoverable</p>
            </div>
          )}

          {/* No Devices Found */}
          {!isScanning && devices.length === 0 && (
            <div className="py-8 text-center">
              <Bluetooth className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No devices found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
                Make sure your car's Bluetooth is on and discoverable
              </p>
              <button
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
                onClick={startScan}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Device List */}
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`p-4 rounded-lg border transition-colors ${
                  device.connected
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : selectedDevice === device.id && isConnecting
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center flex-1">
                    <div className={`mr-3 ${device.connected ? "text-green-500" : "text-gray-500 dark:text-gray-400"}`}>
                      {getDeviceIcon(device.deviceType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{device.name}</span>
                        <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                          {getDeviceTypeLabel(device.deviceType)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span>Last seen: {device.lastSeen.toLocaleTimeString()}</span>
                        {device.services.length > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{device.services.length} services</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Connection Status/Button */}
                  {device.connected ? (
                    <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                      <Check className="w-4 h-4 mr-1" />
                      Connected
                    </div>
                  ) : selectedDevice === device.id && isConnecting ? (
                    <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm">
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      Connecting...
                    </div>
                  ) : (
                    <button
                      className="px-3 py-1 text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded disabled:opacity-50"
                      onClick={() => handleConnect(device.id)}
                      disabled={isConnecting}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Information */}
      {showDebugInfo && (
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 mb-6 font-mono text-sm">
          <h4 className="text-white font-bold mb-2">Debug Information</h4>
          <div className="space-y-1">
            <div>Bluetooth Supported: {isSupported ? "✓" : "✗"}</div>
            <div>Permission Granted: {permission.granted ? "✓" : "✗"}</div>
            <div>Is Scanning: {isScanning ? "✓" : "✗"}</div>
            <div>Is Connecting: {isConnecting ? "✓" : "✗"}</div>
            <div>Is Connected: {isConnected ? "✓" : "✗"}</div>
            <div>Devices Found: {devices.length}</div>
            <div>Connection Quality: {connectionQuality}</div>
            {connectedDevice && (
              <div>
                Connected Device: {connectedDevice.name} ({connectedDevice.deviceType})
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Connection Tips</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• Make sure your car's Bluetooth is turned on and discoverable</li>
          <li>• For OBD-II adapters, plug them into your car's diagnostic port</li>
          <li>• Some devices may require pairing in your phone's Bluetooth settings first</li>
          <li>• If connection fails, try turning Bluetooth off and on again</li>
          <li>• Ensure you're using a supported browser (Chrome, Edge, Opera)</li>
        </ul>
      </div>

      {/* Cancel Button */}
      <div className="mt-6">
        <button
          className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          onClick={() => onConnect(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default EnhancedBluetoothConnect
