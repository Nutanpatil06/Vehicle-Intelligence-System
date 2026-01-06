"use client"

import { useState, useEffect, useCallback } from "react"

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
  isPrimary: boolean
  isActive: boolean
  email?: string
  notes?: string
}

const defaultContacts: EmergencyContact[] = [
  {
    id: "1",
    name: "Emergency Services",
    phone: "911",
    relationship: "Emergency",
    isPrimary: true,
    isActive: true,
    notes: "Primary emergency contact",
  },
]

export function useEmergencyContacts() {
  // Changed back to named export
  const [contacts, setContacts] = useState<EmergencyContact[]>(defaultContacts)
  const [isLoading, setIsLoading] = useState(true)

  // Load contacts from localStorage on mount
  useEffect(() => {
    try {
      const savedContacts = localStorage.getItem("emergency-contacts")
      if (savedContacts) {
        const parsed = JSON.parse(savedContacts)
        setContacts(parsed.length > 0 ? parsed : defaultContacts)
      }
    } catch (error) {
      console.error("Failed to load emergency contacts:", error)
      setContacts(defaultContacts)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save contacts to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem("emergency-contacts", JSON.stringify(contacts))
      } catch (error) {
        console.error("Failed to save emergency contacts:", error)
      }
    }
  }, [contacts, isLoading])

  const addContact = useCallback((contact: Omit<EmergencyContact, "id">) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: Date.now().toString(),
    }
    setContacts((prev) => [...prev, newContact])
    return newContact.id
  }, [])

  const updateContact = useCallback((id: string, updates: Partial<EmergencyContact>) => {
    setContacts((prev) => prev.map((contact) => (contact.id === id ? { ...contact, ...updates } : contact)))
  }, [])

  const deleteContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((contact) => contact.id !== id))
  }, [])

  const setPrimaryContact = useCallback((id: string) => {
    setContacts((prev) =>
      prev.map((contact) => ({
        ...contact,
        isPrimary: contact.id === id,
      })),
    )
  }, [])

  const toggleContactActive = useCallback((id: string) => {
    setContacts((prev) =>
      prev.map((contact) => (contact.id === id ? { ...contact, isActive: !contact.isActive } : contact)),
    )
  }, [])

  const getActiveContacts = useCallback(() => {
    return contacts.filter((contact) => contact.isActive)
  }, [contacts])

  const getPrimaryContact = useCallback(() => {
    return contacts.find((contact) => contact.isPrimary && contact.isActive)
  }, [contacts])

  const getContactById = useCallback(
    (id: string) => {
      return contacts.find((contact) => contact.id === id)
    },
    [contacts],
  )

  return {
    contacts,
    isLoading,
    addContact,
    updateContact,
    deleteContact,
    setPrimaryContact,
    toggleContactActive,
    getActiveContacts,
    getPrimaryContact,
    getContactById,
  }
}
