"use client"

import { useState } from "react"
import { ArrowLeft, User, Bell, Shield, Palette, Smartphone, AlertTriangle, Search } from "lucide-react"
import ProfileSettings from "./settings/profile-settings"
import NotificationSettings from "./settings/notification-settings"
import PrivacySettings from "./settings/privacy-settings"
import AppearanceSettings from "./settings/appearance-settings"
import DeviceSettings from "./settings/device-settings"
import { useSettings } from "@/hooks/use-settings"

interface EnhancedSettingsProps {
  userProfile: { name: string; email: string; photo?: string } | null
  onLogout: () => void
  onUpdateProfile: (profile: { name: string; email: string; photo?: string }) => void
  bluetoothStatus: {
    supported: boolean
    connected: boolean
    device: any
    quality: string
    error: string | null
    permission: string
  }
  gpsStatus: {
    tracking: boolean
    accuracy: number | null
    position: { lat: number; lng: number } | null
    speed: number | null
    error: string | null
    hasPermission: boolean
  }
  carData: any
  onConnectCar: (connected: boolean, deviceInfo?: any) => void
  onShowSOSDashboard: () => void
}

const settingsCategories = [
  {
    id: "profile",
    title: "Profile & Account",
    description: "Manage your personal information and account settings",
    icon: User,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Configure alerts, sounds, and notification preferences",
    icon: Bell,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    id: "privacy",
    title: "Privacy & Security",
    description: "Control data sharing, location access, and security settings",
    icon: Shield,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Customize theme, colors, fonts, and accessibility options",
    icon: Palette,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    id: "devices",
    title: "Devices & Connectivity",
    description: "Manage Bluetooth, GPS, and device connection settings",
    icon: Smartphone,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
]

export default function EnhancedSettings({
  userProfile,
  onLogout,
  onUpdateProfile,
  bluetoothStatus,
  gpsStatus,
  carData,
  onConnectCar,
  onShowSOSDashboard,
}: EnhancedSettingsProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { settings } = useSettings()

  const handleBack = () => {
    setActiveCategory(null)
    setSearchQuery("")
  }

  const filteredCategories = settingsCategories.filter(
    (category) =>
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case "profile":
        return (
          <ProfileSettings
            userProfile={userProfile}
            onUpdateProfile={onUpdateProfile}
            onLogout={onLogout}
            onShowSOSDashboard={onShowSOSDashboard}
          />
        )
      case "notifications":
        return <NotificationSettings />
      case "privacy":
        return <PrivacySettings />
      case "appearance":
        return <AppearanceSettings />
      case "devices":
        return (
          <DeviceSettings
            bluetoothStatus={bluetoothStatus}
            gpsStatus={gpsStatus}
            carData={carData}
            onConnectCar={onConnectCar}
          />
        )
      default:
        return null
    }
  }

  if (activeCategory) {
    const category = settingsCategories.find((cat) => cat.id === activeCategory)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-fadeIn">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="px-4 py-4">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-3"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                {category && (
                  <div className={`p-2 rounded-lg mr-3 ${category.bgColor}`}>
                    <category.icon className={`w-5 h-5 ${category.color}`} />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{category?.title}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{category?.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-6">{renderCategoryContent()}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your preferences and account settings</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Settings Categories */}
      <div className="px-4 py-6">
        <div className="space-y-3">
          {filteredCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all hover:shadow-md text-left group"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg mr-4 ${category.bgColor} group-hover:scale-110 transition-transform`}>
                  <category.icon className={`w-6 h-6 ${category.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{category.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {/* Emergency SOS Quick Access */}
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <div className="flex items-center mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">Emergency SOS</h3>
          </div>
          <p className="text-sm text-red-800 dark:text-red-200 mb-4">
            Quick access to emergency features and contact management
          </p>
          <button
            onClick={onShowSOSDashboard}
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Manage Emergency Settings
          </button>
        </div>

        {/* App Info */}
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Vehicle Intelligence</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Version 2.1.0</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Theme: {settings.appearance.theme} • Accent: {settings.appearance.accentColor}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
