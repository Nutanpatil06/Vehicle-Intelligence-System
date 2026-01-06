"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { useTheme } from "@/context/theme-context"
import { useMediaQuery } from "@/hooks/use-media-query"

interface MapEngineProps {
  width: number
  height: number
  onLocationChange?: (lat: number, lng: number, zoom: number) => void
  onMarkerClick?: (marker: any) => void
  markers?: Array<{
    id: string
    lat: number
    lng: number
    type: string
    title: string
    icon?: string
  }>
  routes?: Array<{
    points: Array<{ lat: number; lng: number }>
    color: string
    width: number
  }>
  userLocation?: { lat: number; lng: number } | null
  isTracking?: boolean
}

const MapEngine = ({
  width,
  height,
  onLocationChange,
  onMarkerClick,
  markers = [],
  routes = [],
  userLocation,
  isTracking = false,
}: MapEngineProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Map state
  const [centerLat, setCenterLat] = useState(19.076)
  const [centerLng, setCenterLng] = useState(72.8777)
  const [zoom, setZoom] = useState(14)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [lastMouseX, setLastMouseX] = useState(0)
  const [lastMouseY, setLastMouseY] = useState(0)
  const [tiles, setTiles] = useState<Map<string, HTMLImageElement>>(new Map())
  const [loadedTiles, setLoadedTiles] = useState<Set<string>>(new Set())

  // Refs for stable values
  const isRenderingRef = useRef(false)
  const tileLoadingRef = useRef<Set<string>>(new Set())
  const animationFrameRef = useRef<number | null>(null)

  // Utility functions
  const deg2rad = (deg: number) => (deg * Math.PI) / 180
  const rad2deg = (rad: number) => (rad * 180) / Math.PI

  const latLngToTile = useCallback((lat: number, lng: number, z: number) => {
    const x = Math.floor(((lng + 180) / 360) * Math.pow(2, z))
    const y = Math.floor(
      ((1 - Math.log(Math.tan(deg2rad(lat)) + 1 / Math.cos(deg2rad(lat))) / Math.PI) / 2) * Math.pow(2, z),
    )
    return { x, y }
  }, [])

  const tileToLatLng = useCallback((x: number, y: number, z: number) => {
    const lng = (x / Math.pow(2, z)) * 360 - 180
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z)
    const lat = rad2deg(Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))))
    return { lat, lng }
  }, [])

  const latLngToPixel = useCallback(
    (lat: number, lng: number) => {
      const scale = Math.pow(2, zoom)
      const worldX = ((lng + 180) / 360) * scale
      const worldY = ((1 - Math.log(Math.tan(deg2rad(lat)) + 1 / Math.cos(deg2rad(lat))) / Math.PI) / 2) * scale

      const centerWorldX = ((centerLng + 180) / 360) * scale
      const centerWorldY =
        ((1 - Math.log(Math.tan(deg2rad(centerLat)) + 1 / Math.cos(deg2rad(centerLat))) / Math.PI) / 2) * scale

      const pixelX = width / 2 + (worldX - centerWorldX) * 256 + offsetX
      const pixelY = height / 2 + (worldY - centerWorldY) * 256 + offsetY

      return { x: pixelX, y: pixelY }
    },
    [centerLat, centerLng, zoom, width, height, offsetX, offsetY],
  )

  // Load tile image with better error handling
  const loadTile = useCallback(
    (x: number, y: number, z: number) => {
      const tileKey = `${z}-${x}-${y}`

      if (loadedTiles.has(tileKey) || tileLoadingRef.current.has(tileKey)) {
        return
      }

      // Check bounds
      if (x < 0 || y < 0 || x >= Math.pow(2, z) || y >= Math.pow(2, z)) {
        return
      }

      tileLoadingRef.current.add(tileKey)

      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        setTiles((prev) => {
          const newTiles = new Map(prev)
          newTiles.set(tileKey, img)
          return newTiles
        })
        setLoadedTiles((prev) => new Set(prev).add(tileKey))
        tileLoadingRef.current.delete(tileKey)
      }

      img.onerror = () => {
        console.warn(`Failed to load tile: ${tileKey}`)
        tileLoadingRef.current.delete(tileKey)
      }

      // Use multiple tile servers for better reliability
      const tileServers = [
        `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
        `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`,
        `https://b.tile.openstreetmap.org/${z}/${x}/${y}.png`,
        `https://c.tile.openstreetmap.org/${z}/${x}/${y}.png`,
      ]

      img.src = tileServers[Math.floor(Math.random() * tileServers.length)]
    },
    [loadedTiles],
  )

  const getMarkerColor = (type: string) => {
    switch (type) {
      case "parking":
        return "#3b82f6"
      case "gas_station":
        return "#ef4444"
      case "restaurant":
        return "#f59e0b"
      case "hotel":
        return "#8b5cf6"
      default:
        return "#6b7280"
    }
  }

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case "parking":
        return "P"
      case "gas_station":
        return "⛽"
      case "restaurant":
        return "🍽"
      case "hotel":
        return "🏨"
      default:
        return "📍"
    }
  }

  // Optimized render function
  const renderMap = useCallback(() => {
    if (isRenderingRef.current) return
    isRenderingRef.current = true

    const canvas = canvasRef.current
    if (!canvas) {
      isRenderingRef.current = false
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      isRenderingRef.current = false
      return
    }

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Clear canvas with background
    ctx.fillStyle = theme === "dark" ? "#1f2937" : "#e5e7eb"
    ctx.fillRect(0, 0, width, height)

    // Calculate visible tiles
    const tileSize = 256
    const centerTile = latLngToTile(centerLat, centerLng, zoom)
    const tilesX = Math.ceil(width / tileSize) + 2
    const tilesY = Math.ceil(height / tileSize) + 2

    // Draw tiles
    for (let dx = -Math.ceil(tilesX / 2); dx <= Math.ceil(tilesX / 2); dx++) {
      for (let dy = -Math.ceil(tilesY / 2); dy <= Math.ceil(tilesY / 2); dy++) {
        const tileX = centerTile.x + dx
        const tileY = centerTile.y + dy
        const tileKey = `${zoom}-${tileX}-${tileY}`

        if (tileX < 0 || tileY < 0 || tileX >= Math.pow(2, zoom) || tileY >= Math.pow(2, zoom)) {
          continue
        }

        const tilePixelX = width / 2 + dx * tileSize + offsetX
        const tilePixelY = height / 2 + dy * tileSize + offsetY

        const tileImg = tiles.get(tileKey)
        if (tileImg && tileImg.complete) {
          try {
            ctx.drawImage(tileImg, tilePixelX, tilePixelY, tileSize, tileSize)
          } catch (e) {
            console.warn("Error drawing tile:", e)
          }
        } else {
          // Draw placeholder
          ctx.fillStyle = theme === "dark" ? "#374151" : "#d1d5db"
          ctx.fillRect(tilePixelX, tilePixelY, tileSize, tileSize)

          // Draw grid pattern
          ctx.strokeStyle = theme === "dark" ? "#4b5563" : "#9ca3af"
          ctx.lineWidth = 1
          ctx.strokeRect(tilePixelX, tilePixelY, tileSize, tileSize)

          // Load tile if not already loading
          if (!tileLoadingRef.current.has(tileKey)) {
            loadTile(tileX, tileY, zoom)
          }
        }
      }
    }

    // Draw routes
    routes.forEach((route) => {
      if (route.points.length < 2) return

      ctx.strokeStyle = route.color
      ctx.lineWidth = route.width
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
      ctx.shadowBlur = 2
      ctx.beginPath()

      route.points.forEach((point, index) => {
        const { x, y } = latLngToPixel(point.lat, point.lng)
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
      ctx.shadowBlur = 0
    })

    // Draw markers
    markers.forEach((marker) => {
      const { x, y } = latLngToPixel(marker.lat, marker.lng)

      if (x < -50 || x > width + 50 || y < -50 || y > height + 50) return

      // Draw marker shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
      ctx.beginPath()
      ctx.ellipse(x, y + 20, 8, 4, 0, 0, 2 * Math.PI)
      ctx.fill()

      // Draw marker
      const markerSize = isMobile ? 24 : 32
      ctx.fillStyle = getMarkerColor(marker.type)
      ctx.beginPath()
      ctx.arc(x, y, markerSize / 2, 0, 2 * Math.PI)
      ctx.fill()

      // Draw marker border
      ctx.strokeStyle = "white"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw marker icon
      ctx.fillStyle = "white"
      ctx.font = `${isMobile ? "12px" : "14px"} sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(getMarkerIcon(marker.type), x, y)
    })

    // Draw user location
    const currentUserLocation = userLocation || { lat: centerLat, lng: centerLng }
    const userPos = latLngToPixel(currentUserLocation.lat, currentUserLocation.lng)

    // Animated pulse for GPS tracking
    if (isTracking) {
      const time = Date.now() / 1000
      const pulseRadius = 20 + Math.sin(time * 3) * 10
      const pulseOpacity = 0.3 - Math.sin(time * 3) * 0.1

      ctx.fillStyle = `rgba(59, 130, 246, ${pulseOpacity})`
      ctx.beginPath()
      ctx.arc(userPos.x, userPos.y, pulseRadius, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Static user marker background
    ctx.fillStyle = "rgba(59, 130, 246, 0.3)"
    ctx.beginPath()
    ctx.arc(userPos.x, userPos.y, 25, 0, 2 * Math.PI)
    ctx.fill()

    // User marker
    ctx.fillStyle = "#3b82f6"
    ctx.beginPath()
    ctx.arc(userPos.x, userPos.y, 8, 0, 2 * Math.PI)
    ctx.fill()

    ctx.strokeStyle = "white"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw GPS accuracy circle if tracking
    if (isTracking) {
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)"
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(userPos.x, userPos.y, 40, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.setLineDash([])
    }

    isRenderingRef.current = false
  }, [
    width,
    height,
    centerLat,
    centerLng,
    zoom,
    offsetX,
    offsetY,
    theme,
    markers,
    routes,
    tiles,
    loadTile,
    isMobile,
    userLocation,
    isTracking,
    latLngToTile,
    latLngToPixel,
  ])

  // Animation loop for GPS tracking
  useEffect(() => {
    if (!isTracking) return

    const animate = () => {
      renderMap()
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isTracking, renderMap])

  // Render when dependencies change (but not during tracking animation)
  useEffect(() => {
    if (!isTracking) {
      renderMap()
    }
  }, [renderMap, isTracking])

  // Update center when user location changes during tracking
  useEffect(() => {
    if (isTracking && userLocation) {
      setCenterLat(userLocation.lat)
      setCenterLng(userLocation.lng)
      setOffsetX(0)
      setOffsetY(0)
    }
  }, [userLocation, isTracking])

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setLastMouseX(e.clientX)
    setLastMouseY(e.clientY)
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return

      const deltaX = e.clientX - lastMouseX
      const deltaY = e.clientY - lastMouseY

      setOffsetX((prev) => prev + deltaX)
      setOffsetY((prev) => prev + deltaY)
      setLastMouseX(e.clientX)
      setLastMouseY(e.clientY)
    },
    [isDragging, lastMouseX, lastMouseY],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()

      const zoomDelta = e.deltaY > 0 ? -1 : 1
      const newZoom = Math.max(3, Math.min(18, zoom + zoomDelta))

      if (newZoom !== zoom) {
        setZoom(newZoom)
        setOffsetX(0)
        setOffsetY(0)

        if (onLocationChange) {
          onLocationChange(centerLat, centerLng, newZoom)
        }
      }
    },
    [zoom, centerLat, centerLng, onLocationChange],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const clickedMarker = markers.find((marker) => {
        const markerPos = latLngToPixel(marker.lat, marker.lng)
        const distance = Math.sqrt(Math.pow(x - markerPos.x, 2) + Math.pow(y - markerPos.y, 2))
        return distance <= (isMobile ? 12 : 16)
      })

      if (clickedMarker && onMarkerClick) {
        onMarkerClick(clickedMarker)
      }
    },
    [isDragging, markers, isMobile, onMarkerClick, latLngToPixel],
  )

  // Public methods
  const panTo = useCallback(
    (lat: number, lng: number) => {
      setCenterLat(lat)
      setCenterLng(lng)
      setOffsetX(0)
      setOffsetY(0)

      if (onLocationChange) {
        onLocationChange(lat, lng, zoom)
      }
    },
    [zoom, onLocationChange],
  )

  const setZoomLevel = useCallback(
    (newZoom: number) => {
      const clampedZoom = Math.max(3, Math.min(18, newZoom))
      setZoom(clampedZoom)
      setOffsetX(0)
      setOffsetY(0)

      if (onLocationChange) {
        onLocationChange(centerLat, centerLng, clampedZoom)
      }
    },
    [centerLat, centerLng, onLocationChange],
  )

  // Expose methods to parent
  useEffect(() => {
    if (canvasRef.current) {
      ;(canvasRef.current as any).panTo = panTo
      ;(canvasRef.current as any).setZoom = setZoomLevel
      ;(canvasRef.current as any).getCenter = () => ({
        lat: centerLat,
        lng: centerLng,
      })
      ;(canvasRef.current as any).getZoom = () => zoom
    }
  }, [panTo, setZoomLevel, centerLat, centerLng, zoom])

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        display: "block",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
    />
  )
}

export default MapEngine
