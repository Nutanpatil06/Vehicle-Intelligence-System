"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Navigation, Search, Locate, X, Star, Info, Compass, Layers } from "lucide-react"
import { useTheme } from "@/context/theme-context"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  type PlaceResult,
  calculateDistance,
  formatDistance,
  formatPriceLevel,
  formatPrice,
  generateRoute,
  calculateETA,
  getMarkerIcon,
  getMarkerColor,
  generateNearbyPlaces,
} from "@/utils/map-utils"

interface LeafletMapProps {
  view: string | null
  fullScreen?: boolean
  onSelectLocation?: (location: any) => void
}

const LeafletMap = ({ view, fullScreen = false, onSelectLocation }: LeafletMapProps) => {
  const { theme } = useTheme()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1024px)")

  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const popupRef = useRef<any>(null)
  const routeLayerRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)

  const [loading, setLoading] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)
  // Default to Mumbai, India
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number }>({ lat: 19.076, lng: 72.8777 })
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([])
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceResult[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: { text: string } } | null>(null)
  const [mapType, setMapType] = useState<"street" | "satellite">("street")
  const [showControls, setShowControls] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [currentTileLayer, setCurrentTileLayer] = useState<any>(null)

  // Load Leaflet library
  useEffect(() => {
    if (typeof window !== "undefined" && !window.L) {
      const loadLeaflet = async () => {
        try {
          // Simulate loading progress
          const progressInterval = setInterval(() => {
            setLoadingProgress((prev) => {
              const newProgress = prev + Math.floor(Math.random() * 15) + 5
              return Math.min(newProgress, 95)
            })
          }, 200)

          // Load Leaflet CSS
          const linkElement = document.createElement("link")
          linkElement.rel = "stylesheet"
          linkElement.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          linkElement.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          linkElement.crossOrigin = ""
          document.head.appendChild(linkElement)

          // Load Leaflet JS
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          script.crossOrigin = ""
          script.async = true

          script.onload = () => {
            clearInterval(progressInterval)
            setLoadingProgress(100)
            setTimeout(() => {
              initializeMap()
            }, 300)
          }

          script.onerror = () => {
            clearInterval(progressInterval)
            setMapError("Failed to load map library")
            setLoading(false)
          }

          document.body.appendChild(script)

          return () => {
            clearInterval(progressInterval)
            if (document.head.contains(linkElement)) {
              document.head.removeChild(linkElement)
            }
            if (document.body.contains(script)) {
              document.body.removeChild(script)
            }
          }
        } catch (error) {
          console.error("Error loading Leaflet:", error)
          setMapError("Failed to load map library")
          setLoading(false)
        }
      }

      loadLeaflet()
    } else if (window.L) {
      initializeMap()
    }
  }, [])

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.L) return

    try {
      // Create map instance with responsive options
      const map = window.L.map(mapRef.current, {
        center: [currentLocation.lat, currentLocation.lng],
        zoom: isMobile ? 13 : 14,
        zoomControl: false,
        attributionControl: !isMobile,
        maxZoom: 18,
        minZoom: 3,
      })

      // Add street tile layer
      const streetLayer = window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: isMobile ? "" : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      setCurrentTileLayer(streetLayer)

      // Add custom zoom control
      const zoomControl = window.L.control.zoom({
        position: isMobile ? "bottomright" : "topright",
      })
      map.addControl(zoomControl)

      leafletMapRef.current = map

      // Get user's location
      getUserLocation(map)

      setMapLoaded(true)
      setLoading(false)
    } catch (error) {
      console.error("Error initializing map:", error)
      setMapError("Failed to initialize map")
      setLoading(false)
    }
  }, [currentLocation, isMobile])

  // Get user location
  const getUserLocation = (map: any) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }

          setCurrentLocation(userLocation)
          map.setView([userLocation.lat, userLocation.lng], isMobile ? 13 : 14)

          // Add user location marker
          addUserLocationMarker(map, userLocation)

          // Load nearby places based on view
          loadNearbyPlaces(userLocation, view)
        },
        (error) => {
          console.warn("Geolocation error:", error)
          // Use default location (Mumbai)
          addUserLocationMarker(map, currentLocation)
          loadNearbyPlaces(currentLocation, view)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        },
      )
    } else {
      // Geolocation not supported, use default location
      addUserLocationMarker(map, currentLocation)
      loadNearbyPlaces(currentLocation, view)
    }
  }

  // Add user location marker
  const addUserLocationMarker = (map: any, location: { lat: number; lng: number }) => {
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current)
    }

    const pulseIcon = window.L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-blue-500 opacity-30 rounded-full animate-ping"></div>
          <div class="relative w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>
        </div>
      `,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    userMarkerRef.current = window.L.marker([location.lat, location.lng], {
      icon: pulseIcon,
      zIndexOffset: 1000,
    }).addTo(map)

    userMarkerRef.current.bindPopup("Your Location").openPopup()
  }

  // Load nearby places
  const loadNearbyPlaces = useCallback(
    async (location: { lat: number; lng: number }, view: string | null) => {
      if (!view || !window.L || !leafletMapRef.current) return

      let placeType = ""

      switch (view) {
        case "findParking":
          placeType = "parking"
          break
        case "locateFuel":
          placeType = "gas_station"
          break
        case "liveTracking":
          return
        default:
          placeType = "gas_station"
      }

      try {
        // Generate nearby places using our utility function
        const places = generateNearbyPlaces(location, placeType, isMobile ? 8 : 12, 5)
        setNearbyPlaces(places)

        // Clear existing markers (except user marker)
        clearMarkers()

        // Add markers for places
        places.forEach((place: PlaceResult) => {
          if (!leafletMapRef.current) return

          const markerColor = getMarkerColor(placeType)
          const markerIcon = window.L.divIcon({
            html: `
            <div style="
              background-color: ${markerColor};
              color: white;
              border-radius: 50%;
              width: ${isMobile ? "28px" : "32px"};
              height: ${isMobile ? "28px" : "32px"};
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: ${isMobile ? "12px" : "14px"};
              border: 2px solid white;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              transition: transform 0.2s ease;
              cursor: pointer;
            " class="hover:scale-110">
              ${getMarkerIcon(placeType)}
            </div>
          `,
            className: "",
            iconSize: [isMobile ? 28 : 32, isMobile ? 28 : 32],
            iconAnchor: [isMobile ? 14 : 16, isMobile ? 28 : 32],
            popupAnchor: [0, isMobile ? -28 : -32],
          })

          const marker = window.L.marker([place.location.lat, place.location.lng], { icon: markerIcon }).addTo(
            leafletMapRef.current,
          )

          const priceInfo = place.price
            ? `<p style="margin: 4px 0; font-size: 13px; color: #059669;">Price: ${formatPrice(place.price)}</p>`
            : place.priceLevel
              ? `<p style="margin: 4px 0; font-size: 13px;">Price Level: ${formatPriceLevel(place.priceLevel)}</p>`
              : ""

          const popupContent = `
          <div style="padding: 8px; max-width: ${isMobile ? "180px" : "220px"}; font-family: system-ui;">
            <h3 style="margin: 0 0 6px; font-size: ${isMobile ? "14px" : "16px"}; font-weight: 600; color: #1f2937;">${place.name}</h3>
            <p style="margin: 0 0 4px; font-size: ${isMobile ? "12px" : "13px"}; color: #6b7280;">${place.address}</p>
            ${
              place.rating
                ? `<div style="display: flex; align-items: center; margin: 4px 0; font-size: ${isMobile ? "12px" : "13px"};">
              <span style="color: #fbbf24; margin-right: 4px;">⭐</span>
              <span style="color: #374151;">${place.rating.toFixed(1)} (${place.totalRatings || 0} reviews)</span>
            </div>`
                : ""
            }
            ${place.distance ? `<p style="margin: 4px 0; font-size: ${isMobile ? "12px" : "13px"}; color: #6b7280;">📍 ${formatDistance(place.distance)}</p>` : ""}
            ${priceInfo}
            <button 
              style="
                background: linear-gradient(135deg, #f97316, #ea580c);
                color: white;
                border: none;
                padding: ${isMobile ? "6px 12px" : "8px 16px"};
                border-radius: 6px;
                margin-top: 8px;
                cursor: pointer;
                font-size: ${isMobile ? "12px" : "13px"};
                font-weight: 500;
                width: 100%;
                transition: all 0.2s ease;
              "
              onmouseover="this.style.transform='scale(1.02)'"
              onmouseout="this.style.transform='scale(1)'"
              onclick="window.selectPlace('${place.id}')"
            >
              🧭 Navigate
            </button>
          </div>
        `

          marker.bindPopup(popupContent, {
            maxWidth: isMobile ? 200 : 250,
            className: "custom-popup",
          })

          marker.on("click", () => {
            setSelectedPlace(place)
          })

          markersRef.current.push(marker)
        })

        // Add global function to handle navigate button click
        window.selectPlace = (placeId: string) => {
          const place = places.find((p: PlaceResult) => p.id === placeId)
          if (place) {
            handleSelectLocation(place)
          }
        }
      } catch (error) {
        console.error("Error loading nearby places:", error)
        setMapError("Failed to load nearby places")
      }
    },
    [isMobile],
  )

  // Clear markers (except user marker)
  const clearMarkers = () => {
    if (!leafletMapRef.current) return

    markersRef.current.forEach((marker) => {
      leafletMapRef.current.removeLayer(marker)
    })
    markersRef.current = []

    // Clear route
    if (routeLayerRef.current) {
      leafletMapRef.current.removeLayer(routeLayerRef.current)
      routeLayerRef.current = null
    }
  }

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() || !leafletMapRef.current) return

    setIsSearching(true)

    try {
      // Generate search results based on query
      const allPlaces = generateNearbyPlaces(currentLocation, "gas_station", 20, 10)

      // Filter results based on search query
      const results = allPlaces.filter(
        (place: PlaceResult) =>
          place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.address.toLowerCase().includes(searchQuery.toLowerCase()),
      )

      setSearchResults(results.slice(0, isMobile ? 5 : 8))
      setIsSearching(false)
    } catch (error) {
      console.error("Error searching places:", error)
      setIsSearching(false)
      setSearchResults([])
    }
  }

  // Handle select location
  const handleSelectLocation = (place: PlaceResult) => {
    if (!leafletMapRef.current) return

    setSelectedPlace(place)
    setSearchResults([])

    // Pan to location with appropriate zoom
    leafletMapRef.current.setView([place.location.lat, place.location.lng], isMobile ? 15 : 16, {
      animate: true,
      duration: 1,
    })

    // Clear existing route
    if (routeLayerRef.current) {
      leafletMapRef.current.removeLayer(routeLayerRef.current)
    }

    // Generate route
    const routePoints = generateRoute(currentLocation, place.location)

    // Calculate total distance
    let totalDistance = 0
    for (let i = 1; i < routePoints.length; i++) {
      totalDistance += calculateDistance(
        routePoints[i - 1].lat,
        routePoints[i - 1].lng,
        routePoints[i].lat,
        routePoints[i].lng,
      )
    }

    // Calculate ETA
    const eta = calculateETA(totalDistance)

    // Create animated route polyline
    const routeLatLngs = routePoints.map((point) => [point.lat, point.lng])
    const routePolyline = window.L.polyline(routeLatLngs, {
      color: "#f97316",
      weight: isMobile ? 4 : 5,
      opacity: 0.8,
      dashArray: "10, 10",
      lineCap: "round",
    }).addTo(leafletMapRef.current)

    // Animate the dash
    let dashOffset = 0
    const animateDash = () => {
      dashOffset -= 1
      routePolyline.setStyle({ dashOffset })
      requestAnimationFrame(animateDash)
    }
    animateDash()

    routeLayerRef.current = routePolyline

    // Add destination marker
    const destinationIcon = window.L.divIcon({
      html: `
        <div class="animate-bounce bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 border-white shadow-lg">
          🎯
        </div>
      `,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })

    const destinationMarker = window.L.marker([place.location.lat, place.location.lng], {
      icon: destinationIcon,
      zIndexOffset: 1000,
    }).addTo(leafletMapRef.current)

    markersRef.current.push(destinationMarker)

    // Fit map to show both user location and destination
    const group = new window.L.featureGroup([userMarkerRef.current, destinationMarker])
    leafletMapRef.current.fitBounds(group.getBounds().pad(0.1))

    // Set route info
    setRouteInfo({
      distance: totalDistance,
      duration: eta,
    })

    // Notify parent component
    if (onSelectLocation) {
      onSelectLocation({
        ...place,
        route: routePoints,
        distance: totalDistance,
        duration: eta,
      })
    }
  }

  // Handle locate me
  const handleLocateMe = () => {
    if (!leafletMapRef.current) return

    setLoading(true)
    getUserLocation(leafletMapRef.current)
    setLoading(false)
  }

  // Toggle map type
  const toggleMapType = () => {
    if (!leafletMapRef.current || !currentTileLayer) return

    leafletMapRef.current.removeLayer(currentTileLayer)

    if (mapType === "street") {
      // Switch to satellite
      const satelliteLayer = window.L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: isMobile ? "" : "Tiles &copy; Esri",
          maxZoom: 18,
        },
      ).addTo(leafletMapRef.current)
      setCurrentTileLayer(satelliteLayer)
      setMapType("satellite")
    } else {
      // Switch to street
      const streetLayer = window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: isMobile ? "" : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(leafletMapRef.current)
      setCurrentTileLayer(streetLayer)
      setMapType("street")
    }
  }

  // Handle responsive changes
  useEffect(() => {
    if (leafletMapRef.current) {
      // Invalidate size when screen size changes
      setTimeout(() => {
        leafletMapRef.current.invalidateSize()
      }, 100)
    }
  }, [isMobile, isTablet, fullScreen])

  if (loading) {
    return (
      <div
        className={`${fullScreen ? "h-[calc(100vh-200px)]" : "h-64"} bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center`}
      >
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
            <div
              className="absolute inset-0 rounded-full border-4 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"
              style={{ animationDuration: "1s" }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-orange-500 font-bold text-sm">{loadingProgress}%</span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">Loading map...</p>
        </div>
      </div>
    )
  }

  if (mapError) {
    return (
      <div
        className={`${fullScreen ? "h-[calc(100vh-200px)]" : "h-64"} bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center p-4`}
      >
        <div className="flex flex-col items-center text-center">
          <Info className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-gray-700 dark:text-gray-300 mb-2 text-sm">{mapError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }

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
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-gray-400`} />
            </div>
            {searchQuery && (
              <button className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setSearchQuery("")}>
                <X className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-gray-400`} />
              </button>
            )}
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div
              className={`absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto z-[1001] ${isMobile ? "max-h-48" : ""}`}
            >
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center border-b border-gray-100 dark:border-gray-700 last:border-0"
                  onClick={() => handleSelectLocation(result)}
                >
                  <div>
                    <div className={`font-medium text-gray-800 dark:text-gray-200 ${isMobile ? "text-sm" : ""}`}>
                      {result.name}
                    </div>
                    <div className={`text-gray-500 dark:text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}>
                      {result.address}
                    </div>
                  </div>
                  {result.rating && (
                    <div
                      className={`flex items-center text-gray-500 dark:text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}
                    >
                      <Star className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-yellow-500 mr-1 fill-yellow-500`} />
                      {result.rating.toFixed(1)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {isSearching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 text-center z-[1001]">
              <div className="flex justify-center mb-2">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}>Searching...</p>
            </div>
          )}
        </div>

        {/* Map */}
        <div ref={mapRef} className="w-full h-full" aria-label="Interactive Map"></div>

        {/* Map controls */}
        <div className={`absolute ${isMobile ? "bottom-3 right-3" : "bottom-4 right-4"} flex flex-col gap-2 z-[999]`}>
          <button
            className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} bg-white dark:bg-gray-800 rounded-full shadow flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            onClick={() => setShowControls(!showControls)}
            aria-label="Show map controls"
          >
            <Compass className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-orange-500`} />
          </button>

          {showControls && (
            <>
              <button
                className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} bg-white dark:bg-gray-800 rounded-full shadow flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                onClick={handleLocateMe}
                aria-label="Locate me"
              >
                <Locate className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-orange-500`} />
              </button>
              <button
                className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} bg-white dark:bg-gray-800 rounded-full shadow flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                onClick={toggleMapType}
                aria-label="Toggle map type"
              >
                <Layers className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-orange-500`} />
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
                // Open in OpenStreetMap
                const url = `https://www.openstreetmap.org/directions?from=${currentLocation.lat},${currentLocation.lng}&to=${selectedPlace.location.lat},${selectedPlace.location.lng}`
                window.open(url, "_blank")
              }}
            >
              <Navigation className={`${isMobile ? "w-3 h-3 mr-1" : "w-4 h-4 mr-2"}`} />
              {isMobile ? "Navigate" : `Navigate to ${selectedPlace.name}`}
            </button>
          </div>
        )}
      </div>

      {/* Map info based on view */}
      {!fullScreen && (
        <div className="mt-2">
          {view === "findParking" && (
            <div className={`${isMobile ? "text-xs" : "text-sm"}`}>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                Found {nearbyPlaces.length} parking spots nearby
              </p>
            </div>
          )}
          {view === "locateFuel" && (
            <div className={`${isMobile ? "text-xs" : "text-sm"}`}>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                Found {nearbyPlaces.length} petrol pumps nearby
              </p>
            </div>
          )}
          {view === "liveTracking" && routeInfo && (
            <div className={`${isMobile ? "text-xs" : "text-sm"}`}>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                ETA: {routeInfo.duration.text} ({routeInfo.distance.toFixed(1)} km)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Add selectPlace to Window interface
declare global {
  interface Window {
    L: any
    selectPlace: (placeId: string) => void
  }
}

export default LeafletMap
