"use client"

import { useState } from "react"
import { Calendar, Clock, MapPin, CreditCard, Check } from "lucide-react"
import { formatPrice } from "@/utils/map-utils"

interface ParkingBookingProps {
  parkingSpot: {
    id: string
    name: string
    address: string
    price: number
    availableSpots: number
  }
  onClose: () => void
  onBookingComplete: (bookingId: string) => void
}

const ParkingBooking = ({ parkingSpot, onClose, onBookingComplete }: ParkingBookingProps) => {
  const [duration, setDuration] = useState(1) // hours
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [startTime, setStartTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
  )
  const [paymentMethod, setPaymentMethod] = useState<string>("upi")
  const [isBooking, setIsBooking] = useState(false)
  const [step, setStep] = useState(1)

  const totalCost = parkingSpot.price * duration

  const handleBooking = () => {
    setIsBooking(true)

    // Simulate API call
    setTimeout(() => {
      setIsBooking(false)
      setStep(2) // Move to confirmation step

      // Generate a random booking ID
      const bookingId = "PK" + Math.floor(Math.random() * 10000)

      // After showing confirmation, notify parent component
      setTimeout(() => {
        onBookingComplete(bookingId)
      }, 2000)
    }, 1500)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md animate-fadeIn">
      {step === 1 ? (
        <>
          <div className="p-4 bg-orange-500 text-white">
            <h2 className="text-xl font-bold">Book Parking</h2>
            <p className="text-sm opacity-90">{parkingSpot.name}</p>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                <h3 className="font-medium text-gray-800 dark:text-gray-200">{parkingSpot.address}</h3>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm py-1 px-2 rounded inline-block">
                {parkingSpot.availableSpots} spots available
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="time"
                    className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4].map((hours) => (
                    <button
                      key={hours}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                        duration === hours
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                      onClick={() => setDuration(hours)}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <div
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                      paymentMethod === "upi"
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    onClick={() => setPaymentMethod("upi")}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-3">
                        <span className="text-green-600 dark:text-green-300 text-xs font-bold">UPI</span>
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">UPI Payment</span>
                    </div>
                    {paymentMethod === "upi" && <Check className="w-5 h-5 text-orange-500" />}
                  </div>

                  <div
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                      paymentMethod === "card"
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-3">
                        <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">Credit/Debit Card</span>
                    </div>
                    {paymentMethod === "card" && <Check className="w-5 h-5 text-orange-500" />}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Rate</span>
                <span className="text-gray-800 dark:text-gray-200">{formatPrice(parkingSpot.price)}/hour</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Duration</span>
                <span className="text-gray-800 dark:text-gray-200">
                  {duration} hour{duration > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-gray-800 dark:text-gray-200">Total</span>
                <span className="text-orange-500">{formatPrice(totalCost)}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-medium disabled:opacity-70"
                onClick={handleBooking}
                disabled={isBooking}
              >
                {isBooking ? "Processing..." : "Book Now"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your parking has been booked successfully at {parkingSpot.name}.
          </p>
          <button className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium" onClick={onClose}>
            Done
          </button>
        </div>
      )}
    </div>
  )
}

export default ParkingBooking
