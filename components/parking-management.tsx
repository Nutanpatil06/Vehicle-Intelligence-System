"use client"

import { useState, useEffect } from "react"
import { Clock, Car, ChevronRight, AlertCircle } from "lucide-react"

interface ParkingBooking {
  id: string
  location: string
  startTime: Date
  endTime: Date
  cost: number
  status: "active" | "expiring" | "completed" | "cancelled"
}

interface ParkingManagementProps {
  isLoggedIn: boolean
  onClose?: () => void
}

const ParkingManagement = ({ isLoggedIn, onClose }: ParkingManagementProps) => {
  const [activeBooking, setActiveBooking] = useState<ParkingBooking | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [expanded, setExpanded] = useState(false)

  // Simulate fetching active booking
  useEffect(() => {
    if (isLoggedIn) {
      // Mock data - in a real app, this would come from an API
      const mockBooking: ParkingBooking = {
        id: "PK" + Math.floor(Math.random() * 10000),
        location: "City Center Parking, MG Road",
        startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        endTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        cost: 50, // ₹50
        status: "active",
      }
      setActiveBooking(mockBooking)
    } else {
      setActiveBooking(null)
    }
  }, [isLoggedIn])

  // Update time remaining
  useEffect(() => {
    if (!activeBooking) return

    const updateTimeRemaining = () => {
      const now = new Date()
      const diff = activeBooking.endTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining("Expired")
        return
      }

      const minutes = Math.floor(diff / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      // Update status if less than 10 minutes remaining
      if (minutes < 10 && activeBooking.status === "active") {
        setActiveBooking({ ...activeBooking, status: "expiring" })
      }

      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`)
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 1000)
    return () => clearInterval(interval)
  }, [activeBooking])

  if (!isLoggedIn || !activeBooking) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "expiring":
        return "bg-orange-500"
      case "completed":
        return "bg-blue-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleExtendBooking = () => {
    // In a real app, this would call an API to extend the booking
    const newEndTime = new Date(activeBooking.endTime.getTime() + 60 * 60 * 1000) // Add 1 hour
    setActiveBooking({
      ...activeBooking,
      endTime: newEndTime,
      cost: activeBooking.cost + 50, // Add ₹50 for an extra hour
      status: "active",
    })
  }

  const handleCancelBooking = () => {
    // In a real app, this would call an API to cancel the booking
    setActiveBooking({
      ...activeBooking,
      status: "cancelled",
    })

    // Close the expanded view
    setExpanded(false)

    // After a delay, remove the booking
    setTimeout(() => {
      setActiveBooking(null)
    }, 3000)
  }

  return (
    <div className={`bg-white dark:bg-gray-900 shadow-md transition-all duration-300 ${expanded ? "pb-4" : ""}`}>
      {/* Collapsed view */}
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(activeBooking.status)}`}></div>
          <Car className="w-5 h-5 text-orange-500 mr-2" />
          <span className="font-medium text-gray-800 dark:text-gray-200">Active Parking</span>
        </div>

        <div className="flex items-center">
          <div className="flex items-center mr-3">
            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
            <span
              className={`text-sm font-medium ${activeBooking.status === "expiring" ? "text-orange-500" : "text-gray-700 dark:text-gray-300"}`}
            >
              {timeRemaining}
            </span>
          </div>
          <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="px-4 pb-2 animate-fadeIn">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">{activeBooking.location}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Booking ID: {activeBooking.id}</p>
              </div>
              <div
                className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(activeBooking.status)}`}
              >
                {activeBooking.status.charAt(0).toUpperCase() + activeBooking.status.slice(1)}
              </div>
            </div>

            <div className="flex justify-between text-sm mb-2">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Start:</span>
                <span className="ml-1 text-gray-700 dark:text-gray-300">
                  {activeBooking.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">End:</span>
                <span className="ml-1 text-gray-700 dark:text-gray-300">
                  {activeBooking.endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Cost:</span>
                <span className="ml-1 text-gray-700 dark:text-gray-300">₹{activeBooking.cost}</span>
              </div>
            </div>

            {activeBooking.status === "expiring" && (
              <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded p-2 mb-3 flex items-start">
                <AlertCircle className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Your parking session is about to expire. Extend now to avoid penalties.
                </p>
              </div>
            )}

            <div className="flex space-x-2 mt-3">
              <button
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                onClick={handleExtendBooking}
              >
                Extend Parking
              </button>
              <button
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={handleCancelBooking}
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="text-center">
            <button className="text-sm text-orange-500 font-medium" onClick={() => setExpanded(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParkingManagement
