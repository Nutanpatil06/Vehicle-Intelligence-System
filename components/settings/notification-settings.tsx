"use client"

import { Bell, Mail, MessageSquare, Clock, Volume2, Vibrate } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserSettings } from "@/hooks/use-settings"

interface NotificationSettingsProps {
  settings: UserSettings["notifications"]
  onUpdate: (updates: Partial<UserSettings["notifications"]>) => void
}

export default function NotificationSettings({ settings, onUpdate }: NotificationSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Notification Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Manage how and when you receive notifications</p>
      </div>

      {/* Delivery Methods */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-orange-500" />
          Delivery Methods
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Bell className="w-5 h-5 mr-3 text-blue-500" />
              <div>
                <Label className="font-medium">Push Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications on this device</p>
              </div>
            </div>
            <Switch checked={settings.pushEnabled} onCheckedChange={(checked) => onUpdate({ pushEnabled: checked })} />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-3 text-green-500" />
              <div>
                <Label className="font-medium">Email Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => onUpdate({ emailEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-3 text-purple-500" />
              <div>
                <Label className="font-medium">SMS Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via text message</p>
              </div>
            </div>
            <Switch checked={settings.smsEnabled} onCheckedChange={(checked) => onUpdate({ smsEnabled: checked })} />
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Notification Types</h3>
        <div className="space-y-4">
          {[
            {
              key: "emergencyAlerts",
              label: "Emergency Alerts",
              description: "Critical safety notifications",
              color: "text-red-500",
            },
            {
              key: "maintenanceReminders",
              label: "Maintenance Reminders",
              description: "Vehicle service notifications",
              color: "text-blue-500",
            },
            {
              key: "fuelAlerts",
              label: "Fuel Alerts",
              description: "Low fuel and nearby stations",
              color: "text-yellow-500",
            },
            {
              key: "parkingReminders",
              label: "Parking Reminders",
              description: "Parking expiry and location",
              color: "text-green-500",
            },
            {
              key: "trafficUpdates",
              label: "Traffic Updates",
              description: "Route and traffic information",
              color: "text-purple-500",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
              </div>
              <Switch
                checked={settings[item.key as keyof typeof settings] as boolean}
                onCheckedChange={(checked) => onUpdate({ [item.key]: checked })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-orange-500" />
          Quiet Hours
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="font-medium">Enable Quiet Hours</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Silence non-emergency notifications during specified hours
              </p>
            </div>
            <Switch
              checked={settings.quietHoursEnabled}
              onCheckedChange={(checked) => onUpdate({ quietHoursEnabled: checked })}
            />
          </div>

          {settings.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="mb-2 block">Start Time</Label>
                <Select
                  value={settings.quietHoursStart}
                  onValueChange={(value) => onUpdate({ quietHoursStart: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, "0")
                      return (
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                          {`${hour}:00`}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">End Time</Label>
                <Select value={settings.quietHoursEnd} onValueChange={(value) => onUpdate({ quietHoursEnd: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, "0")
                      return (
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                          {`${hour}:00`}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sound & Vibration */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Volume2 className="w-5 h-5 mr-2 text-orange-500" />
          Sound & Vibration
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Volume2 className="w-5 h-5 mr-3 text-blue-500" />
              <div>
                <Label className="font-medium">Sound</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Play notification sounds</p>
              </div>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => onUpdate({ soundEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Vibrate className="w-5 h-5 mr-3 text-purple-500" />
              <div>
                <Label className="font-medium">Vibration</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vibrate for notifications</p>
              </div>
            </div>
            <Switch
              checked={settings.vibrationEnabled}
              onCheckedChange={(checked) => onUpdate({ vibrationEnabled: checked })}
            />
          </div>

          {settings.soundEnabled && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Label className="mb-3 block font-medium">Volume Level</Label>
              <div className="flex items-center space-x-4">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <Slider
                  value={[settings.volume]}
                  onValueChange={([value]) => onUpdate({ volume: value })}
                  max={100}
                  step={10}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-8">{settings.volume}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
