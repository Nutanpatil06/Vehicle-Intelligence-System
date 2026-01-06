"use client"

import { useRef, useCallback, useEffect } from "react"

interface TileData {
  img: HTMLImageElement
  loaded: boolean
  error: boolean
}

interface UseTileManagerReturn {
  loadTile: (x: number, y: number, z: number, mapType: string) => Promise<HTMLImageElement | null>
  getTile: (key: string) => TileData | undefined
  clearCache: () => void
  preloadTiles: (tiles: Array<{ x: number; y: number; z: number }>, mapType: string) => Promise<void>
}

export const useTileManager = (onTileLoaded?: () => void): UseTileManagerReturn => {
  const tileCache = useRef<Map<string, TileData>>(new Map())
  const loadingTiles = useRef<Set<string>>(new Set())
  const abortControllers = useRef<Map<string, AbortController>>(new Map())

  const getTileUrl = useCallback((x: number, y: number, z: number, mapType: string): string => {
    return mapType === "satellite"
      ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
      : `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
  }, [])

  const loadTile = useCallback(
    async (x: number, y: number, z: number, mapType: string): Promise<HTMLImageElement | null> => {
      const tileKey = `${mapType}-${z}-${x}-${y}`

      // Return cached tile if available
      const cached = tileCache.current.get(tileKey)
      if (cached?.loaded) {
        return cached.img
      }

      // Prevent duplicate loading
      if (loadingTiles.current.has(tileKey)) {
        return null
      }

      loadingTiles.current.add(tileKey)

      // Cancel previous request for this tile
      const existingController = abortControllers.current.get(tileKey)
      if (existingController) {
        existingController.abort()
      }

      const controller = new AbortController()
      abortControllers.current.set(tileKey, controller)

      try {
        const img = new Image()
        img.crossOrigin = "anonymous"

        const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
          img.onload = () => resolve(img)
          img.onerror = () => reject(new Error(`Failed to load tile: ${tileKey}`))

          // Handle abort
          controller.signal.addEventListener("abort", () => {
            reject(new Error("Tile loading aborted"))
          })
        })

        img.src = getTileUrl(x, y, z, mapType)

        const loadedImg = await loadPromise

        // Store in cache
        tileCache.current.set(tileKey, {
          img: loadedImg,
          loaded: true,
          error: false,
        })

        loadingTiles.current.delete(tileKey)
        abortControllers.current.delete(tileKey)

        // Notify that tile loaded
        onTileLoaded?.()

        return loadedImg
      } catch (error) {
        // Store error state
        tileCache.current.set(tileKey, {
          img: new Image(),
          loaded: false,
          error: true,
        })

        loadingTiles.current.delete(tileKey)
        abortControllers.current.delete(tileKey)

        if (!controller.signal.aborted) {
          console.warn(`Failed to load tile: ${tileKey}`, error)
        }

        return null
      }
    },
    [getTileUrl, onTileLoaded],
  )

  const getTile = useCallback((key: string): TileData | undefined => {
    return tileCache.current.get(key)
  }, [])

  const clearCache = useCallback(() => {
    // Abort all ongoing requests
    abortControllers.current.forEach((controller) => controller.abort())
    abortControllers.current.clear()

    // Clear caches
    tileCache.current.clear()
    loadingTiles.current.clear()
  }, [])

  const preloadTiles = useCallback(
    async (tiles: Array<{ x: number; y: number; z: number }>, mapType: string): Promise<void> => {
      const batchSize = 4
      const delay = 10

      for (let i = 0; i < tiles.length; i += batchSize) {
        const batch = tiles.slice(i, i + batchSize)
        await Promise.allSettled(batch.map((tile) => loadTile(tile.x, tile.y, tile.z, mapType)))

        // Small delay between batches to prevent overwhelming the browser
        if (i + batchSize < tiles.length) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    },
    [loadTile],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCache()
    }
  }, [clearCache])

  return {
    loadTile,
    getTile,
    clearCache,
    preloadTiles,
  }
}
