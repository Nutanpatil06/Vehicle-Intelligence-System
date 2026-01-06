"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Droplet } from "lucide-react"

interface MileageTrackerProps {
  carData: any
}

const MileageTracker = ({ carData }: MileageTrackerProps) => {
  const [mileageData, setMileageData] = useState<any[]>([])
  const [fuelEfficiency, setFuelEfficiency] = useState<any[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState("week")

  // Generate sample data
  useEffect(() => {
    // Weekly data - last 7 days
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        miles: 20 + Math.random() * 15,
        mpg: 22 + Math.random() * 8,
      }
    })

    // Monthly data - last 30 days
    const monthlyData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        miles: 15 + Math.random() * 25,
        mpg: 20 + Math.random() * 10,
      }
    })

    // Yearly data - last 12 months
    const yearlyData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      return {
        date: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        miles: 400 + Math.random() * 200,
        mpg: 22 + Math.random() * 6,
      }
    })

    if (selectedPeriod === "week") {
      setMileageData(weeklyData)
      setFuelEfficiency(weeklyData)
    } else if (selectedPeriod === "month") {
      setMileageData(monthlyData)
      setFuelEfficiency(monthlyData)
    } else {
      setMileageData(yearlyData)
      setFuelEfficiency(yearlyData)
    }
  }, [selectedPeriod])

  const totalMiles = mileageData.reduce((sum, item) => sum + item.miles, 0).toFixed(1)
  const avgMpg = (fuelEfficiency.reduce((sum, item) => sum + item.mpg, 0) / fuelEfficiency.length).toFixed(1)

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Mileage Tracking</h2>

        <div className="flex justify-between mb-6">
          <div className="bg-gray-50 p-3 rounded-lg flex-1 mr-2">
            <div className="flex items-center mb-1">
              <TrendingUp className="w-4 h-4 mr-1 text-gray-500" />
              <span className="text-sm text-gray-500">Total Distance</span>
            </div>
            <div className="text-xl font-bold">{totalMiles} miles</div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg flex-1 ml-2">
            <div className="flex items-center mb-1">
              <Droplet className="w-4 h-4 mr-1 text-gray-500" />
              <span className="text-sm text-gray-500">Avg Efficiency</span>
            </div>
            <div className="text-xl font-bold">{avgMpg} MPG</div>
          </div>
        </div>

        <div className="flex mb-4 border rounded-lg overflow-hidden">
          <button
            className={`flex-1 py-2 text-sm font-medium ${selectedPeriod === "week" ? "bg-gray-100" : "bg-white"}`}
            onClick={() => setSelectedPeriod("week")}
          >
            Week
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${selectedPeriod === "month" ? "bg-gray-100" : "bg-white"}`}
            onClick={() => setSelectedPeriod("month")}
          >
            Month
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${selectedPeriod === "year" ? "bg-gray-100" : "bg-white"}`}
            onClick={() => setSelectedPeriod("year")}
          >
            Year
          </button>
        </div>

        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mileageData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} width={30} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="miles"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Fuel Efficiency</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fuelEfficiency} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} width={30} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="mpg"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MileageTracker
