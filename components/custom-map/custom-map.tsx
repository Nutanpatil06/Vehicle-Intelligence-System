"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Locate, Plus, Minus, Navigation, X, MapPin, Crosshair, StopCircle } from "lucide-react"
import { useTheme } from "@/context/theme-context"
import { useMediaQuery } from "@/hooks/use-media-query"
import MapEngine from "./map-engine"
import useSearchEngine, { type Place } from "./search-engine"

interface CustomMapProps {
  view: string | null
  fullScreen?: boolean
  onSelectLocation?: (location: any) => void
}

const CustomMap = ({ view, fullScreen = false, onSelectLocation }: CustomMapProps) => {
  const { theme } = useTheme()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const mapRef = useRef<HTMLCanvasElement>(null)
  const initialRenderRef = useRef(true)
  const watchIdRef = useRef<number | null>(null)

  // Map state
  const [mapSize, setMapSize] = useState({ width: 800, height: 400 })
  const [currentLocation, setCurrentLocation] = useState({ lat: 19.076, lng: 72.8777 })
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [zoom, setZoom] = useState(14)
  const [markers, setMarkers] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])

  // GPS tracking state
  const [isTracking, setIsTracking] = useState(false)
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Place[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)

  // UI state
  const [showControls, setShowControls] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize search engine
  const searchEngine = useSearchEngine({
    currentLocation: userLocation || currentLocation,
  })

  // Update map size based on container
  useEffect(() => {
    const updateMapSize = () => {
      const container = mapRef.current?.parentElement
      if (container) {
        const rect = container.getBoundingClientRect()
        setMapSize({
          width: rect.width,
          height: fullScreen ? window.innerHeight - 200 : isMobile ? 320 : 400,
        })
      }
    }

    updateMapSize()
    window.addEventListener("resize", updateMapSize)
    return () => window.removeEventListener("resize", updateMapSize)
  }, [fullScreen, isMobile])

  // Get initial user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setCurrentLocation(newLocation)
          setUserLocation(newLocation)
          setLocationAccuracy(position.coords.accuracy)
        },
        (error) => {
          console.warn("Geolocation error:", error)
          setLocationError(error.message)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        },
      )
    }
  }, [])

  // Start GPS tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser")
      return
    }

    setIsTracking(true)
    setLocationError(null)

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(newLocation)
        setCurrentLocation(newLocation)
        setLocationAccuracy(position.coords.accuracy)
      },
      (error) => {
        console.error("GPS tracking error:", error)
        setLocationError(error.message)
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000, // Update every second
      },
    )

    watchIdRef.current = watchId
  }, [])

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
    setLocationError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // Load places based on view
  useEffect(() => {
    if (!view || !initialRenderRef.current) return
    initialRenderRef.current = false

    let category = ""
    switch (view) {
      case "findParking":
        category = "parking"
        break
      case "locateFuel":
        category = "fuel"
        break
      default:
        category = "fuel"
    }

    const places = searchEngine.searchByCategory(category)
    const newMarkers = places.map((place) => ({
      id: place.id,
      lat: place.lat,
      lng: place.lng,
      type: place.type,
      title: place.name,
    }))

    setMarkers(newMarkers)
    setIsLoading(false)
  }, [view])

  // Pan to location
  const panToLocation = useCallback((lat: number, lng: number) => {
    if (mapRef.current && (mapRef.current as any).panTo) {
      ;(mapRef.current as any).panTo(lat, lng)
    }
  }, [])

  // Handle search
  const handleSearchQuery = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        setShowResults(false)
        return
      }

      setIsSearching(true)
      setShowResults(true)

      setTimeout(() => {
        const results = searchEngine.searchPlaces(query)
        setSearchResults(results)
        setIsSearching(false)
      }, 300)
    },
    [searchEngine],
  )

  // Handle place selection
  const handlePlaceSelect = useCallback(
    (place: Place) => {
      setSelectedPlace(place)
      setSearchQuery("")
      setShowResults(false)
      panToLocation(place.lat, place.lng)

      // Generate route if needed
      if (view === "liveTracking" || selectedPlace) {
        const routePoints = generateRoute(userLocation || currentLocation, { lat: place.lat, lng: place.lng })
        setRoutes([
          {
            points: routePoints,
            color: "#f97316",
            width: isMobile ? 3 : 4,
          },
        ])
      }

      // Notify parent component
      if (onSelectLocation) {
        onSelectLocation({
          ...place,
          distance: calculateDistance(
            (userLocation || currentLocation).lat,
            (userLocation || currentLocation).lng,
            place.lat,
            place.lng,
          ),
        })
      }
    },
    [userLocation, currentLocation, view, selectedPlace, onSelectLocation, isMobile, panToLocation],
  )

  // Generate simple route
  const generateRoute = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    const points = []
    const steps = 10

    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps
      const lat = start.lat + (end.lat - start.lat) * ratio + (Math.random() - 0.5) * 0.002
      const lng = start.lng + (end.lng - start.lng) * ratio + (Math.random() - 0.5) * 0.002
      points.push({ lat, lng })
    }

    return points
  }

  // Calculate distance
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Handle marker click
  const handleMarkerClick = useCallback(
    (marker: any) => {
      const place = searchEngine.placesDatabase.find((p) => p.id === marker.id)
      if (place) {
        handlePlaceSelect(place)
      }
    },
    [searchEngine.placesDatabase, handlePlaceSelect],
  )

  // Handle locate me
  const handleLocateMe = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setCurrentLocation(newLocation)
          setUserLocation(newLocation)
          panToLocation(newLocation.lat, newLocation.lng)
          setLocationAccuracy(position.coords.accuracy)
        },
        (error) => {
          console.error("Geolocation error:", error)
          setLocationError(error.message)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      )
    }
  }, [panToLocation])

  return (
    <div className="relative">
      <div
        className={`${fullScreen ? "h-[calc(100vh-200px)]" : isMobile ? "h-80" : "h-96"} bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg`}
      >
        {/* Search bar */}
        <div className={`absolute top-3 left-3 right-3 z-[1000] ${isMobile ? "top-2 left-2 right-2" : ""}`}>
          <div className="relative">
            <input
              type="text"
              className={`w-full pl-10 pr-10 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 dark:text-gray-200 ${isMobile ? "text-sm py-2" : ""}`}
              placeholder={`Search for ${view === "findParking" ? "parking" : view === "locateFuel" ? "petrol pumps" : "places"}...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                handleSearchQuery(e.target.value)
              }}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-gray-400`} />
            </div>
            {searchQuery && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => {
                  setSearchQuery("")
                  setShowResults(false)
                }}
              >
                <X className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-gray-400`} />
              </button>
            )}
          </div>

          {/* Search results */}
          {showResults && (
            <div
              className={`absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto z-[1001] ${isMobile ? "max-h-48" : ""}`}
            >
              {isSearching ? (
                <div className="p-4 text-center">
                  <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}>Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    onClick={() => handlePlaceSelect(result)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className={`font-medium text-gray-800 dark:text-gray-200 ${isMobile ? "text-sm" : ""}`}>
                          {result.name}
                        </div>
                        <div className={`text-gray-500 dark:text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}>
                          {result.address}
                        </div>
                        <div className={`text-gray-400 dark:text-gray-500 ${isMobile ? "text-xs" : "text-sm"}`}>
                          {result.category}
                        </div>
                      </div>
                      {result.rating && (
                        <div className={`flex items-center text-yellow-500 ${isMobile ? "text-xs" : "text-sm"}`}>
                          ⭐ {result.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}>
                    No results found
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* GPS Status */}
        {(isTracking || locationError) && (
          <div className={`absolute top-16 left-3 right-3 z-[999] ${isMobile ? "top-14 left-2 right-2" : ""}`}>
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border ${isTracking ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800"} p-2`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {isTracking ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <span className={`text-green-700 dark:text-green-300 ${isMobile ? "text-xs" : "text-sm"}`}>
                        GPS Tracking Active
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <span className={`text-red-700 dark:text-red-300 ${isMobile ? "text-xs" : "text-sm"}`}>
                        {locationError}
                      </span>
                    </>
                  )}
                </div>
                {locationAccuracy && (
                  <span className={`text-gray-500 dark:text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}>
                    ±{Math.round(locationAccuracy)}m
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Map Engine */}
        <MapEngine
          ref={mapRef}
          width={mapSize.width}
          height={mapSize.height}
          markers={markers}
          routes={routes}
          userLocation={userLocation}
          isTracking={isTracking}
          onMarkerClick={handleMarkerClick}
        />

        {/* Map controls */}
        <div className={`absolute ${isMobile ? "bottom-3 right-3" : "bottom-4 right-4"} flex flex-col gap-2 z-[999]`}>
          <button
            className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} bg-white dark:bg-gray-800 rounded-full shadow flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            onClick={() => setShowControls(!showControls)}
            aria-label="Show map controls"
          >
            <MapPin className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-orange-500`} />
          </button>

          {showControls && (
            <>
              <button
                className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} bg-white dark:bg-gray-800 rounded-full shadow flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isTracking ? "bg-green-100 dark:bg-green-900" : ""}`}
                onClick={isTracking ? stopTracking : startTracking}
                aria-label={isTracking ? "Stop GPS tracking" : "Start GPS tracking"}
              >
                {isTracking ? (
                  <StopCircle className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-red-500`} />
                ) : (
                  <Crosshair className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-orange-500`} />
                )}
              </button>
              <button
                className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} bg-white dark:bg-gray-800 rounded-full shadow flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                onClick={handleLocateMe}
                aria-label="Locate me"
              >
                <Locate className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-orange-500`} />
              </button>
              <button
                className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} bg-white dark:bg-gray-800 rounded-full shadow flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                onClick={() => {
                  if (mapRef.current && (mapRef.current as any).setZoom) {
                    ;(mapRef.current as any).setZoom(zoom + 1)
                  }
                }}
                aria-label="Zoom in"
              >
                <Plus className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-orange-500`} />
              </button>
              <button
                className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} bg-white dark:bg-gray-800 rounded-full shadow flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                onClick={() => {
                  if (mapRef.current && (mapRef.current as any).setZoom) {
                    ;(mapRef.current as any).setZoom(zoom - 1)
                  }
                }}
                aria-label="Zoom out"
              >
                <Minus className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-orange-500`} />
              </button>
            </>
          )}
        </div>

        {/* Navigation button */}
        {selectedPlace && (
          <div className={`absolute ${isMobile ? "bottom-3 left-3 right-12" : "bottom-4 left-4 right-20"} z-[999]`}>
            <button
              className={`w-full bg-orange-500 text-white ${isMobile ? "py-2 px-3 text-sm" : "py-2 px-4 text-sm"} rounded-lg font-medium flex items-center justify-center hover:bg-orange-600 transition-colors shadow-lg`}
              onClick={() => {
                const currentPos = userLocation || currentLocation
                const url = `https://www.openstreetmap.org/directions?from=${currentPos.lat},${currentPos.lng}&to=${selectedPlace.lat},${selectedPlace.lng}`
                window.open(url, "_blank")
              }}
            >
              <Navigation className={`${isMobile ? "w-3 h-3 mr-1" : "w-4 h-4 mr-2"}`} />
              {isMobile ? "Navigate" : `Navigate to ${selectedPlace.name}`}
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-[1002]">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Map info */}
      {!fullScreen && (
        <div className="mt-2">
          {view === "findParking" && (
            <div className={`${isMobile ? "text-xs" : "text-sm"}`}>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                Found {markers.filter((m) => m.type === "parking").length} parking spots nearby
              </p>
            </div>
          )}
          {view === "locateFuel" && (
            <div className={`${isMobile ? "text-xs" : "text-sm"}`}>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                Found {markers.filter((m) => m.type === "gas_station").length} petrol pumps nearby
              </p>
            </div>
          )}
          {selectedPlace && (
            <div className={`${isMobile ? "text-xs" : "text-sm"} mt-1`}>
              <p className="text-gray-600 dark:text-gray-400">
                Selected: {selectedPlace.name} • {selectedPlace.address}
              </p>
            </div>
          )}
          {isTracking && userLocation && (
            <div className={`${isMobile ? "text-xs" : "text-sm"} mt-1`}>
              <p className="text-green-600 dark:text-green-400">
                📍 Live GPS: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                {locationAccuracy && ` (±${Math.round(locationAccuracy)}m)`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CustomMap
