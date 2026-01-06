"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Navigation, Crosshair, StopCircle, MapPin, Gauge, Route, Fuel } from "lucide-react"
import { useTheme } from "@/context/theme-context"
import { useMediaQuery } from "@/hooks/use-media-query"
import useEnhancedGPS from "@/hooks/use-enhanced-gps"
import useEnhancedBluetooth from "@/hooks/use-enhanced-bluetooth"
import PermissionManager from "@/components/permission-manager"
import { useMapState } from "@/hooks/use-map-state"
import { useTileManager } from "@/hooks/use-tile-manager"
import { usePetrolPumps } from "@/hooks/use-petrol-pumps"
import { MapRenderer } from "@/components/map-renderer"
import type { PlaceResult } from "@/utils/map-utils"

interface RealTimeMapProps {
  view: string | null
  fullScreen?: boolean
  onLocationUpdate?: (location: any) => void
}

const RealTimeMap = ({ view, fullScreen = false, onLocationUpdate }: RealTimeMapProps) => {
  const { theme } = useTheme()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [renderTrigger, setRenderTrigger] = useState(0)

  // Enhanced GPS tracking
  const {
    currentPosition,
    isTracking: isGPSTracking,
    accuracy,
    speed: gpsSpeed,
    heading,
    error: gpsError,
    hasPermission: hasGPSPermission,
    startTracking: startGPSTracking,
    stopTracking: stopGPSTracking,
    getLocationHistory,
    totalDistance,
  } = useEnhancedGPS({
    enableHighAccuracy: true,
    trackingInterval: 1000,
    distanceFilter: 2,
    autoStart: false,
  })

  // Car Bluetooth connection
  const {
    isConnected: isCarConnected,
    carData,
    connectionQuality,
  } = useEnhancedBluetooth({
    enableRealTimeData: true,
    dataUpdateInterval: 1000,
  })

  // Map state management
  const { mapState, updateZoom, setUserInteracted, setFollowUser, centerOnUser } = useMapState(
    currentPosition?.lat || 0,
    currentPosition?.lng || 0,
    16,
  )

  // Component state
  const [mapSize, setMapSize] = useState({ width: 800, height: 400 })
  const [showTrail, setShowTrail] = useState(true)
  const [mapType, setMapType] = useState<"street" | "satellite">("street")
  const [showPetrolPumps, setShowPetrolPumps] = useState(true)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // Tile management
  const { loadTile, getTile, clearCache, preloadTiles } = useTileManager(() => {
    setRenderTrigger((prev) => prev + 1)
    setIsMapLoaded(true)
  })

  // Petrol pumps management
  const {
    petrolPumps,
    selectedPump,
    selectPump,
    isLoading: pumpsLoading,
  } = usePetrolPumps(currentPosition, showPetrolPumps)

  // Update map size
  useEffect(() => {
    const updateMapSize = () => {
      const container = mapContainerRef.current
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

  // Auto-center on user location
  useEffect(() => {
    if (currentPosition && mapState.followUser && !mapState.userInteracted) {
      centerOnUser(currentPosition.lat, currentPosition.lng)
    }
  }, [currentPosition, mapState.followUser, mapState.userInteracted, centerOnUser])

  // Calculate required tiles
  const requiredTiles = useMemo(() => {
    const deg2rad = (deg: number) => (deg * Math.PI) / 180
    const latLngToTile = (lat: number, lng: number, z: number) => {
      const x = Math.floor(((lng + 180) / 360) * Math.pow(2, z))
      const y = Math.floor(
        ((1 - Math.log(Math.tan(deg2rad(lat)) + 1 / Math.cos(deg2rad(lat))) / Math.PI) / 2) * Math.pow(2, z),
      )
      return { x, y }
    }

    const centerTile = latLngToTile(mapState.centerLat, mapState.centerLng, mapState.zoom)
    const tileSize = 256
    const tilesX = Math.ceil(mapSize.width / tileSize) + 2
    const tilesY = Math.ceil(mapSize.height / tileSize) + 2

    const tiles: Array<{ x: number; y: number; z: number }> = []

    for (let dx = -Math.ceil(tilesX / 2); dx <= Math.ceil(tilesX / 2); dx++) {
      for (let dy = -Math.ceil(tilesY / 2); dy <= Math.ceil(tilesY / 2); dy++) {
        const tileX = centerTile.x + dx
        const tileY = centerTile.y + dy

        if (tileX < 0 || tileY < 0 || tileX >= Math.pow(2, mapState.zoom) || tileY >= Math.pow(2, mapState.zoom)) {
          continue
        }

        tiles.push({ x: tileX, y: tileY, z: mapState.zoom })
      }
    }

    return tiles
  }, [mapState.centerLat, mapState.centerLng, mapState.zoom, mapSize])

  // Load tiles when required tiles change
  useEffect(() => {
    if (requiredTiles.length > 0) {
      preloadTiles(requiredTiles, mapType)
    }
  }, [requiredTiles, mapType, preloadTiles])

  // Clear tile cache when map type changes
  useEffect(() => {
    clearCache()
    setIsMapLoaded(false)
  }, [mapType, clearCache])

  // Handle map interactions
  const handleMapInteraction = useCallback(() => {
    setUserInteracted(true)
    setFollowUser(false)
  }, [setUserInteracted, setFollowUser])

  // Control handlers
  const handleCenterOnUser = useCallback(() => {
    if (currentPosition) {
      centerOnUser(currentPosition.lat, currentPosition.lng)
    }
  }, [currentPosition, centerOnUser])

  const handleZoomIn = useCallback(() => {
    updateZoom(mapState.zoom + 1)
  }, [mapState.zoom, updateZoom])

  const handleZoomOut = useCallback(() => {
    updateZoom(mapState.zoom - 1)
  }, [mapState.zoom, updateZoom])

  const handlePumpClick = useCallback(
    (pump: PlaceResult) => {
      if (!pump?.geometry?.location) return

      selectPump(pump)
      centerOnUser(pump.geometry.location.lat, pump.geometry.location.lng)
      setFollowUser(false)
      setUserInteracted(true)
    },
    [selectPump, centerOnUser, setFollowUser, setUserInteracted],
  )

  // Notify parent of location updates
  useEffect(() => {
    if (currentPosition && onLocationUpdate) {
      onLocationUpdate({
        position: currentPosition,
        speed: gpsSpeed,
        heading,
        accuracy,
        isTracking: isGPSTracking,
        carData,
        totalDistance,
        nearbyPetrolPumps: petrolPumps,
        selectedPump,
      })
    }
  }, [
    currentPosition,
    gpsSpeed,
    heading,
    accuracy,
    isGPSTracking,
    carData,
    totalDistance,
    petrolPumps,
    selectedPump,
    onLocationUpdate,
  ])

  // Utility functions
  const formatSpeed = (speed: number | null) => {
    if (speed === null) return "0"
    return Math.round(speed * 3.6)
  }

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`
    }
    return `${(distance / 1000).toFixed(1)}km`
  }

  return (
    <div className="relative" ref={mapContainerRef}>
      <div
        className={`${fullScreen ? "h-[calc(100vh-200px)]" : isMobile ? "h-80" : "h-96"} bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg`}
      >
        {/* Status Bar */}
        <div className="absolute top-3 left-3 right-3 z-[1000] flex justify-between items-start">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-2 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isGPSTracking ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {isGPSTracking ? "GPS Active" : "GPS Inactive"}
            </span>
            {accuracy && <span className="text-xs text-gray-500 dark:text-gray-400">±{Math.round(accuracy)}m</span>}
          </div>

          {showPetrolPumps && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-2 flex items-center space-x-2">
              <Fuel className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {pumpsLoading ? "Loading..." : `${petrolPumps.length} Pumps`}
              </span>
            </div>
          )}
        </div>

        {/* Permission Check */}
        {!hasGPSPermission && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 flex items-center justify-center z-[1003]">
            <div className="max-w-md w-full p-4">
              <PermissionManager
                showGPS={true}
                showBluetooth={false}
                onPermissionsGranted={() => {
                  setTimeout(() => startGPSTracking(), 1000)
                }}
              />
            </div>
          </div>
        )}

        {/* Map Canvas */}
        {hasGPSPermission && (
          <>
            <canvas
              ref={canvasRef}
              width={mapSize.width}
              height={mapSize.height}
              style={{
                width: `${mapSize.width}px`,
                height: `${mapSize.height}px`,
                display: "block",
                cursor: mapState.userInteracted ? "grab" : "default",
              }}
              className="w-full h-full"
              onMouseDown={handleMapInteraction}
              onTouchStart={handleMapInteraction}
            />

            <MapRenderer
              canvasRef={canvasRef}
              mapSize={mapSize}
              mapState={mapState}
              currentPosition={currentPosition}
              accuracy={accuracy}
              heading={heading}
              isTracking={isGPSTracking}
              showTrail={showTrail}
              locationHistory={getLocationHistory()}
              petrolPumps={petrolPumps}
              selectedPump={selectedPump}
              showPetrolPumps={showPetrolPumps}
              getTile={getTile}
              mapType={mapType}
              theme={theme}
              onPumpClick={handlePumpClick}
              onRender={() => setRenderTrigger((prev) => prev + 1)}
            />
          </>
        )}

        {/* Map Controls */}
        {hasGPSPermission && (
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[999]">
            {/* Center on location */}
            <button
              className={`w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 ${mapState.followUser ? "ring-2 ring-blue-500" : ""}`}
              onClick={handleCenterOnUser}
              aria-label="Center on current location"
            >
              <Navigation className={`w-5 h-5 ${mapState.followUser ? "text-blue-500" : "text-gray-600"}`} />
            </button>

            {/* GPS tracking toggle */}
            <button
              className={`w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 ${isGPSTracking ? "ring-2 ring-green-500" : ""}`}
              onClick={isGPSTracking ? stopGPSTracking : startGPSTracking}
              aria-label={isGPSTracking ? "Stop GPS tracking" : "Start GPS tracking"}
            >
              {isGPSTracking ? (
                <StopCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Crosshair className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Petrol pumps toggle */}
            <button
              className={`w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 ${showPetrolPumps ? "ring-2 ring-orange-500" : ""}`}
              onClick={() => setShowPetrolPumps(!showPetrolPumps)}
              aria-label="Toggle petrol pumps"
            >
              <Fuel className={`w-5 h-5 ${showPetrolPumps ? "text-orange-500" : "text-gray-600"}`} />
            </button>

            {/* Trail toggle */}
            <button
              className={`w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 ${showTrail ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setShowTrail(!showTrail)}
              aria-label="Toggle GPS trail"
            >
              <Route className={`w-5 h-5 ${showTrail ? "text-blue-500" : "text-gray-600"}`} />
            </button>

            {/* Map type toggle */}
            <button
              className="w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-all duration-200"
              onClick={() => setMapType(mapType === "street" ? "satellite" : "street")}
              aria-label="Toggle map type"
            >
              <MapPin className="w-5 h-5 text-gray-600" />
            </button>

            {/* Zoom controls */}
            <div className="flex flex-col">
              <button
                className="w-10 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-t-lg shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 text-lg font-bold text-gray-600"
                onClick={handleZoomIn}
                aria-label="Zoom in"
                disabled={mapState.zoom >= 18}
              >
                +
              </button>
              <button
                className="w-10 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-b-lg shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 text-lg font-bold text-gray-600"
                onClick={handleZoomOut}
                aria-label="Zoom out"
                disabled={mapState.zoom <= 1}
              >
                −
              </button>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {!isMapLoaded && hasGPSPermission && (
          <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center z-[1002]">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-gray-600 dark:text-gray-400 text-sm">Loading map...</p>
            </div>
          </div>
        )}

        {/* No GPS overlay */}
        {!currentPosition && !gpsError && hasGPSPermission && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-[1002]">
            <div className="flex flex-col items-center text-center p-4">
              <Crosshair className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Waiting for GPS location...</p>
              <button
                onClick={startGPSTracking}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                Enable GPS
              </button>
            </div>
          </div>
        )}

        {/* GPS Error overlay */}
        {gpsError && hasGPSPermission && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-[1002]">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
                <Crosshair className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-red-600 dark:text-red-400 text-sm mb-3">{gpsError}</p>
              <button
                onClick={startGPSTracking}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                Retry GPS
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Data Panel */}
      {hasGPSPermission && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center mb-1">
              <Gauge className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Speed</span>
            </div>
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {carData?.speed ? Math.round(carData.speed) : formatSpeed(gpsSpeed)} km/h
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center mb-1">
              <Navigation className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Heading</span>
            </div>
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {heading !== null ? `${Math.round(heading)}°` : "N/A"}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center mb-1">
              <Route className="w-4 h-4 text-purple-500 mr-1" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Distance</span>
            </div>
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200">{formatDistance(totalDistance)}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center mb-1">
              <Fuel className="w-4 h-4 text-orange-500 mr-1" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Nearby</span>
            </div>
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200">{petrolPumps.length} Pumps</div>
          </div>
        </div>
      )}

      {/* Petrol Pumps List */}
      {hasGPSPermission && showPetrolPumps && petrolPumps.length > 0 && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center">
            <Fuel className="w-5 h-5 text-orange-500 mr-2" />
            Nearby Petrol Pumps
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {petrolPumps.slice(0, 6).map((pump) => (
              <div
                key={pump.place_id}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedPump?.place_id === pump.place_id
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
                onClick={() => handlePumpClick(pump)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 truncate">{pump.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{pump.vicinity}</p>
                    {pump.rating && (
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-yellow-500">⭐</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{pump.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      {pump.distance ? `${pump.distance.toFixed(1)}km` : "N/A"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {pump.price_level ? `${"$".repeat(pump.price_level)}` : ""}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Car Data Panel */}
      {isCarConnected && carData && hasGPSPermission && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Live Car Data</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">RPM</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {carData.rpm ? Math.round(carData.rpm) : "N/A"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Fuel</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {carData.fuelLevel ? Math.round(carData.fuelLevel) : "N/A"}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Engine Temp</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {carData.engineTemp ? Math.round(carData.engineTemp) : "N/A"}°C
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Battery</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {carData.batteryVoltage ? carData.batteryVoltage.toFixed(1) : "N/A"}V
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RealTimeMap
