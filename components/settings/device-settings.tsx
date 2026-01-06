"use client"

import { Bluetooth, MapPin, Wifi, HardDrive, Smartphone, Zap, Database } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type { UserSettings } from "@/hooks/use-settings"

interface DeviceSettingsProps {
  settings: UserSettings["device"]
  onUpdate: (updates: Partial<UserSettings["device"]>) => void
  bluetoothStatus?: {
    supported: boolean
    connected: boolean
    device?: any
    quality?: string
    error?: string
    permission?: any
  }
  gpsStatus?: {
    tracking: boolean
    accuracy?: number
    position?: any
    speed?: number
    error?: string
    hasPermission: boolean
  }
}

export default function DeviceSettings({ settings, onUpdate, bluetoothStatus, gpsStatus }: DeviceSettingsProps) {
  const getCacheUsage = () => {
    // Simulate cache usage calculation
    const sizes = { small: 50, medium: 150, large: 300 }
    return sizes[settings.cacheSize]
  }

  const clearCache = () => {
    // Simulate cache clearing
    alert("Cache cleared successfully!")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Device & Connectivity</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Manage device connections and performance settings</p>
      </div>

      {/* Bluetooth Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Bluetooth className="w-5 h-5 mr-2 text-orange-500" />
          Bluetooth
        </h3>
        <div className="space-y-4">
          {/* Bluetooth Status */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <Label className="font-medium">Connection Status</Label>
              <div className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    bluetoothStatus?.connected ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-sm">{bluetoothStatus?.connected ? "Connected" : "Disconnected"}</span>
              </div>
            </div>
            {bluetoothStatus?.connected && bluetoothStatus.device && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Device: {bluetoothStatus.device.name}</p>
                <p>Signal: {bluetoothStatus.quality}</p>
              </div>
            )}
            {bluetoothStatus?.error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">{bluetoothStatus.error}</p>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="font-medium">Auto-Connect</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically connect to known devices when available
              </p>
            </div>
            <Switch
              checked={settings.bluetoothAutoConnect}
              onCheckedChange={(checked) => onUpdate({ bluetoothAutoConnect: checked })}
            />
          </div>
        </div>
      </div>

      {/* GPS Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-orange-500" />
          GPS & Location
        </h3>
        <div className="space-y-4">
          {/* GPS Status */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <Label className="font-medium">GPS Status</Label>
              <div className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    gpsStatus?.tracking ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-sm">{gpsStatus?.tracking ? "Active" : "Inactive"}</span>
              </div>
            </div>
            {gpsStatus?.tracking && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Accuracy: ±{gpsStatus.accuracy ? Math.round(gpsStatus.accuracy) : "Unknown"}m</p>
                {gpsStatus.speed && <p>Speed: {Math.round(gpsStatus.speed * 3.6)} km/h</p>}
              </div>
            )}
            {gpsStatus?.error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{gpsStatus.error}</p>}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="font-medium">High Accuracy Mode</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use GPS, Wi-Fi, and mobile networks for precise location
              </p>
            </div>
            <Switch
              checked={settings.gpsHighAccuracy}
              onCheckedChange={(checked) => onUpdate({ gpsHighAccuracy: checked })}
            />
          </div>
        </div>
      </div>

      {/* Performance Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-orange-500" />
          Performance
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="font-medium">Background Sync</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Keep data synchronized when app is in background
              </p>
            </div>
            <Switch
              checked={settings.backgroundSync}
              onCheckedChange={(checked) => onUpdate({ backgroundSync: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="font-medium">Battery Optimization</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">Reduce power consumption when battery is low</p>
            </div>
            <Switch
              checked={settings.batteryOptimization}
              onCheckedChange={(checked) => onUpdate({ batteryOptimization: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="font-medium">Offline Mode</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enable offline functionality when no internet connection
              </p>
            </div>
            <Switch checked={settings.offlineMode} onCheckedChange={(checked) => onUpdate({ offlineMode: checked })} />
          </div>
        </div>
      </div>

      {/* Storage Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <HardDrive className="w-5 h-5 mr-2 text-orange-500" />
          Storage
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <Label className="font-medium">Cache Size</Label>
              <span className="text-sm text-gray-600 dark:text-gray-400">{getCacheUsage()} MB used</span>
            </div>
            <Select
              value={settings.cacheSize}
              onValueChange={(value: "small" | "medium" | "large") => onUpdate({ cacheSize: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">
                  <div>
                    <div className="font-medium">Small (50 MB)</div>
                    <div className="text-sm text-gray-600">Minimal storage, frequent downloads</div>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div>
                    <div className="font-medium">Medium (150 MB)</div>
                    <div className="text-sm text-gray-600">Balanced performance and storage</div>
                  </div>
                </SelectItem>
                <SelectItem value="large">
                  <div>
                    <div className="font-medium">Large (300 MB)</div>
                    <div className="text-sm text-gray-600">Maximum performance, more storage</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Progress value={(getCacheUsage() / 300) * 100} className="mt-3" />
          </div>

          <Button variant="outline" onClick={clearCache} className="w-full bg-transparent">
            <Database className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Data Usage */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Wifi className="w-5 h-5 mr-2 text-orange-500" />
          Data Usage
        </h3>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Label className="mb-3 block font-medium">Data Usage Policy</Label>
          <Select
            value={settings.dataUsage}
            onValueChange={(value: "unlimited" | "wifi-only" | "limited") => onUpdate({ dataUsage: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unlimited">
                <div>
                  <div className="font-medium">Unlimited</div>
                  <div className="text-sm text-gray-600">Use mobile data freely</div>
                </div>
              </SelectItem>
              <SelectItem value="wifi-only">
                <div>
                  <div className="font-medium">Wi-Fi Only</div>
                  <div className="text-sm text-gray-600">Only sync when connected to Wi-Fi</div>
                </div>
              </SelectItem>
              <SelectItem value="limited">
                <div>
                  <div className="font-medium">Limited</div>
                  <div className="text-sm text-gray-600">Reduce data usage on mobile networks</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Device Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Smartphone className="w-5 h-5 mr-2 text-orange-500" />
          Device Information
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">Browser</p>
            <p className="font-medium">{navigator.userAgent.includes("Chrome") ? "Chrome" : "Other"}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">Platform</p>
            <p className="font-medium">{navigator.platform}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">Language</p>
            <p className="font-medium">{navigator.language}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">Online Status</p>
            <p className="font-medium">{navigator.onLine ? "Online" : "Offline"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
