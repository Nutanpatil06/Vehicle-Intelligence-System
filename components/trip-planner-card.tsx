"use client"

import { useState } from "react"
import { Brain, Fuel, TrendingUp, Sparkles, ArrowRight, Activity, Target, Lightbulb, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import ResponsiveButton from "@/components/ui/responsive-button"

interface TripPlannerCardProps {
  onNavigateToPlanner: () => void
}

const TripPlannerCard = ({ onNavigateToPlanner }: TripPlannerCardProps) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-blue-600 to-indigo-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onNavigateToPlanner}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-indigo-700/20"></div>
      <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity">
        <Brain className={`w-16 h-16 transition-transform duration-500 ${isHovered ? "rotate-12 scale-110" : ""}`} />
      </div>
      <div className="absolute bottom-4 left-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className={`w-12 h-12 transition-transform duration-700 ${isHovered ? "rotate-45" : ""}`} />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute w-2 h-2 bg-white/30 rounded-full transition-all duration-1000 ${isHovered ? "translate-x-8 translate-y-4" : ""}`}
          style={{ top: "20%", left: "10%" }}
        ></div>
        <div
          className={`absolute w-1 h-1 bg-white/40 rounded-full transition-all duration-1500 ${isHovered ? "translate-x-12 -translate-y-2" : ""}`}
          style={{ top: "60%", left: "80%" }}
        ></div>
        <div
          className={`absolute w-1.5 h-1.5 bg-white/20 rounded-full transition-all duration-1200 ${isHovered ? "-translate-x-6 translate-y-6" : ""}`}
          style={{ top: "40%", left: "60%" }}
        ></div>
      </div>

      <CardContent className="relative z-10 p-8">
        {/* Header with NEW badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-3 bg-white/20 rounded-full mr-4 group-hover:bg-white/30 transition-colors">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">AI Trip Planner</h3>
              <p className="text-purple-100 text-sm">Smart route optimization with learning</p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-yellow-900 text-xs font-bold rounded-full animate-pulse">
              NEW
            </span>
            <div className="flex items-center text-xs text-purple-200">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Powered
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center text-sm text-purple-100">
            <Activity className="w-4 h-4 mr-2 text-green-300" />
            <span>Real-time Traffic</span>
          </div>
          <div className="flex items-center text-sm text-purple-100">
            <Fuel className="w-4 h-4 mr-2 text-blue-300" />
            <span>Fuel Optimization</span>
          </div>
          <div className="flex items-center text-sm text-purple-100">
            <Shield className="w-4 h-4 mr-2 text-orange-300" />
            <span>Maintenance Alerts</span>
          </div>
          <div className="flex items-center text-sm text-purple-100">
            <Target className="w-4 h-4 mr-2 text-pink-300" />
            <span>Learning AI</span>
          </div>
        </div>

        {/* Sample savings data */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-purple-100">Smart Optimization Saves:</span>
            <Lightbulb className="w-4 h-4 text-yellow-300" />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-white">15%</div>
              <div className="text-xs text-purple-200">Fuel Cost</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">22min</div>
              <div className="text-xs text-purple-200">Time Saved</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">94%</div>
              <div className="text-xs text-purple-200">Accuracy</div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center">
          <ResponsiveButton
            variant="secondary"
            fullWidth
            size="lg"
            icon={<ArrowRight className={`w-5 h-5 transition-transform ${isHovered ? "translate-x-1" : ""}`} />}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 backdrop-blur-sm font-semibold"
          >
            Plan Smart Trip
          </ResponsiveButton>
        </div>

        {/* Bottom accent */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center text-xs text-purple-200">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>Continuously improving with AI</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TripPlannerCard
