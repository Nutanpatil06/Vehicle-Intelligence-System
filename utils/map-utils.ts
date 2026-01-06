export interface PlaceResult {
  id: string
  name: string
  address: string
  location: {
    lat: number
    lng: number
  }
  rating?: number
  totalRatings?: number
  openNow?: boolean
  priceLevel?: number
  types: string[]
  distance?: number
  icon?: string
  price?: number // Price in INR
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface RouteStep {
  instruction: string
  distance: {
    text: string
    value: number
  }
  duration: {
    text: string
    value: number
  }
  start_location: {
    lat: number
    lng: number
  }
  end_location: {
    lat: number
    lng: number
  }
}

export interface Route {
  legs: Array<{
    steps: RouteStep[]
    distance: {
      text: string
      value: number
    }
    duration: {
      text: string
      value: number
    }
    start_address: string
    end_address: string
  }>
  overview_polyline: {
    points: string
  }
  bounds: MapBounds
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

// Format price level
export function formatPriceLevel(priceLevel?: number): string {
  if (priceLevel === undefined) return "N/A"
  return "₹".repeat(priceLevel)
}

// Format price in INR
export function formatPrice(price?: number): string {
  if (price === undefined) return "N/A"
  return `₹${price.toFixed(2)}`
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

// Format duration for display
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Generate nearby places based on location and type
export function generateNearbyPlaces(
  center: { lat: number; lng: number },
  type: string,
  count = 10,
  radius = 5,
): PlaceResult[] {
  const places: PlaceResult[] = []
  const placeTypes =
    type === "parking"
      ? ["parking", "parking_lot", "parking_garage"]
      : type === "gas_station"
        ? ["gas_station", "fuel", "petrol_station"]
        : [type]

  // Indian street names and localities
  const streetNames = [
    "MG Road",
    "Nehru Place",
    "Connaught Place",
    "Chandni Chowk",
    "Linking Road",
    "Brigade Road",
    "Park Street",
    "Commercial Street",
    "Jubilee Hills",
    "Banjara Hills",
  ]

  // Indian business names
  const businessNames =
    type === "parking"
      ? ["City Parking", "Metro Parking", "Mall Parking", "Public Parking", "Smart Park"]
      : type === "gas_station"
        ? ["Indian Oil", "Bharat Petroleum", "Hindustan Petroleum", "Reliance", "Essar", "Shell"]
        : ["Business", "Store", "Shop", "Center", "Place"]

  for (let i = 0; i < count; i++) {
    // Generate a random location within the radius
    const angle = Math.random() * Math.PI * 2
    const distance = Math.sqrt(Math.random()) * radius

    // Convert polar coordinates to Cartesian
    const offsetLat = distance * Math.cos(angle) * 0.009 // Roughly 1km per 0.009 degrees of latitude
    const offsetLng = (distance * Math.sin(angle) * 0.009) / Math.cos(deg2rad(center.lat)) // Adjust for longitude

    const lat = center.lat + offsetLat
    const lng = center.lng + offsetLng

    // Calculate actual distance
    const actualDistance = calculateDistance(center.lat, center.lng, lat, lng)

    // Generate a random business name
    const businessName = businessNames[Math.floor(Math.random() * businessNames.length)]
    const streetNumber = Math.floor(Math.random() * 100) + 1
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)]

    // Generate a random rating
    const rating = 3 + Math.random() * 2 // Between 3 and 5
    const totalRatings = Math.floor(Math.random() * 200) + 10 // Between 10 and 210

    // Generate a random price level (1-4)
    const priceLevel = Math.floor(Math.random() * 4) + 1

    // Generate a random price in INR
    let price: number | undefined
    if (type === "gas_station") {
      // Petrol prices in INR (roughly 90-110 INR per liter)
      price = 90 + Math.random() * 20
    } else if (type === "parking") {
      // Parking prices in INR (roughly 20-100 INR per hour)
      price = 20 + Math.random() * 80
    }

    places.push({
      id: `place-${i}`,
      name: `${businessName} ${i + 1}`,
      address: `${streetNumber} ${streetName}`,
      location: { lat, lng },
      rating: rating,
      totalRatings: totalRatings,
      openNow: Math.random() > 0.2, // 80% chance of being open
      priceLevel: type === "gas_station" || type === "parking" ? priceLevel : undefined,
      types: [placeTypes[Math.floor(Math.random() * placeTypes.length)]],
      distance: actualDistance,
      icon: type === "parking" ? "parking" : type === "gas_station" ? "gas_station" : "place",
      price: price,
    })
  }

  // Sort by distance
  return places.sort((a, b) => (a.distance || 0) - (b.distance || 0))
}

// Generate a route between two points
export function generateRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
): Array<{ lat: number; lng: number }> {
  const route: Array<{ lat: number; lng: number }> = []

  // Add starting point
  route.push({ ...start })

  // Calculate the direct distance
  const directDistance = calculateDistance(start.lat, start.lng, end.lat, end.lng)

  // Determine how many points to add based on distance
  const numPoints = Math.max(2, Math.floor(directDistance * 2))

  // Generate intermediate points with some randomness
  for (let i = 1; i < numPoints; i++) {
    const ratio = i / numPoints

    // Linear interpolation with some random deviation
    const lat = start.lat + (end.lat - start.lat) * ratio + (Math.random() - 0.5) * 0.005
    const lng = start.lng + (end.lng - start.lng) * ratio + (Math.random() - 0.5) * 0.005

    route.push({ lat, lng })
  }

  // Add ending point
  route.push({ ...end })

  return route
}

// Calculate estimated travel time based on distance
export function calculateETA(distanceKm: number): { duration: number; text: string } {
  // Assume average speed of 30 km/h (typical for Indian urban areas)
  const durationHours = distanceKm / 30
  const durationMinutes = Math.round(durationHours * 60)

  let text = ""
  if (durationMinutes < 1) {
    text = "Less than a minute"
  } else if (durationMinutes === 1) {
    text = "1 minute"
  } else if (durationMinutes < 60) {
    text = `${durationMinutes} minutes`
  } else {
    const hours = Math.floor(durationHours)
    const minutes = Math.round((durationHours - hours) * 60)
    text = `${hours} hour${hours > 1 ? "s" : ""}${minutes > 0 ? ` ${minutes} min` : ""}`
  }

  return {
    duration: durationMinutes * 60, // in seconds
    text,
  }
}

// Get marker icon based on place type
export function getMarkerIcon(type: string): string {
  switch (type) {
    case "parking":
      return "P"
    case "gas_station":
      return "G"
    case "restaurant":
      return "R"
    case "lodging":
      return "H"
    case "shopping_mall":
      return "S"
    default:
      return "•"
  }
}

// Get marker color based on place type
export function getMarkerColor(type: string): string {
  switch (type) {
    case "parking":
      return "#3b82f6" // blue-500
    case "gas_station":
      return "#ef4444" // red-500
    case "restaurant":
      return "#f59e0b" // amber-500
    case "lodging":
      return "#8b5cf6" // violet-500
    case "shopping_mall":
      return "#10b981" // emerald-500
    default:
      return "#6b7280" // gray-500
  }
}

// Get map bounds from center point and radius
export function getBoundsFromCenter(lat: number, lng: number, radiusKm: number): MapBounds {
  const latDelta = radiusKm / 111.32 // Approximate km per degree latitude
  const lngDelta = radiusKm / (111.32 * Math.cos(deg2rad(lat))) // Adjust for longitude

  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta,
  }
}

// Check if a point is within bounds
export function isWithinBounds(lat: number, lng: number, bounds: MapBounds): boolean {
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east
}

// Validate coordinates
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

// Decode polyline string (for route display)
export function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte: number

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1
    lat += deltaLat

    shift = 0
    result = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1
    lng += deltaLng

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    })
  }

  return points
}

// Get tile URL for different map providers
export function getTileUrl(x: number, y: number, z: number, mapType: "street" | "satellite" = "street"): string {
  if (mapType === "satellite") {
    return `https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${z}`
  }
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
}

// Get address from coordinates (mock implementation)
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!isValidCoordinate(lat, lng)) {
    throw new Error("Invalid coordinates")
  }

  // Mock implementation - in real app, use Google Maps Geocoding API
  const addresses = [
    "Main Street",
    "Oak Avenue",
    "Park Road",
    "High Street",
    "Church Lane",
    "Mill Road",
    "Station Road",
    "Victoria Street",
  ]

  const randomAddress = addresses[Math.floor(Math.random() * addresses.length)]
  const houseNumber = Math.floor(Math.random() * 999) + 1

  return `${houseNumber} ${randomAddress}`
}

// Generate mock petrol pump data for testing
export function generateMockPetrolPumps(centerLat: number, centerLng: number, count = 10): PlaceResult[] {
  const pumps: PlaceResult[] = []
  const brands = [
    "Shell",
    "BP",
    "Esso",
    "Texaco",
    "Total",
    "Chevron",
    "Mobil",
    "Indian Oil",
    "Bharat Petroleum",
    "Hindustan Petroleum",
  ]

  for (let i = 0; i < count; i++) {
    const offsetLat = (Math.random() - 0.5) * 0.02 // ~1km radius
    const offsetLng = (Math.random() - 0.5) * 0.02
    const lat = centerLat + offsetLat
    const lng = centerLng + offsetLng

    const brand = brands[Math.floor(Math.random() * brands.length)]
    const distance = calculateDistance(centerLat, centerLng, lat, lng)

    pumps.push({
      id: `mock_pump_${i}`,
      name: `${brand} Petrol Station`,
      address: `${Math.floor(Math.random() * 999) + 1} Main Street`,
      location: { lat, lng },
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 - 5.0
      priceLevel: Math.floor(Math.random() * 4) + 1, // 1-4
      distance,
      types: ["gas_station", "establishment"],
      openNow: Math.random() > 0.2, // 80% chance of being open
      price: 90 + Math.random() * 20, // Petrol price in INR
    })
  }

  return pumps.sort((a, b) => (a.distance || 0) - (b.distance || 0))
}
