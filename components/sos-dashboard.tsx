"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, AlertTriangle, MapPin, Clock, Users, Settings, Plus, Trash2, Edit } from "lucide-react"
import useSOSSystem from "@/hooks/use-sos-system"
import { useEmergencyContacts, type EmergencyContact } from "@/hooks/use-emergency-contacts"
import useEnhancedGPS from "@/hooks/use-enhanced-gps"
import { useSettings } from "@/hooks/use-settings"

interface SOSDashboardProps {
  onClose: () => void
}

export default function SOSDashboard({ onClose }: SOSDashboardProps) {
  const { isActive, currentAlert, alertHistory, cancelSOS, resolveSOS, clearHistory } = useSOSSystem()
  const { contacts, addContact, updateContact, deleteContact, setPrimaryContact, toggleContactActive } =
    useEmergencyContacts()
  const { currentPosition, isTracking, startTracking } = useEnhancedGPS({ enableHighAccuracy: true })
  const { settings, updateSettings } = useSettings()

  const [activeTab, setActiveTab] = useState<"status" | "contacts" | "history" | "settings">("status")
  const [showAddContact, setShowAddContact] = useState(false)
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null)
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    relationship: "",
    email: "",
    notes: "",
  })

  useEffect(() => {
    if (!isTracking) {
      startTracking()
    }
  }, [isTracking, startTracking])

  const handleAddContact = () => {
    if (newContact.name && newContact.phone) {
      addContact({
        ...newContact,
        isPrimary: contacts.length === 0,
        isActive: true,
      })
      setNewContact({ name: "", phone: "", relationship: "", email: "", notes: "" })
      setShowAddContact(false)
    }
  }

  const handleUpdateContact = () => {
    if (editingContact && newContact.name && newContact.phone) {
      updateContact(editingContact.id, newContact)
      setEditingContact(null)
      setNewContact({ name: "", phone: "", relationship: "", email: "", notes: "" })
    }
  }

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact)
    setNewContact({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      email: contact.email || "",
      notes: contact.notes || "",
    })
    setShowAddContact(true)
  }

  const renderStatusTab = () => (
    <div className="space-y-6">
      {/* Current Status */}
      <div
        className={`p-6 rounded-xl border-2 ${isActive ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-green-500 bg-green-50 dark:bg-green-900/20"}`}
      >
        <div className="flex items-center mb-4">
          <div
            className={`p-3 rounded-full mr-4 ${isActive ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30"}`}
          >
            <AlertTriangle
              className={`w-6 h-6 ${isActive ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
            />
          </div>
          <div>
            <h3
              className={`text-xl font-bold ${isActive ? "text-red-900 dark:text-red-100" : "text-green-900 dark:text-green-100"}`}
            >
              {isActive ? "SOS ACTIVE" : "System Ready"}
            </h3>
            <p
              className={`text-sm ${isActive ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}`}
            >
              {isActive ? "Emergency alert is currently active" : "Emergency system is ready for use"}
            </p>
          </div>
        </div>

        {isActive && currentAlert && (
          <div className="space-y-3">
            <div className="flex items-center text-sm text-red-700 dark:text-red-300">
              <Clock className="w-4 h-4 mr-2" />
              <span>Activated: {currentAlert.timestamp.toLocaleString()}</span>
            </div>
            <div className="flex items-center text-sm text-red-700 dark:text-red-300">
              <MapPin className="w-4 h-4 mr-2" />
              <span>
                Location: {currentAlert.location.lat.toFixed(6)}, {currentAlert.location.lng.toFixed(6)}
              </span>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={resolveSOS}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Mark as Resolved
              </button>
              <button
                onClick={cancelSOS}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel Alert
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Location Status */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-3">
          <MapPin className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Location Services</h3>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {currentPosition ? (
            <div>
              <p>✅ GPS Active</p>
              <p className="mt-1">
                Current: {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
              </p>
            </div>
          ) : (
            <p>❌ GPS not available</p>
          )}
        </div>
      </div>

      {/* Emergency Contacts Summary */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Emergency Contacts</h3>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {contacts.filter((c) => c.isActive).length} active
          </span>
        </div>
        <div className="space-y-2">
          {contacts
            .filter((c) => c.isActive)
            .slice(0, 3)
            .map((contact) => (
              <div key={contact.id} className="flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${contact.isPrimary ? "bg-red-500" : "bg-gray-400"}`} />
                <span className="text-gray-900 dark:text-gray-100">{contact.name}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">({contact.phone})</span>
              </div>
            ))}
          {contacts.filter((c) => c.isActive).length > 3 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              +{contacts.filter((c) => c.isActive).length - 3} more contacts
            </p>
          )}
        </div>
      </div>
    </div>
  )

  const renderContactsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Emergency Contacts</h3>
        <button
          onClick={() => setShowAddContact(true)}
          className="flex items-center px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </button>
      </div>

      {showAddContact && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {editingContact ? "Edit Contact" : "Add New Contact"}
          </h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Full Name"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <input
              type="text"
              placeholder="Relationship (e.g., Spouse, Parent)"
              value={newContact.relationship}
              onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <textarea
              placeholder="Notes (optional)"
              value={newContact.notes}
              onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={2}
            />
            <div className="flex gap-3">
              <button
                onClick={editingContact ? handleUpdateContact : handleAddContact}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                {editingContact ? "Update" : "Add"} Contact
              </button>
              <button
                onClick={() => {
                  setShowAddContact(false)
                  setEditingContact(null)
                  setNewContact({ name: "", phone: "", relationship: "", email: "", notes: "" })
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{contact.name}</h4>
                  {contact.isPrimary && (
                    <span className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs rounded-full">
                      Primary
                    </span>
                  )}
                  {!contact.isActive && (
                    <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{contact.phone}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">{contact.relationship}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditContact(contact)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => toggleContactActive(contact.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    contact.isActive
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {contact.isActive ? "Active" : "Inactive"}
                </button>
                {!contact.isPrimary && (
                  <button
                    onClick={() => deleteContact(contact.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderHistoryTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Alert History</h3>
        {alertHistory.length > 0 && (
          <button
            onClick={clearHistory}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {alertHistory.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No emergency alerts in history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertHistory.map((alert) => (
            <div
              key={alert.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 ${
                      alert.status === "active"
                        ? "bg-red-500"
                        : alert.status === "resolved"
                          ? "bg-green-500"
                          : "bg-gray-500"
                    }`}
                  />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {alert.status === "active" ? "Active" : alert.status === "resolved" ? "Resolved" : "Cancelled"}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{alert.timestamp.toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{alert.message}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Location: {alert.location.lat.toFixed(6)}, {alert.location.lng.toFixed(6)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Emergency Message</h3>
        <textarea
          value={settings.emergency.emergencyMessage}
          onChange={(e) => updateSettings({ emergency: { emergencyMessage: e.target.value } })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          rows={3}
          placeholder="Enter the message to send during emergencies..."
        />
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          This message will be sent to your emergency contacts when SOS is activated
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Auto-call Emergency Services</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automatically call 911 when SOS is activated</p>
          </div>
          <button
            onClick={() => updateSettings({ emergency: { autoCallEmergency: !settings.emergency.autoCallEmergency } })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.emergency.autoCallEmergency ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.emergency.autoCallEmergency ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Share Location with Contacts</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Send your location to emergency contacts</p>
          </div>
          <button
            onClick={() =>
              updateSettings({
                emergency: { shareLocationWithContacts: !settings.emergency.shareLocationWithContacts },
              })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.emergency.shareLocationWithContacts ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.emergency.shareLocationWithContacts ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-3"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Emergency SOS</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage emergency settings and contacts</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { id: "status", label: "Status", icon: AlertTriangle },
              { id: "contacts", label: "Contacts", icon: Users },
              { id: "history", label: "History", icon: Clock },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {activeTab === "status" && renderStatusTab()}
        {activeTab === "contacts" && renderContactsTab()}
        {activeTab === "history" && renderHistoryTab()}
        {activeTab === "settings" && renderSettingsTab()}
      </div>
    </div>
  )
}
