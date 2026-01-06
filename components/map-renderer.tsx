"use client"

import type React from "react"

import { useCallback, useRef, useEffect } from "react"
import type { PlaceResult } from "@/utils/map-utils"

interface MapRendererProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  mapSize: { width: number; height: number }
  mapState: {
    centerLat: number
    centerLng: number
    zoom: number
    followUser: boolean
  }
  currentPosition: { lat: number; lng: number } | null
  accuracy: number | null
  heading: number | null
  isTracking: boolean
  showTrail: boolean
  locationHistory: Array<{ lat: number; lng: number }>
  petrolPumps: PlaceResult[]
  selectedPump: PlaceResult | null
  showPetrolPumps: boolean
  getTile: (key: string) => any
  mapType: string
  theme: string
  onPumpClick?: (pump: PlaceResult) => void
  onRender?: () => void
}

export const MapRenderer = (props: MapRendererProps) => {
  const {
    canvasRef,
    mapSize,
    mapState,
    currentPosition,
    accuracy,
    heading,
    isTracking,
    showTrail,
    locationHistory,
    petrolPumps,
    selectedPump,
    showPetrolPumps,
    getTile,
    mapType,
    theme,
    onPumpClick,
    onRender,
  } = props

  const animationFrameRef = useRef<number>()

  // Map utility functions
  const deg2rad = useCallback((deg: number) => (deg * Math.PI) / 180, [])

  const latLngToTile = useCallback(
    (lat: number, lng: number, z: number) => {
      const x = Math.floor(((lng + 180) / 360) * Math.pow(2, z))
      const y = Math.floor(
        ((1 - Math.log(Math.tan(deg2rad(lat)) + 1 / Math.cos(deg2rad(lat))) / Math.PI) / 2) * Math.pow(2, z),
      )
      return { x, y }
    },
    [deg2rad],
  )

  const latLngToPixel = useCallback(
    (lat: number, lng: number) => {
      const scale = Math.pow(2, mapState.zoom)
      const worldX = ((lng + 180) / 360) * scale
      const worldY = ((1 - Math.log(Math.tan(deg2rad(lat)) + 1 / Math.cos(deg2rad(lat))) / Math.PI) / 2) * scale

      const centerWorldX = ((mapState.centerLng + 180) / 360) * scale
      const centerWorldY =
        ((1 - Math.log(Math.tan(deg2rad(mapState.centerLat)) + 1 / Math.cos(deg2rad(mapState.centerLat))) / Math.PI) /
          2) *
        scale

      const pixelX = mapSize.width / 2 + (worldX - centerWorldX) * 256
      const pixelY = mapSize.height / 2 + (worldY - centerWorldY) * 256

      return { x: pixelX, y: pixelY }
    },
    [mapState.zoom, mapState.centerLat, mapState.centerLng, mapSize, deg2rad],
  )

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = mapSize.width
    canvas.height = mapSize.height

    // Clear canvas
    ctx.fillStyle = theme === "dark" ? "#1f2937" : "#e5e7eb"
    ctx.fillRect(0, 0, mapSize.width, mapSize.height)

    // Draw tiles
    const tileSize = 256
    const centerTile = latLngToTile(mapState.centerLat, mapState.centerLng, mapState.zoom)
    const tilesX = Math.ceil(mapSize.width / tileSize) + 2
    const tilesY = Math.ceil(mapSize.height / tileSize) + 2

    for (let dx = -Math.ceil(tilesX / 2); dx <= Math.ceil(tilesX / 2); dx++) {
      for (let dy = -Math.ceil(tilesY / 2); dy <= Math.ceil(tilesY / 2); dy++) {
        const tileX = centerTile.x + dx
        const tileY = centerTile.y + dy
        const tileKey = `${mapType}-${mapState.zoom}-${tileX}-${tileY}`

        if (tileX < 0 || tileY < 0 || tileX >= Math.pow(2, mapState.zoom) || tileY >= Math.pow(2, mapState.zoom)) {
          continue
        }

        const tilePixelX = mapSize.width / 2 + dx * tileSize
        const tilePixelY = mapSize.height / 2 + dy * tileSize

        const tile = getTile(tileKey)
        if (tile?.loaded && tile.img?.complete) {
          ctx.drawImage(tile.img, tilePixelX, tilePixelY, tileSize, tileSize)
        } else {
          // Draw placeholder
          ctx.fillStyle = theme === "dark" ? "#374151" : "#d1d5db"
          ctx.fillRect(tilePixelX, tilePixelY, tileSize, tileSize)
        }
      }
    }

    // Draw GPS trail
    if (showTrail && locationHistory && locationHistory.length > 1) {
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 3
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.globalAlpha = 0.7
      ctx.beginPath()

      locationHistory.forEach((pos, index) => {
        if (pos && typeof pos.lat === "number" && typeof pos.lng === "number") {
          const pixel = latLngToPixel(pos.lat, pos.lng)
          if (index === 0) {
            ctx.moveTo(pixel.x, pixel.y)
          } else {
            ctx.lineTo(pixel.x, pixel.y)
          }
        }
      })

      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // Draw petrol pumps
    if (showPetrolPumps && petrolPumps && petrolPumps.length > 0) {
      petrolPumps.forEach((pump) => {
        // Add null checks for pump and its properties
        if (!pump || !pump.geometry || !pump.geometry.location) {
          return
        }

        const location = pump.geometry.location
        if (typeof location.lat !== "number" || typeof location.lng !== "number") {
          return
        }

        const pixel = latLngToPixel(location.lat, location.lng)

        // Only draw if visible
        if (pixel.x >= -30 && pixel.x <= mapSize.width + 30 && pixel.y >= -30 && pixel.y <= mapSize.height + 30) {
          const isSelected = selectedPump?.place_id === pump.place_id

          // Draw pump marker with enhanced visibility
          ctx.save()
          ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
          ctx.shadowBlur = 4
          ctx.shadowOffsetY = 2

          // Background circle
          ctx.fillStyle = isSelected ? "#dc2626" : "#f97316"
          ctx.strokeStyle = "white"
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(pixel.x, pixel.y, 14, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()

          // Fuel icon
          ctx.shadowColor = "transparent"
          ctx.fillStyle = "white"
          ctx.font = "bold 14px Arial"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText("⛽", pixel.x, pixel.y)

          // Distance label
          if (pump.distance && currentPosition && typeof pump.distance === "number") {
            ctx.fillStyle = theme === "dark" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.9)"
            ctx.strokeStyle = theme === "dark" ? "white" : "black"
            ctx.lineWidth = 1
            ctx.font = "10px Arial"
            ctx.textAlign = "center"
            ctx.textBaseline = "top"

            const distanceText = `${pump.distance.toFixed(1)}km`
            const textWidth = ctx.measureText(distanceText).width
            const padding = 4

            // Background
            ctx.fillRect(pixel.x - textWidth / 2 - padding, pixel.y + 18, textWidth + padding * 2, 14)

            // Text
            ctx.fillStyle = theme === "dark" ? "white" : "black"
            ctx.fillText(distanceText, pixel.x, pixel.y + 20)
          }

          ctx.restore()
        }
      })
    }

    // Draw current location
    if (currentPosition && typeof currentPosition.lat === "number" && typeof currentPosition.lng === "number") {
      const userPixel = latLngToPixel(currentPosition.lat, currentPosition.lng)

      ctx.save()

      // Accuracy circle
      if (accuracy && accuracy > 0) {
        const metersPerPixel =
          (156543.03392 * Math.cos((currentPosition.lat * Math.PI) / 180)) / Math.pow(2, mapState.zoom)
        const accuracyRadius = Math.min(accuracy / metersPerPixel, 150) // Cap at 150px

        ctx.strokeStyle = "rgba(59, 130, 246, 0.6)"
        ctx.fillStyle = "rgba(59, 130, 246, 0.1)"
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.arc(userPixel.x, userPixel.y, accuracyRadius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Pulsing animation when following user
      if (isTracking && mapState.followUser) {
        const time = Date.now() / 1000
        const pulseRadius = 30 + Math.sin(time * 2) * 10
        const pulseOpacity = 0.3 - Math.sin(time * 2) * 0.15

        ctx.fillStyle = `rgba(59, 130, 246, ${pulseOpacity})`
        ctx.beginPath()
        ctx.arc(userPixel.x, userPixel.y, pulseRadius, 0, 2 * Math.PI)
        ctx.fill()
      }

      // User location marker with shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)"
      ctx.shadowBlur = 6
      ctx.shadowOffsetY = 3

      // Outer white ring
      ctx.fillStyle = "white"
      ctx.beginPath()
      ctx.arc(userPixel.x, userPixel.y, 18, 0, 2 * Math.PI)
      ctx.fill()

      // Main blue dot
      ctx.fillStyle = "#3b82f6"
      ctx.beginPath()
      ctx.arc(userPixel.x, userPixel.y, 12, 0, 2 * Math.PI)
      ctx.fill()

      // Inner white dot
      ctx.shadowColor = "transparent"
      ctx.fillStyle = "white"
      ctx.beginPath()
      ctx.arc(userPixel.x, userPixel.y, 6, 0, 2 * Math.PI)
      ctx.fill()

      // Heading indicator
      if (heading !== null && heading >= 0 && typeof heading === "number") {
        const headingRad = deg2rad(heading)
        const arrowLength = 35

        ctx.strokeStyle = "#f97316"
        ctx.lineWidth = 4
        ctx.lineCap = "round"
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
        ctx.shadowBlur = 3

        // Main arrow line
        ctx.beginPath()
        ctx.moveTo(userPixel.x, userPixel.y)
        ctx.lineTo(userPixel.x + Math.sin(headingRad) * arrowLength, userPixel.y - Math.cos(headingRad) * arrowLength)
        ctx.stroke()

        // Arrow head
        const arrowHeadLength = 12
        const arrowHeadAngle = Math.PI / 5
        const endX = userPixel.x + Math.sin(headingRad) * arrowLength
        const endY = userPixel.y - Math.cos(headingRad) * arrowLength

        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - arrowHeadLength * Math.sin(headingRad - arrowHeadAngle),
          endY + arrowHeadLength * Math.cos(headingRad - arrowHeadAngle),
        )
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - arrowHeadLength * Math.sin(headingRad + arrowHeadAngle),
          endY + arrowHeadLength * Math.cos(headingRad + arrowHeadAngle),
        )
        ctx.stroke()
      }

      ctx.restore()
    }

    // Notify parent that render is complete
    onRender?.()
  }, [
    canvasRef,
    mapSize,
    theme,
    mapState,
    latLngToTile,
    mapType,
    getTile,
    showTrail,
    locationHistory,
    latLngToPixel,
    showPetrolPumps,
    petrolPumps,
    selectedPump,
    currentPosition,
    accuracy,
    isTracking,
    heading,
    deg2rad,
    onRender,
  ])

  // Handle canvas click for pump selection
  const handleCanvasClick = useCallback(
    (event: MouseEvent) => {
      if (!onPumpClick || !showPetrolPumps || !petrolPumps || petrolPumps.length === 0) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const clickY = event.clientY - rect.top

      // Check if click is near any pump
      for (const pump of petrolPumps) {
        if (!pump || !pump.geometry || !pump.geometry.location) {
          continue
        }

        const location = pump.geometry.location
        if (typeof location.lat !== "number" || typeof location.lng !== "number") {
          continue
        }

        const pixel = latLngToPixel(location.lat, location.lng)
        const distance = Math.sqrt(Math.pow(clickX - pixel.x, 2) + Math.pow(clickY - pixel.y, 2))

        if (distance <= 20) {
          // 20px click radius
          onPumpClick(pump)
          break
        }
      }
    },
    [onPumpClick, showPetrolPumps, petrolPumps, canvasRef, latLngToPixel],
  )

  // Add click event listener
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener("click", handleCanvasClick)
    return () => canvas.removeEventListener("click", handleCanvasClick)
  }, [handleCanvasClick])

  // Animation loop for smooth updates
  useEffect(() => {
    if (!isTracking) return

    const animate = () => {
      render()
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isTracking, render])

  // Expose render function
  useEffect(() => {
    render()
  }, [render])

  return null
}
