"use client"

import { useState, useCallback } from "react"

interface MapState {
  centerLat: number
  centerLng: number
  zoom: number
  userInteracted: boolean
  followUser: boolean
}

interface UseMapStateReturn {
  mapState: MapState
  updateCenter: (lat: number, lng: number) => void
  updateZoom: (zoom: number) => void
  setUserInteracted: (interacted: boolean) => void
  setFollowUser: (follow: boolean) => void
  centerOnUser: (lat: number, lng: number) => void
}

export const useMapState = (initialLat = 0, initialLng = 0, initialZoom = 16): UseMapStateReturn => {
  const [mapState, setMapState] = useState<MapState>({
    centerLat: initialLat,
    centerLng: initialLng,
    zoom: initialZoom,
    userInteracted: false,
    followUser: true,
  })

  const updateCenter = useCallback((lat: number, lng: number) => {
    setMapState((prev) => ({
      ...prev,
      centerLat: lat,
      centerLng: lng,
    }))
  }, [])

  const updateZoom = useCallback((zoom: number) => {
    setMapState((prev) => ({
      ...prev,
      zoom: Math.max(1, Math.min(18, zoom)),
    }))
  }, [])

  const setUserInteracted = useCallback((interacted: boolean) => {
    setMapState((prev) => ({
      ...prev,
      userInteracted: interacted,
    }))
  }, [])

  const setFollowUser = useCallback((follow: boolean) => {
    setMapState((prev) => ({
      ...prev,
      followUser: follow,
    }))
  }, [])

  const centerOnUser = useCallback((lat: number, lng: number) => {
    setMapState((prev) => ({
      ...prev,
      centerLat: lat,
      centerLng: lng,
      userInteracted: false,
      followUser: true,
    }))
  }, [])

  return {
    mapState,
    updateCenter,
    updateZoom,
    setUserInteracted,
    setFollowUser,
    centerOnUser,
  }
}
