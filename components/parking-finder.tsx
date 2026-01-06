"use client"

import { useState } from "react"
import { MapPin } from "lucide-react"
import MapComponent from "./map-component"
import NearbyPlacesList from "./nearby-places-list"
import ParkingBooking from "./parking-booking"
import type { PlaceResult } from "@/utils/map-utils"

const ParkingFinder = () => {
  const [showMap, setShowMap] = useState(true)
  const [selectedSpot, setSelectedSpot] = useState<PlaceResult | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedParkingSpot, setSelectedParkingSpot] = useState<any>(null)

  // Sample data for demonstration with Indian context
  const sampleParkingSpots: PlaceResult[] = [
    {
      id: "1",
      name: "City Center Parking",
      address: "123 MG Road",
      location: {
        lat: 19.076,
        lng: 72.8777,
      },
      rating: 4.0,
      totalRatings: 85,
      types: ["parking"],
      distance: 0.3,
      price: 50, // Price in INR per hour
    },
    {
      id: "2",
      name: "Mall Parking",
      address: "456 Linking Road",
      location: {
        lat: 19.077,
        lng: 72.8787,
      },
      rating: 3.8,
      totalRatings: 62,
      types: ["parking"],
      distance: 0.5,
      price: 40, // Price in INR per hour
    },
    {
      id: "3",
      name: "Metro Parking",
      address: "789 Nehru Place",
      location: {
        lat: 19.078,
        lng: 72.8797,
      },
      rating: 4.2,
      totalRatings: 110,
      types: ["parking"],
      distance: 0.7,
      price: 30, // Price in INR per hour
    },
    {
      id: "4",
      name: "Public Parking",
      address: "321 Connaught Place",
      location: {
        lat: 19.079,
        lng: 72.8807,
      },
      rating: 3.9,
      totalRatings: 75,
      types: ["parking"],
      distance: 1.1,
      price: 20, // Price in INR per hour
    },
  ]

  const handleSelectSpot = (spot: PlaceResult) => {
    setSelectedSpot(spot)

    // Prepare parking spot data for booking
    setSelectedParkingSpot({
      id: spot.id,
      name: spot.name,
      address: spot.address,
      price: spot.price || 40, // Default price if not provided
      availableSpots: Math.floor(Math.random() * 10) + 1, // Random available spots
    })

    // Show booking modal
    setShowBookingModal(true)
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Nearby Parking</h2>
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

      {showMap ? (
        <MapComponent view="findParking" />
      ) : (
        <NearbyPlacesList places={sampleParkingSpots} type="parking" onSelectPlace={handleSelectSpot} />
      )}
      {showBookingModal && selectedParkingSpot && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <ParkingBooking
              parkingSpot={selectedParkingSpot}
              onClose={() => setShowBookingModal(false)}
              onBookingComplete={(bookingId) => {
                // Handle booking completion
                setShowBookingModal(false)
                // You could show a success message or redirect
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ParkingFinder
