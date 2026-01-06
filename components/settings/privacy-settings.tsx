"use client"

import { Shield, MapPin, BarChart3, Share2, Clock, Eye, Database, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { UserSettings } from "@/hooks/use-settings"

interface PrivacySettingsProps {
  settings: UserSettings["privacy"]
  onUpdate: (updates: Partial<UserSettings["privacy"]>) => void
}

export default function PrivacySettings({ settings, onUpdate }: PrivacySettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Privacy & Security</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Control how your data is collected, used, and shared</p>
      </div>

      {/* Location Privacy */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-orange-500" />
          Location Privacy
        </h3>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Label className="mb-3 block font-medium">Location Sharing</Label>
          <Select
            value={settings.locationSharing}
            onValueChange={(value: "precise" | "approximate" | "disabled") => onUpdate({ locationSharing: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="precise">
                <div>
                  <div className="font-medium">Precise Location</div>
                  <div className="text-sm text-gray-600">Share exact GPS coordinates for full functionality</div>
                </div>
              </SelectItem>
              <SelectItem value="approximate">
                <div>
                  <div className="font-medium">Approximate Location</div>
                  <div className="text-sm text-gray-600">Share general area only (reduced accuracy)</div>
                </div>
              </SelectItem>
              <SelectItem value="disabled">
                <div>
                  <div className="font-medium">Disabled</div>
                  <div className="text-sm text-gray-600">Don't share location (limited functionality)</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Location data is used for navigation, nearby services, and emergency features
          </p>
        </div>
      </div>

      {/* Data Collection */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-orange-500" />
          Data Collection
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="font-medium">Analytics & Usage Data</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Help improve the app by sharing anonymous usage statistics
              </p>
            </div>
            <Switch
              checked={settings.analyticsEnabled}
              onCheckedChange={(checked) => onUpdate({ analyticsEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="font-medium">Crash Reporting</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically send crash reports to help fix bugs
              </p>
            </div>
            <Switch
              checked={settings.crashReportingEnabled}
              onCheckedChange={(checked) => onUpdate({ crashReportingEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="font-medium">Activity Tracking</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track app usage patterns to personalize your experience
              </p>
            </div>
            <Switch
              checked={settings.activityTracking}
              onCheckedChange={(checked) => onUpdate({ activityTracking: checked })}
            />
          </div>
        </div>
      </div>

      {/* Third-Party Sharing */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Share2 className="w-5 h-5 mr-2 text-orange-500" />
          Third-Party Sharing
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="font-medium">Share with Partners</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share anonymized data with trusted partners for service improvements
              </p>
            </div>
            <Switch
              checked={settings.thirdPartySharing}
              onCheckedChange={(checked) => onUpdate({ thirdPartySharing: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="font-medium">Personalized Ads</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use your data to show more relevant advertisements
              </p>
            </div>
            <Switch
              checked={settings.personalizedAds}
              onCheckedChange={(checked) => onUpdate({ personalizedAds: checked })}
            />
          </div>
        </div>
      </div>

      {/* Data Retention */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-orange-500" />
          Data Retention
        </h3>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Label className="mb-3 block font-medium">Keep My Data For</Label>
          <Select
            value={settings.dataRetention}
            onValueChange={(value: "1month" | "6months" | "1year" | "indefinite") => onUpdate({ dataRetention: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
              <SelectItem value="indefinite">Indefinitely</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Data will be automatically deleted after the selected period
          </p>
        </div>
      </div>

      <Separator />

      {/* Privacy Tools */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Eye className="w-5 h-5 mr-2 text-orange-500" />
          Privacy Tools
        </h3>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <Database className="w-4 h-4 mr-2" />
            Download My Data
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <Eye className="w-4 h-4 mr-2" />
            View Data Usage Report
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <Shield className="w-4 h-4 mr-2" />
            Privacy Checkup
          </Button>
        </div>
      </div>

      <Separator />

      {/* Data Management */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Data Management</h3>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start text-orange-600 border-orange-200 hover:bg-orange-50 bg-transparent"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Cache & Temporary Data
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All My Data
          </Button>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Your Privacy Matters</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              We're committed to protecting your privacy. Your data is encrypted, never sold to third parties, and you
              have full control over what information you share.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
