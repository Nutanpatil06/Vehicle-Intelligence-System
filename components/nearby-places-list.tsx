"use client"

import { useState } from "react"
import { MapPin, Star, Navigation, Clock, DollarSign, Phone, Globe } from "lucide-react"
import { type PlaceResult, formatDistance, formatRating, formatPriceLevel, formatPrice } from "@/utils/map-utils"

interface NearbyPlacesListProps {
  places: PlaceResult[]
  type: "parking" | "fuel" | "restaurant" | "hotel" | "shopping"
  onSelectPlace: (place: PlaceResult) => void
}

const NearbyPlacesList = ({ places, type, onSelectPlace }: NearbyPlacesListProps) => {
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "price">("distance")

  // Sort places
  const sortedPlaces = [...places].sort((a, b) => {
    if (sortBy === "distance") {
      return (a.distance || 999) - (b.distance || 999)
    } else if (sortBy === "rating") {
      return (b.rating || 0) - (a.rating || 0)
    } else {
      return (a.price || 0) - (b.price || 0)
    }
  })

  // Get type label
  const getTypeLabel = () => {
    switch (type) {
      case "parking":
        return "Parking Spots"
      case "fuel":
        return "Petrol Pumps"
      case "restaurant":
        return "Restaurants"
      case "hotel":
        return "Hotels"
      case "shopping":
        return "Shopping"
      default:
        return "Places"
    }
  }

  // Get icon for place type
  const getTypeIcon = () => {
    switch (type) {
      case "parking":
        return <MapPin className="w-5 h-5 text-blue-500" />
      case "fuel":
        return <DollarSign className="w-5 h-5 text-orange-500" />
      case "restaurant":
        return <Clock className="w-5 h-5 text-yellow-500" />
      case "hotel":
        return <Globe className="w-5 h-5 text-purple-500" />
      case "shopping":
        return <Globe className="w-5 h-5 text-green-500" />
      default:
        return <MapPin className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="mt-4 animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {getTypeIcon()}
          <h2 className="text-xl font-bold ml-2 text-gray-800 dark:text-gray-200">{getTypeLabel()} Nearby</h2>
        </div>

        <div className="flex items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Sort by:</span>
          <select
            className="text-sm border rounded-md py-1 px-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "distance" | "rating" | "price")}
          >
            <option value="distance">Distance</option>
            <option value="rating">Rating</option>
            {(type === "fuel" || type === "parking") && <option value="price">Price</option>}
          </select>
        </div>
      </div>

      {sortedPlaces.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">No {getTypeLabel().toLowerCase()} found nearby</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedPlaces.map((place) => (
            <div
              key={place.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectPlace(place)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">{place.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{place.address}</p>

                  <div className="flex items-center mt-2 text-sm">
                    <MapPin className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300 mr-3">{formatDistance(place.distance)}</span>

                    {place.rating && (
                      <>
                        <Star className="w-4 h-4 mr-1 text-yellow-500 fill-yellow-500" />
                        <span className="text-gray-700 dark:text-gray-300">{formatRating(place.rating)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded text-orange-800 dark:text-orange-300 text-sm font-medium">
                  {type === "parking"
                    ? place.price
                      ? formatPrice(place.price)
                      : "Available"
                    : type === "fuel"
                      ? place.price
                        ? formatPrice(place.price)
                        : formatPriceLevel(place.priceLevel)
                      : "Open"}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                <button className="flex items-center text-orange-600 dark:text-orange-400 text-sm font-medium">
                  <Navigation className="w-4 h-4 mr-1" />
                  Navigate
                </button>

                {type === "parking" ? (
                  <button className="flex items-center bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
                    Book Now
                  </button>
                ) : (
                  <>
                    <button className="flex items-center text-gray-600 dark:text-gray-400 text-sm font-medium">
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </button>

                    <button className="flex items-center text-gray-600 dark:text-gray-400 text-sm font-medium">
                      <Globe className="w-4 h-4 mr-1" />
                      Website
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NearbyPlacesList
