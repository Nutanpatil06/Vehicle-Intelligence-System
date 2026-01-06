// Types for nearby search results
export interface PlaceResult {
  place_id: string
  name: string
  vicinity: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  rating?: number
  user_ratings_total?: number
  opening_hours?: {
    open_now: boolean
  }
  price_level?: number
  types: string[]
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  distance?: number // We'll calculate this
}

// Function to get nearby places
import { generateNearbyPlaces } from "./map-utils"

export async function getNearbyPlaces(
  location: { lat: number; lng: number },
  type: string,
  radius = 5000,
): Promise<PlaceResult[]> {
  try {
    // Since we're now using our own data generation, we don't need this fetch call
    // Instead, use the generateNearbyPlaces function from map-utils.ts
    const places = generateNearbyPlaces(location, type, 10, radius / 1000)

    return places
  } catch (error) {
    console.error("Error fetching nearby places:", error)
    return []
  }
}

// Calculate distance between two coordinates in kilometers
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km
  return Number.parseFloat(distance.toFixed(1))
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Get place details
export async function getPlaceDetails(placeId: string): Promise<any> {
  try {
    // Removed API key from the fetch URL in getPlaceDetails.
    return null
  } catch (error) {
    console.error("Error fetching place details:", error)
    return null
  }
}

// Get directions between two points
export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<any> {
  try {
    // Removed the API key from the fetch URL in getDirections.
    return null
  } catch (error) {
    console.error("Error fetching directions:", error)
    return null
  }
}

// Get a static map image URL
export function getStaticMapUrl(
  center: { lat: number; lng: number },
  zoom: number,
  width: number,
  height: number,
  markers: Array<{ lat: number; lng: number; label?: string }>,
): string {
  // Removed the API key from the URL in getStaticMapUrl.
  return ""
}

// Get place type icon
export function getPlaceTypeIcon(type: string): string {
  switch (type) {
    case "gas_station":
      return "fuel"
    case "parking":
      return "parking"
    case "restaurant":
      return "restaurant"
    case "shopping_mall":
      return "shopping"
    case "lodging":
      return "hotel"
    default:
      return "location"
  }
}

// Format price level
export function formatPriceLevel(priceLevel?: number): string {
  if (priceLevel === undefined) return "N/A"
  return "$".repeat(priceLevel)
}

// Format distance
export function formatDistance(distance?: number): string {
  if (distance === undefined) return ""
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)} m`
  }
  return `${distance.toFixed(1)} km`
}

// Format rating
export function formatRating(rating?: number): string {
  if (rating === undefined) return "No ratings"
  return `${rating.toFixed(1)}/5.0`
}
