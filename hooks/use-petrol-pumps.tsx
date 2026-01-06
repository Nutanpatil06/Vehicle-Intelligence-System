"use client"

import { useState, useEffect, useCallback } from "react"
import type { PlaceResult } from "@/utils/map-utils"
import { calculateDistance, generateMockPetrolPumps } from "@/utils/map-utils"

interface UsePetrolPumpsOptions {
  radius?: number // Search radius in kilometers
  maxResults?: number
  enableMockData?: boolean
}

interface UsePetrolPumpsReturn {
  petrolPumps: PlaceResult[]
  selectedPump: PlaceResult | null
  isLoading: boolean
  error: string | null
  selectPump: (pump: PlaceResult | null) => void
  refreshPumps: () => void
  nearbyCount: number
}

export const usePetrolPumps = (
  currentPosition: { lat: number; lng: number } | null,
  enabled = true,
  options: UsePetrolPumpsOptions = {},
): UsePetrolPumpsReturn => {
  const { radius = 5, maxResults = 20, enableMockData = true } = options

  const [petrolPumps, setPetrolPumps] = useState<PlaceResult[]>([])
  const [selectedPump, setSelectedPump] = useState<PlaceResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search for petrol pumps near current location
  const searchPetrolPumps = useCallback(async () => {
    if (!currentPosition || !enabled) {
      setPetrolPumps([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let pumps: PlaceResult[] = []

      if (enableMockData) {
        // Use mock data for development/testing
        pumps = generateMockPetrolPumps(currentPosition.lat, currentPosition.lng, maxResults)
      } else {
        // In a real implementation, you would use Google Places API or similar
        // const response = await fetch(`/api/places/nearby?lat=${currentPosition.lat}&lng=${currentPosition.lng}&type=gas_station&radius=${radius * 1000}`)
        // const data = await response.json()
        // pumps = data.results || []

        // For now, fallback to mock data
        pumps = generateMockPetrolPumps(currentPosition.lat, currentPosition.lng, maxResults)
      }

      // Calculate distances and sort by proximity
      const pumpsWithDistance = pumps
        .map((pump) => {
          if (!pump.geometry?.location) {
            return pump
          }

          const distance = calculateDistance(
            currentPosition.lat,
            currentPosition.lng,
            pump.geometry.location.lat,
            pump.geometry.location.lng,
          )

          return {
            ...pump,
            distance,
          }
        })
        .filter((pump) => {
          // Filter out pumps without valid location data
          return pump.geometry?.location?.lat && pump.geometry?.location?.lng
        })
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))

      // Limit results
      const limitedPumps = pumpsWithDistance.slice(0, maxResults)

      setPetrolPumps(limitedPumps)
    } catch (err) {
      console.error("Error fetching petrol pumps:", err)
      setError("Failed to load petrol stations. Please try again.")

      // Fallback to mock data on error
      if (enableMockData) {
        try {
          const mockPumps = generateMockPetrolPumps(currentPosition.lat, currentPosition.lng, Math.min(maxResults, 5))
          setPetrolPumps(mockPumps)
          setError(null)
        } catch (mockError) {
          console.error("Error generating mock data:", mockError)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [currentPosition, enabled, radius, maxResults, enableMockData])

  // Refresh pumps when position changes
  useEffect(() => {
    if (currentPosition && enabled) {
      searchPetrolPumps()
    } else {
      setPetrolPumps([])
      setSelectedPump(null)
    }
  }, [currentPosition, enabled, searchPetrolPumps])

  // Select a pump
  const selectPump = useCallback((pump: PlaceResult | null) => {
    setSelectedPump(pump)
  }, [])

  // Refresh pumps manually
  const refreshPumps = useCallback(() => {
    searchPetrolPumps()
  }, [searchPetrolPumps])

  // Count nearby pumps (within 2km)
  const nearbyCount = petrolPumps.filter((pump) => (pump.distance || 0) <= 2).length

  return {
    petrolPumps,
    selectedPump,
    isLoading,
    error,
    selectPump,
    refreshPumps,
    nearbyCount,
  }
}

export default usePetrolPumps
