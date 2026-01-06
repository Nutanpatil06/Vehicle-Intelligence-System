"use client"

import { useMemo, useCallback } from "react"

interface Place {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  type: string
  category: string
  rating?: number
  tags: string[]
}

interface SearchEngineProps {
  currentLocation: { lat: number; lng: number }
}

// Simple search without complex dependencies
const useSearchEngine = ({ currentLocation }: SearchEngineProps) => {
  // Generate static places - only recreate if location changes significantly (rounded to avoid constant changes)
  const placesDatabase = useMemo(() => {
    const places: Place[] = []

    // Use stable coordinates to prevent constant regeneration
    const baseLat = Math.round(currentLocation.lat * 10) / 10
    const baseLng = Math.round(currentLocation.lng * 10) / 10

    // Generate parking spots
    for (let i = 0; i < 10; i++) {
      places.push({
        id: `parking-${i}`,
        name: `Parking Spot ${i + 1}`,
        address: `${100 + i} Main Street`,
        lat: baseLat + (i - 5) * 0.01,
        lng: baseLng + (i - 5) * 0.01,
        type: "parking",
        category: "parking",
        rating: 4.0 + Math.random(),
        tags: ["parking", "car"],
      })
    }

    // Generate gas stations
    for (let i = 0; i < 8; i++) {
      places.push({
        id: `gas-${i}`,
        name: `Gas Station ${i + 1}`,
        address: `${200 + i} Highway Road`,
        lat: baseLat + (i - 4) * 0.015,
        lng: baseLng + (i - 4) * 0.015,
        type: "gas_station",
        category: "fuel",
        rating: 3.5 + Math.random(),
        tags: ["fuel", "gas", "petrol"],
      })
    }

    return places
  }, [Math.round(currentLocation.lat * 10), Math.round(currentLocation.lng * 10)])

  const searchPlaces = useCallback(
    (query: string): Place[] => {
      if (!query.trim()) return []

      return placesDatabase
        .filter(
          (place) =>
            place.name.toLowerCase().includes(query.toLowerCase()) ||
            place.address.toLowerCase().includes(query.toLowerCase()) ||
            place.category.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 10)
    },
    [placesDatabase],
  )

  const searchByCategory = useCallback(
    (category: string): Place[] => {
      return placesDatabase.filter((place) => place.category === category).slice(0, 15)
    },
    [placesDatabase],
  )

  const getNearbyPlaces = useCallback((): Place[] => {
    return placesDatabase.slice(0, 20)
  }, [placesDatabase])

  return {
    searchPlaces,
    searchByCategory,
    getNearbyPlaces,
    placesDatabase,
  }
}

export default useSearchEngine
export type { Place }
