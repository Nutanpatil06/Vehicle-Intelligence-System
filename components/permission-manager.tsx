"use client"

import { useState } from "react"
import { MapPin, Bluetooth, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import ResponsiveButton from "@/components/ui/responsive-button"
import usePermissions from "@/hooks/use-permissions"

interface PermissionManagerProps {
  onPermissionsGranted?: () => void
  showGPS?: boolean
  showBluetooth?: boolean
}

const PermissionManager = ({ onPermissionsGranted, showGPS = true, showBluetooth = true }: PermissionManagerProps) => {
  const { gps, bluetooth, requestGPSPermission, requestBluetoothPermission } = usePermissions()
  const [isRequesting, setIsRequesting] = useState(false)

  const handleRequestGPS = async () => {
    setIsRequesting(true)
    try {
      const granted = await requestGPSPermission()
      if (granted && onPermissionsGranted) {
        onPermissionsGranted()
      }
    } finally {
      setIsRequesting(false)
    }
  }

  const handleRequestBluetooth = async () => {
    setIsRequesting(true)
    try {
      const granted = await requestBluetoothPermission()
      if (granted && onPermissionsGranted) {
        onPermissionsGranted()
      }
    } finally {
      setIsRequesting(false)
    }
  }

  const getPermissionIcon = (granted: boolean, denied: boolean, loading: boolean) => {
    if (loading)
      return <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    if (granted) return <CheckCircle className="w-5 h-5 text-green-500" />
    if (denied) return <XCircle className="w-5 h-5 text-red-500" />
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />
  }

  const getPermissionStatus = (granted: boolean, denied: boolean, loading: boolean) => {
    if (loading) return "Requesting..."
    if (granted) return "Granted"
    if (denied) return "Denied"
    return "Required"
  }

  const getPermissionColor = (granted: boolean, denied: boolean) => {
    if (granted) return "text-green-600 dark:text-green-400"
    if (denied) return "text-red-600 dark:text-red-400"
    return "text-yellow-600 dark:text-yellow-400"
  }

  const allPermissionsGranted = (!showGPS || gps.granted) && (!showBluetooth || bluetooth.granted)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
      <div className="flex items-center mb-4">
        <Shield className="w-6 h-6 text-orange-500 mr-3" />
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Permissions Required</h3>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        To provide the best vehicle intelligence experience, we need access to your device's location and Bluetooth.
      </p>

      <div className="space-y-4">
        {/* GPS Permission */}
        {showGPS && (
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-blue-500 mr-3" />
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Location Access</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Required for real-time GPS tracking and navigation
                </p>
              </div>
            </div>
            <div className="flex items-center">
              {getPermissionIcon(gps.granted, gps.denied, gps.loading || isRequesting)}
              <span className={`ml-2 text-sm font-medium ${getPermissionColor(gps.granted, gps.denied)}`}>
                {getPermissionStatus(gps.granted, gps.denied, gps.loading || isRequesting)}
              </span>
            </div>
          </div>
        )}

        {/* Bluetooth Permission */}
        {showBluetooth && (
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center">
              <Bluetooth className="w-5 h-5 text-blue-500 mr-3" />
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Bluetooth Access</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Required for connecting to your car's OBD-II or Bluetooth system
                </p>
              </div>
            </div>
            <div className="flex items-center">
              {getPermissionIcon(bluetooth.granted, bluetooth.denied, bluetooth.loading || isRequesting)}
              <span className={`ml-2 text-sm font-medium ${getPermissionColor(bluetooth.granted, bluetooth.denied)}`}>
                {getPermissionStatus(bluetooth.granted, bluetooth.denied, bluetooth.loading || isRequesting)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {gps.error && showGPS && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{gps.error}</p>
        </div>
      )}

      {bluetooth.error && showBluetooth && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{bluetooth.error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        {showGPS && !gps.granted && (
          <ResponsiveButton
            variant="primary"
            fullWidth
            onClick={handleRequestGPS}
            disabled={isRequesting || gps.loading}
            icon={<MapPin className="w-4 h-4" />}
          >
            {gps.loading || isRequesting ? "Requesting GPS Access..." : "Enable GPS Access"}
          </ResponsiveButton>
        )}

        {showBluetooth && !bluetooth.granted && (
          <ResponsiveButton
            variant="primary"
            fullWidth
            onClick={handleRequestBluetooth}
            disabled={isRequesting || bluetooth.loading}
            icon={<Bluetooth className="w-4 h-4" />}
          >
            {bluetooth.loading || isRequesting ? "Requesting Bluetooth Access..." : "Enable Bluetooth Access"}
          </ResponsiveButton>
        )}

        {allPermissionsGranted && (
          <div className="flex items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700 dark:text-green-300 font-medium">All permissions granted!</span>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Need Help?</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• Make sure your browser supports these features (Chrome, Edge, Opera recommended)</li>
          <li>• For GPS: Enable location services in your device settings</li>
          <li>• For Bluetooth: Ensure Bluetooth is enabled and your car device is discoverable</li>
          <li>• If permissions are denied, you may need to reset them in browser settings</li>
        </ul>
      </div>
    </div>
  )
}

export default PermissionManager
