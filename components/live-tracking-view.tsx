"use client"

import { useState, useEffect } from "react"
import { Clock, Navigation, Gauge, Route, Crosshair } from "lucide-react"
import RealTimeMap from "./real-time-map"
import useEnhancedGPS from "@/hooks/use-enhanced-gps"
import useEnhancedBluetooth from "@/hooks/use-enhanced-bluetooth"

const LiveTrackingView = () => {
  const [tripData, setTripData] = useState({
    startTime: new Date(),
    estimatedArrival: new Date(Date.now() + 15 * 60000), // 15 minutes from now
    distance: {
      traveled: 0,
      remaining: 3.2,
      total: 3.2,
    },
    averageSpeed: 0,
    maxSpeed: 0,
    duration: 0,
  })

  // GPS tracking
  const {
    currentPosition,
    isTracking,
    speed: gpsSpeed,
    heading,
    accuracy,
    totalDistance,
    startTracking,
    stopTracking,
    getLocationHistory,
  } = useEnhancedGPS({
    enableHighAccuracy: true,
    trackingInterval: 1000,
    distanceFilter: 3,
  })

  // Car Bluetooth
  const {
    isConnected: isCarConnected,
    carData,
    connectionQuality,
  } = useEnhancedBluetooth({
    enableRealTimeData: true,
    dataUpdateInterval: 1000,
  })

  // Update trip data based on GPS and car data
  useEffect(() => {
    if (isTracking && currentPosition) {
      const now = new Date()
      const duration = (now.getTime() - tripData.startTime.getTime()) / 1000 // seconds
      const history = getLocationHistory()

      // Calculate average speed
      let averageSpeed = 0
      let maxSpeed = tripData.maxSpeed

      if (duration > 0) {
        averageSpeed = totalDistance / 1000 / (duration / 3600) // km/h
      }

      // Update max speed
      const currentSpeed = carData?.speed || (gpsSpeed ? gpsSpeed * 3.6 : 0) // km/h
      if (currentSpeed > maxSpeed) {
        maxSpeed = currentSpeed
      }

      setTripData((prev) => ({
        ...prev,
        distance: {
          traveled: totalDistance / 1000, // Convert to km
          remaining: Math.max(0, prev.distance.total - totalDistance / 1000),
          total: prev.distance.total,
        },
        averageSpeed,
        maxSpeed,
        duration,
      }))
    }
  }, [isTracking, currentPosition, totalDistance, gpsSpeed, carData, tripData.startTime, getLocationHistory])

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Calculate ETA
  const calculateETA = () => {
    if (tripData.averageSpeed > 0 && tripData.distance.remaining > 0) {
      const remainingHours = tripData.distance.remaining / tripData.averageSpeed
      const etaTime = new Date(Date.now() + remainingHours * 3600 * 1000)
      return formatTime(etaTime)
    }
    return "Calculating..."
  }

  // Calculate progress percentage
  const progressPercentage =
    tripData.distance.total > 0 ? (tripData.distance.traveled / tripData.distance.total) * 100 : 0

  // Handle location updates from map
  const handleLocationUpdate = (locationData: any) => {
    // Additional processing if needed
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Live Trip Tracking</h2>
        <div className="flex items-center space-x-2">
          {isTracking && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm text-green-600 dark:text-green-400">Live</span>
            </div>
          )}
          {isCarConnected && (
            <div className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  connectionQuality === "excellent"
                    ? "bg-green-500"
                    : connectionQuality === "good"
                      ? "bg-yellow-500"
                      : connectionQuality === "poor"
                        ? "bg-orange-500"
                        : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Car</span>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Map */}
      <RealTimeMap view="liveTracking" onLocationUpdate={handleLocationUpdate} />

      {/* Trip Status */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mt-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Started</div>
              <div className="font-medium text-gray-800 dark:text-gray-200">{formatTime(tripData.startTime)}</div>
            </div>
          </div>

          <div className="h-8 border-l border-gray-300 dark:border-gray-600"></div>

          <div className="flex items-center">
            <Navigation className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Duration</div>
              <div className="font-medium text-gray-800 dark:text-gray-200">{formatDuration(tripData.duration)}</div>
            </div>
          </div>

          <div className="h-8 border-l border-gray-300 dark:border-gray-600"></div>

          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">ETA</div>
              <div className="font-medium text-gray-800 dark:text-gray-200">{calculateETA()}</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Progress</span>
            <span className="text-gray-500 dark:text-gray-400">{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="relative pt-1">
            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
              <div
                style={{ width: `${progressPercentage}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
              ></div>
            </div>
            {progressPercentage > 0 && (
              <div
                className="absolute top-0 left-0 transform -translate-y-1/2"
                style={{ left: `${Math.min(progressPercentage, 95)}%` }}
              >
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 shadow"></div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between text-sm mt-3">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Distance traveled</span>
            <div className="font-medium text-gray-800 dark:text-gray-200">
              {tripData.distance.traveled.toFixed(1)} km
            </div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Remaining</span>
            <div className="font-medium text-gray-800 dark:text-gray-200">
              {tripData.distance.remaining.toFixed(1)} km
            </div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total</span>
            <div className="font-medium text-gray-800 dark:text-gray-200">{tripData.distance.total.toFixed(1)} km</div>
          </div>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center mb-1">
            <Gauge className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Current Speed</span>
          </div>
          <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
            {carData?.speed ? Math.round(carData.speed) : gpsSpeed ? Math.round(gpsSpeed * 3.6) : 0} km/h
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center mb-1">
            <Route className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Average Speed</span>
          </div>
          <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
            {tripData.averageSpeed.toFixed(1)} km/h
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center mb-1">
            <Navigation className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Max Speed</span>
          </div>
          <div className="text-xl font-bold text-gray-800 dark:text-gray-200">{tripData.maxSpeed.toFixed(1)} km/h</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center mb-1">
            <Crosshair className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">GPS Accuracy</span>
          </div>
          <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
            {accuracy ? `±${Math.round(accuracy)}m` : "N/A"}
          </div>
        </div>
      </div>

      {/* Car Data Panel */}
      {isCarConnected && carData && (
        <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center">
            <Gauge className="w-5 h-5 mr-2 text-orange-500" />
            Live Vehicle Data
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Engine RPM</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {carData.rpm ? Math.round(carData.rpm) : "N/A"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Fuel Level</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {carData.fuelLevel ? Math.round(carData.fuelLevel) : "N/A"}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Engine Temp</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {carData.engineTemp ? Math.round(carData.engineTemp) : "N/A"}°C
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Battery</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {carData.batteryVoltage ? carData.batteryVoltage.toFixed(1) : "N/A"}V
              </div>
            </div>
          </div>

          {/* Additional car metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Throttle</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {carData.throttlePosition ? Math.round(carData.throttlePosition) : "N/A"}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Engine Load</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {carData.engineLoad ? Math.round(carData.engineLoad) : "N/A"}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Fuel Economy</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {carData.mpg ? carData.mpg.toFixed(1) : "N/A"} MPG
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="mt-4 flex space-x-3">
        <button
          onClick={isTracking ? stopTracking : startTracking}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            isTracking ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {isTracking ? "Stop Tracking" : "Start Tracking"}
        </button>

        {isTracking && (
          <button
            onClick={() => {
              // Reset trip data
              setTripData((prev) => ({
                ...prev,
                startTime: new Date(),
                distance: { traveled: 0, remaining: prev.distance.total, total: prev.distance.total },
                averageSpeed: 0,
                maxSpeed: 0,
                duration: 0,
              }))
            }}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            Reset Trip
          </button>
        )}
      </div>

      {/* Trip Summary */}
      {tripData.duration > 60 && (
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Trip Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-blue-600 dark:text-blue-400">Duration:</span>
              <div className="font-medium">{formatDuration(tripData.duration)}</div>
            </div>
            <div>
              <span className="text-blue-600 dark:text-blue-400">Distance:</span>
              <div className="font-medium">{tripData.distance.traveled.toFixed(1)} km</div>
            </div>
            <div>
              <span className="text-blue-600 dark:text-blue-400">Avg Speed:</span>
              <div className="font-medium">{tripData.averageSpeed.toFixed(1)} km/h</div>
            </div>
            <div>
              <span className="text-blue-600 dark:text-blue-400">Max Speed:</span>
              <div className="font-medium">{tripData.maxSpeed.toFixed(1)} km/h</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveTrackingView
