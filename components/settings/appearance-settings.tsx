"use client"

import { useState } from "react"
import { Monitor, Moon, Sun, Palette, Type, Eye, Zap } from "lucide-react"
import { useSettings } from "@/hooks/use-settings"
import { useTheme } from "@/context/theme-context"

const accentColors = [
  { name: "Orange", value: "#f97316" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Red", value: "#ef4444" },
  { name: "Yellow", value: "#f59e0b" },
  { name: "Indigo", value: "#6366f1" },
]

export default function AppearanceSettings() {
  const { settings, updateSettings } = useSettings()
  const { theme, resolvedTheme, accentColor, setTheme, setAccentColor } = useTheme()
  const [previewColor, setPreviewColor] = useState<string | null>(null)

  const handleThemeChange = (newTheme: "light" | "dark" | "auto") => {
    setTheme(newTheme)
  }

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color)
    setPreviewColor(null)
  }

  const handleFontSizeChange = (fontSize: "small" | "medium" | "large" | "extra-large") => {
    updateSettings({ appearance: { fontSize } })
  }

  const handleAccessibilityToggle = (setting: "reducedMotion" | "highContrast") => {
    updateSettings({
      appearance: {
        [setting]: !settings.appearance[setting],
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Monitor className="w-5 h-5 mr-2" />
          Theme
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleThemeChange("light")}
            className={`p-4 rounded-xl border-2 transition-all ${
              theme === "light"
                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-sm font-medium">Light</div>
          </button>
          <button
            onClick={() => handleThemeChange("dark")}
            className={`p-4 rounded-xl border-2 transition-all ${
              theme === "dark"
                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <Moon className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-sm font-medium">Dark</div>
          </button>
          <button
            onClick={() => handleThemeChange("auto")}
            className={`p-4 rounded-xl border-2 transition-all ${
              theme === "auto"
                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <Monitor className="w-6 h-6 mx-auto mb-2 text-gray-500" />
            <div className="text-sm font-medium">Auto</div>
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Current: {resolvedTheme === "light" ? "Light" : "Dark"} mode
        </p>
      </div>

      {/* Accent Color */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Palette className="w-5 h-5 mr-2" />
          Accent Color
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {accentColors.map((color) => (
            <button
              key={color.value}
              onClick={() => handleAccentColorChange(color.value)}
              onMouseEnter={() => setPreviewColor(color.value)}
              onMouseLeave={() => setPreviewColor(null)}
              className={`p-3 rounded-xl border-2 transition-all ${
                accentColor === color.value
                  ? "border-gray-400 dark:border-gray-500 scale-105"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
              style={{
                backgroundColor: previewColor === color.value ? `${color.value}20` : undefined,
              }}
            >
              <div
                className="w-8 h-8 rounded-full mx-auto mb-2 border-2 border-white dark:border-gray-800 shadow-sm"
                style={{ backgroundColor: color.value }}
              />
              <div className="text-xs font-medium">{color.name}</div>
            </button>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Preview</span>
            <div
              className="px-3 py-1 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: previewColor || accentColor }}
            >
              Sample Button
            </div>
          </div>
        </div>
      </div>

      {/* Font Size */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Type className="w-5 h-5 mr-2" />
          Font Size
        </h3>
        <div className="space-y-2">
          {[
            { value: "small", label: "Small", size: "text-sm" },
            { value: "medium", label: "Medium", size: "text-base" },
            { value: "large", label: "Large", size: "text-lg" },
            { value: "extra-large", label: "Extra Large", size: "text-xl" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleFontSizeChange(option.value as any)}
              className={`w-full p-3 rounded-lg border text-left transition-all ${
                settings.appearance.fontSize === option.value
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className={`font-medium ${option.size}`}>{option.label}</div>
              <div className={`text-gray-600 dark:text-gray-400 ${option.size}`}>
                Sample text in {option.label.toLowerCase()} size
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          Accessibility
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-3 text-gray-500" />
              <div>
                <div className="font-medium">Reduced Motion</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Minimize animations and transitions</div>
              </div>
            </div>
            <button
              onClick={() => handleAccessibilityToggle("reducedMotion")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.appearance.reducedMotion ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.appearance.reducedMotion ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Eye className="w-5 h-5 mr-3 text-gray-500" />
              <div>
                <div className="font-medium">High Contrast</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Increase contrast for better visibility</div>
              </div>
            </div>
            <button
              onClick={() => handleAccessibilityToggle("highContrast")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.appearance.highContrast ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.appearance.highContrast ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
