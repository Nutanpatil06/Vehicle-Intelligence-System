"use client"

import { useState } from "react"
import CustomMap from "./custom-map/custom-map"
import type { Place } from "./custom-map/search-engine"

interface MapComponentProps {
  view: string | null
  fullScreen?: boolean
}

const MapComponent = ({ view, fullScreen = false }: MapComponentProps) => {
  const [selectedLocation, setSelectedLocation] = useState<Place | null>(null)
  const [routeInfo, setRouteInfo] = useState<{
    distance: number
    duration: { text: string }
  } | null>(null)

  const handleSelectLocation = (location: any) => {
    setSelectedLocation(location)

    // Calculate ETA based on distance
    if (location.distance) {
      const avgSpeed = 30 // km/h average speed in Indian cities
      const durationHours = location.distance / avgSpeed
      const durationMinutes = Math.round(durationHours * 60)

      let durationText = ""
      if (durationMinutes < 1) {
        durationText = "Less than a minute"
      } else if (durationMinutes === 1) {
        durationText = "1 minute"
      } else if (durationMinutes < 60) {
        durationText = `${durationMinutes} minutes`
      } else {
        const hours = Math.floor(durationHours)
        const minutes = Math.round((durationHours - hours) * 60)
        durationText = `${hours} hour${hours > 1 ? "s" : ""}${minutes > 0 ? ` ${minutes} min` : ""}`
      }

      setRouteInfo({
        distance: location.distance,
        duration: { text: durationText },
      })
    }
  }

  return (
    <div className="animate-fadeIn">
      <CustomMap view={view} fullScreen={fullScreen} onSelectLocation={handleSelectLocation} />

      {selectedLocation && routeInfo && (
        <div className="mt-3 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Route Information</h3>
          <div className="flex justify-between text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Distance:</span>
              <span className="ml-2 text-gray-800 dark:text-gray-200 font-medium">
                {routeInfo.distance.toFixed(1)} km
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">ETA:</span>
              <span className="ml-2 text-gray-800 dark:text-gray-200 font-medium">{routeInfo.duration.text}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapComponent
