"use client"

import { useState } from "react"
import { DollarSign, Filter } from "lucide-react"
import MapComponent from "./map-component"
import NearbyPlacesList from "./nearby-places-list"
import type { PlaceResult } from "@/utils/map-utils"

const FuelStations = () => {
  const [selectedStation, setSelectedStation] = useState<PlaceResult | null>(null)
  const [fuelType, setFuelType] = useState("Petrol")
  const [showMap, setShowMap] = useState(true)

  // Sample data for demonstration
  const sampleStations: PlaceResult[] = [
    {
      id: "1",
      name: "Indian Oil",
      address: "234 MG Road",
      location: {
        lat: 19.076,
        lng: 72.8777,
      },
      rating: 4.2,
      totalRatings: 120,
      types: ["gas_station"],
      distance: 0.4,
      priceLevel: 2,
      price: 102.5, // Price in INR
    },
    {
      id: "2",
      name: "Bharat Petroleum",
      address: "567 Linking Road",
      location: {
        lat: 19.077,
        lng: 72.8787,
      },
      rating: 4.0,
      totalRatings: 95,
      types: ["gas_station"],
      distance: 0.7,
      priceLevel: 3,
      price: 103.2, // Price in INR
    },
    {
      id: "3",
      name: "Hindustan Petroleum",
      address: "890 Nehru Place",
      location: {
        lat: 19.078,
        lng: 72.8797,
      },
      rating: 4.3,
      totalRatings: 150,
      types: ["gas_station"],
      distance: 0.9,
      priceLevel: 2,
      price: 101.8, // Price in INR
    },
    {
      id: "4",
      name: "Reliance Petroleum",
      address: "432 Connaught Place",
      location: {
        lat: 19.079,
        lng: 72.8807,
      },
      rating: 4.1,
      totalRatings: 110,
      types: ["gas_station"],
      distance: 1.2,
      priceLevel: 3,
      price: 104.5, // Price in INR
    },
  ]

  const handleSelectStation = (station: PlaceResult) => {
    setSelectedStation(station)
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-orange-500" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Petrol Pumps</h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className={`px-3 py-1 rounded-lg text-sm font-medium ${showMap ? "bg-orange-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
            onClick={() => setShowMap(true)}
          >
            Map
          </button>
          <button
            className={`px-3 py-1 rounded-lg text-sm font-medium ${!showMap ? "bg-orange-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
            onClick={() => setShowMap(false)}
          >
            List
          </button>
        </div>
      </div>

      <div className="flex items-center mb-4">
        <Filter className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
        <select
          className="text-sm border-none bg-transparent text-gray-700 dark:text-gray-300"
          value={fuelType}
          onChange={(e) => setFuelType(e.target.value)}
        >
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="CNG">CNG</option>
          <option value="Electric">Electric</option>
        </select>
      </div>

      {showMap ? (
        <MapComponent view="locateFuel" />
      ) : (
        <NearbyPlacesList places={sampleStations} type="fuel" onSelectPlace={handleSelectStation} />
      )}
    </div>
  )
}

export default FuelStations
