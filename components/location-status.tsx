"use client"

import { MapPin, Navigation, Clock, Wifi } from "lucide-react"

interface LocationStatusProps {
  currentPosition: any
  accuracy: number | null
  isTracking: boolean
  speed: number | null
  heading: number | null
  isCarConnected: boolean
  connectionQuality: string | null
}

const LocationStatus = ({
  currentPosition,
  accuracy,
  isTracking,
  speed,
  heading,
  isCarConnected,
  connectionQuality,
}: LocationStatusProps) => {
  const formatCoordinate = (coord: number, type: "lat" | "lng") => {
    const direction = type === "lat" ? (coord >= 0 ? "N" : "S") : coord >= 0 ? "E" : "W"
    return `${Math.abs(coord).toFixed(6)}° ${direction}`
  }

  const getAccuracyColor = (acc: number | null) => {
    if (!acc) return "text-gray-500"
    if (acc <= 5) return "text-green-500"
    if (acc <= 10) return "text-yellow-500"
    if (acc <= 20) return "text-orange-500"
    return "text-red-500"
  }

  const getConnectionColor = (quality: string | null) => {
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

  if (!currentPosition) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
          <MapPin className="w-5 h-5 mr-2" />
          <span>No location data available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center">
        <MapPin className="w-5 h-5 text-blue-500 mr-2" />
        Current Location
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Latitude:</span>
              <span className="text-sm font-mono text-gray-800 dark:text-gray-200">
                {formatCoordinate(currentPosition.lat, "lat")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Longitude:</span>
              <span className="text-sm font-mono text-gray-800 dark:text-gray-200">
                {formatCoordinate(currentPosition.lng, "lng")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Accuracy:</span>
              <span className={`text-sm font-medium ${getAccuracyColor(accuracy)}`}>
                {accuracy ? `±${Math.round(accuracy)}m` : "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Speed:</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {speed ? `${Math.round(speed * 3.6)} km/h` : "0 km/h"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Heading:</span>
              <div className="flex items-center">
                {heading !== null && (
                  <Navigation className="w-4 h-4 text-orange-500 mr-1" style={{ transform: `rotate(${heading}deg)` }} />
                )}
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {heading !== null ? `${Math.round(heading)}°` : "N/A"}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              <div className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${isTracking ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {isTracking ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isCarConnected && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wifi className={`w-4 h-4 mr-2 ${getConnectionColor(connectionQuality)}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">Car Connection:</span>
            </div>
            <span className={`text-sm font-medium ${getConnectionColor(connectionQuality)}`}>
              {connectionQuality ? connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1) : "Unknown"}
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Last Update:</span>
          </div>
          <span className="text-sm text-gray-800 dark:text-gray-200">
            {new Date(currentPosition.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  )
}

export default LocationStatus
