"use client"

import { useState } from "react"
import { Camera, Key, Shield, ExternalLink, LogOut, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileSettingsProps {
  userProfile: {
    name: string
    email: string
    photo?: string
  } | null
  onUpdateProfile: (profile: any) => void
  onLogout: () => void
}

export default function ProfileSettings({ userProfile, onUpdateProfile, onLogout }: ProfileSettingsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: userProfile?.name || "",
    email: userProfile?.email || "",
    phone: "",
    bio: "",
  })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const handleSave = () => {
    onUpdateProfile({
      ...userProfile,
      name: formData.name,
      email: formData.email,
    })
    setIsEditing(false)
  }

  const handlePhotoUpload = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const photoUrl = e.target?.result as string
          onUpdateProfile({
            ...userProfile,
            photo: photoUrl,
          })
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Profile & Account</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Manage your personal information and account settings</p>
      </div>

      {/* Profile Picture & Basic Info */}
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={userProfile?.photo || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">{userProfile?.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              variant="outline"
              className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-transparent"
              onClick={handlePhotoUpload}
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{userProfile?.name || "User"}</h3>
            <p className="text-gray-600 dark:text-gray-400">{userProfile?.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Member since December 2023</p>
          </div>
          <Button variant={isEditing ? "default" : "outline"} onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      )}

      <Separator />

      {/* Security Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-orange-500" />
          Security
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Key className="w-5 h-5 mr-3 text-blue-500" />
              <div>
                <Label className="font-medium">Change Password</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Update your account password</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Change
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Shield className="w-5 h-5 mr-3 text-green-500" />
              <div>
                <Label className="font-medium">Two-Factor Authentication</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
              </div>
            </div>
            <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Connected Accounts */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Connected Accounts</h3>
        <div className="space-y-3">
          {[
            { name: "Google", connected: true, icon: "🔗" },
            { name: "Facebook", connected: false, icon: "📘" },
            { name: "Apple", connected: false, icon: "🍎" },
          ].map((account) => (
            <div
              key={account.name}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">{account.icon}</span>
                <div>
                  <Label className="font-medium">{account.name}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {account.connected ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                {account.connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Account Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Export My Data
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <ExternalLink className="w-4 h-4 mr-2" />
            Privacy Policy
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <ExternalLink className="w-4 h-4 mr-2" />
            Terms of Service
          </Button>
        </div>
      </div>

      <Separator />

      {/* Danger Zone */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Danger Zone</h3>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Deactivate Account
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
