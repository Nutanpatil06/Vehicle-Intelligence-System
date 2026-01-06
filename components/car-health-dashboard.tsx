"use client"

import { useState } from "react"
import { Battery, Droplet, Gauge, Calendar, Thermometer, Activity } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"

interface CarData {
  fuelLevel: number
  oilLife: number
  tirePressure: {
    frontLeft: number
    frontRight: number
    rearLeft: number
    rearRight: number
  }
  batteryHealth: number
  mileage: number
  engineTemp: string
  lastService: string
  isConnected: boolean
}

interface CarHealthDashboardProps {
  carData: CarData
}

const CarHealthDashboard = ({ carData }: CarHealthDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview")
  const isMobile = useMediaQuery("(max-width: 640px)")

  const getStatusColor = (value: number, type: string) => {
    if (type === "fuel" || type === "battery" || type === "oil") {
      if (value > 50) return "text-green-500"
      if (value > 20) return "text-yellow-500"
      return "text-red-500"
    }

    if (type === "tire") {
      if (value >= 32 && value <= 35) return "text-green-500"
      if ((value >= 30 && value < 32) || (value > 35 && value <= 37)) return "text-yellow-500"
      return "text-red-500"
    }

    return "text-gray-500 dark:text-gray-400"
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 animate-fadeIn">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === "overview" ? "text-accent-blue dark:text-accent-blue border-b-2 border-accent-blue" : "text-gray-500 dark:text-gray-400"}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === "diagnostics" ? "text-accent-blue dark:text-accent-blue border-b-2 border-accent-blue" : "text-gray-500 dark:text-gray-400"}`}
          onClick={() => setActiveTab("diagnostics")}
        >
          Diagnostics
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === "maintenance" ? "text-accent-blue dark:text-accent-blue border-b-2 border-accent-blue" : "text-gray-500 dark:text-gray-400"}`}
          onClick={() => setActiveTab("maintenance")}
        >
          Maintenance
        </button>
      </div>

      <div className="p-4">
        {!carData.isConnected ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Battery className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Vehicle Not Connected</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Connect your vehicle to view health data</p>
          </div>
        ) : activeTab === "overview" ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Vehicle Health Summary</h3>

            <div className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-2 gap-4"}`}>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg transition-all hover:shadow-md">
                <div className="flex items-center mb-2">
                  <Droplet className="w-5 h-5 mr-2 text-blue-500" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Fuel Level</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                    <div
                      className={`h-2.5 rounded-full ${carData.fuelLevel > 50 ? "bg-green-500" : carData.fuelLevel > 20 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${carData.fuelLevel}%` }}
                    ></div>
                  </div>
                  <span className={`text-sm font-medium ${getStatusColor(carData.fuelLevel, "fuel")}`}>
                    {Math.round(carData.fuelLevel)}%
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg transition-all hover:shadow-md">
                <div className="flex items-center mb-2">
                  <Battery className="w-5 h-5 mr-2 text-green-500" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Battery Health</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                    <div
                      className="h-2.5 rounded-full bg-green-500"
                      style={{ width: `${carData.batteryHealth}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-green-500">{Math.round(carData.batteryHealth)}%</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg transition-all hover:shadow-md">
                <div className="flex items-center mb-2">
                  <Gauge className="w-5 h-5 mr-2 text-purple-500" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Oil Life</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                    <div className="h-2.5 rounded-full bg-purple-500" style={{ width: `${carData.oilLife}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-purple-500">{carData.oilLife}%</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg transition-all hover:shadow-md">
                <div className="flex items-center mb-2">
                  <Thermometer className="w-5 h-5 mr-2 text-red-500" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">Engine Temp</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-green-500">{carData.engineTemp}</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Tire Pressure</h4>
              <div className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-2 gap-4"}`}>
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-lg transition-all hover:shadow-md">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Front Left</span>
                  <span className={`font-medium ${getStatusColor(carData.tirePressure.frontLeft, "tire")}`}>
                    {carData.tirePressure.frontLeft} PSI
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-lg transition-all hover:shadow-md">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Front Right</span>
                  <span className={`font-medium ${getStatusColor(carData.tirePressure.frontRight, "tire")}`}>
                    {carData.tirePressure.frontRight} PSI
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-lg transition-all hover:shadow-md">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Rear Left</span>
                  <span className={`font-medium ${getStatusColor(carData.tirePressure.rearLeft, "tire")}`}>
                    {carData.tirePressure.rearLeft} PSI
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-lg transition-all hover:shadow-md">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Rear Right</span>
                  <span className={`font-medium ${getStatusColor(carData.tirePressure.rearRight, "tire")}`}>
                    {carData.tirePressure.rearRight} PSI
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-3 rounded-lg transition-all hover:shadow-md">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="font-medium text-gray-800 dark:text-gray-200">Last Service</span>
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{carData.lastService}</span>
            </div>

            <div className="mt-4 flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-3 rounded-lg transition-all hover:shadow-md">
              <div className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="font-medium text-gray-800 dark:text-gray-200">Total Mileage</span>
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{carData.mileage.toLocaleString()} miles</span>
            </div>
          </div>
        ) : activeTab === "diagnostics" ? (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Diagnostic Results</h3>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-green-500 dark:text-green-300 text-xs">✓</span>
              </div>
              <div>
                <h4 className="font-medium text-green-700 dark:text-green-300">No Issues Detected</h4>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Your vehicle is operating normally. No diagnostic trouble codes found.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg transition-all hover:shadow-md">
              <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200">System Status</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Engine Control Module</span>
                  <span className="text-sm text-green-500 font-medium">Normal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Transmission System</span>
                  <span className="text-sm text-green-500 font-medium">Normal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Brake System</span>
                  <span className="text-sm text-green-500 font-medium">Normal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Fuel System</span>
                  <span className="text-sm text-green-500 font-medium">Normal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Emissions System</span>
                  <span className="text-sm text-green-500 font-medium">Normal</span>
                </div>
              </div>
            </div>

            <button className="w-full py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 font-medium mt-4 btn-hover">
              Run New Diagnostic
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Maintenance Schedule</h3>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-yellow-700 dark:text-yellow-300 flex items-center">
                <span className="w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-800 flex items-center justify-center mr-2 text-yellow-500 dark:text-yellow-300 text-xs">
                  !
                </span>
                Upcoming Service
              </h4>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                Oil change recommended in 1,200 miles or 2 months
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg transition-all hover:shadow-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium text-gray-800 dark:text-gray-200">Oil Change</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Every 5,000 miles or 6 months</p>
                  </div>
                  <span className="text-sm text-yellow-500 dark:text-yellow-400">Due soon</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg transition-all hover:shadow-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium text-gray-800 dark:text-gray-200">Tire Rotation</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Every 7,500 miles</p>
                  </div>
                  <span className="text-sm text-green-500">3,200 miles left</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg transition-all hover:shadow-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium text-gray-800 dark:text-gray-200">Air Filter</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Every 15,000 miles</p>
                  </div>
                  <span className="text-sm text-green-500">8,700 miles left</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg transition-all hover:shadow-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium text-gray-800 dark:text-gray-200">Brake Inspection</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Every 10,000 miles</p>
                  </div>
                  <span className="text-sm text-green-500">5,300 miles left</span>
                </div>
              </div>
            </div>

            <button className="w-full py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 font-medium mt-2 btn-hover">
              Schedule Service Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CarHealthDashboard
