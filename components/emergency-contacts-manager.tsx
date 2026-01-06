"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Edit2, Trash2, Phone, Mail, Star, User, Shield, AlertTriangle } from "lucide-react"
import ResponsiveButton from "@/components/ui/responsive-button"
import useEmergencyContacts, { type EmergencyContact } from "@/hooks/use-emergency-contacts"

interface EmergencyContactsManagerProps {
  onClose?: () => void
}

const EmergencyContactsManager = ({ onClose }: EmergencyContactsManagerProps) => {
  const { contacts, addContact, updateContact, removeContact, setPrimaryContact } = useEmergencyContacts()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    relationship: "",
    isPrimary: false,
    isActive: true,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      relationship: "",
      isPrimary: false,
      isActive: true,
    })
    setShowAddForm(false)
    setEditingContact(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.phone.trim()) {
      alert("Name and phone number are required")
      return
    }

    if (editingContact) {
      updateContact(editingContact.id, formData)
    } else {
      addContact(formData)
    }

    resetForm()
  }

  const handleEdit = (contact: EmergencyContact) => {
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || "",
      relationship: contact.relationship,
      isPrimary: contact.isPrimary,
      isActive: contact.isActive,
    })
    setEditingContact(contact)
    setShowAddForm(true)
  }

  const handleDelete = (contact: EmergencyContact) => {
    if (contact.phone === "911") {
      alert("Cannot delete emergency services contact")
      return
    }

    if (confirm(`Are you sure you want to delete ${contact.name}?`)) {
      removeContact(contact.id)
    }
  }

  const handleSetPrimary = (contact: EmergencyContact) => {
    setPrimaryContact(contact.id)
  }

  const relationshipOptions = [
    "Family Member",
    "Spouse/Partner",
    "Parent",
    "Child",
    "Sibling",
    "Friend",
    "Colleague",
    "Doctor",
    "Emergency Services",
    "Other",
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield className="w-6 h-6 text-red-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Emergency Contacts</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        )}
      </div>

      {/* Warning message */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">Important Safety Information</h3>
            <p className="text-red-700 dark:text-red-400 text-sm">
              These contacts will be notified immediately when you activate the SOS button. Make sure all information is
              current and accurate. In a real emergency, always call 911 first.
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">
            {editingContact ? "Edit Contact" : "Add Emergency Contact"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship</label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                >
                  <option value="">Select relationship</option>
                  {relationshipOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Primary contact (called first)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
            </div>

            <div className="flex space-x-3">
              <ResponsiveButton type="submit" variant="primary" size="md">
                {editingContact ? "Update Contact" : "Add Contact"}
              </ResponsiveButton>
              <ResponsiveButton type="button" variant="outline" size="md" onClick={resetForm}>
                Cancel
              </ResponsiveButton>
            </div>
          </form>
        </div>
      )}

      {/* Add Contact Button */}
      {!showAddForm && (
        <div className="mb-6">
          <ResponsiveButton
            variant="primary"
            size="md"
            onClick={() => setShowAddForm(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Emergency Contact
          </ResponsiveButton>
        </div>
      )}

      {/* Contacts List */}
      <div className="space-y-3">
        {contacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No emergency contacts configured</p>
            <p className="text-sm">Add contacts to enable SOS functionality</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-4 rounded-lg border ${
                contact.isActive
                  ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  : "bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">{contact.name}</h3>
                      {contact.isPrimary && <Star className="w-4 h-4 text-yellow-500 ml-2" title="Primary contact" />}
                      {!contact.isActive && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-4">
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {contact.phone}
                      </div>
                      {contact.email && (
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {contact.email}
                        </div>
                      )}
                      {contact.relationship && (
                        <div className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          {contact.relationship}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {!contact.isPrimary && contact.phone !== "911" && (
                    <button
                      onClick={() => handleSetPrimary(contact)}
                      className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                      title="Set as primary"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(contact)}
                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Edit contact"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {contact.phone !== "911" && (
                    <button
                      onClick={() => handleDelete(contact)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default EmergencyContactsManager
