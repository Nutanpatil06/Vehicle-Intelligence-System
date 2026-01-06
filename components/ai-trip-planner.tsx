"use client"

import { useState, useEffect, useCallback } from "react"
import {
  MapPin,
  Navigation,
  Fuel,
  ArrowLeft,
  Settings,
  Route,
  Star,
  Zap,
  Car,
  DollarSign,
  AlertTriangle,
  Coffee,
  Camera,
  Wrench,
  ChevronDown,
  ChevronUp,
  Play,
  Brain,
  Clock,
  Shield,
  TrendingDown,
  Activity,
  BarChart3,
  Target,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Wifi,
  WifiOff,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ResponsiveButton from "@/components/ui/responsive-button"

interface TripPlannerProps {
  onBack: () => void
}

interface TrafficData {
  level: "low" | "moderate" | "heavy" | "severe"
  delay: number // minutes
  incidents: Array<{
    type: "accident" | "construction" | "closure" | "weather"
    location: string
    severity: "minor" | "major" | "critical"
    estimatedClearTime?: string
  }>
  alternativeAvailable: boolean
  lastUpdated: Date
}

interface MaintenanceAlert {
  type: "oil_change" | "tire_rotation" | "brake_check" | "general_service"
  urgency: "low" | "medium" | "high" | "critical"
  description: string
  recommendedAction: string
  estimatedCost: number
  dueIn: number // kilometers
  nearbyServices: Array<{
    name: string
    distance: number
    rating: number
    estimatedCost: number
  }>
}

interface FuelInsight {
  currentPrice: number
  averagePrice: number
  trend: "rising" | "falling" | "stable"
  bestPriceLocation: {
    name: string
    price: number
    distance: number
    savings: number
  }
  priceHistory: Array<{
    date: string
    price: number
  }>
  recommendation: string
}

interface UserLearningData {
  drivingStyle: "eco" | "normal" | "aggressive"
  preferredRoutes: string[]
  fuelEfficiencyHistory: number[]
  averageSpeed: number
  stopPreferences: {
    restFrequency: number // minutes
    fuelStopPreference: "cheapest" | "convenient" | "branded"
    scenicPreference: number // 1-5 scale
  }
  accuracyImprovement: {
    fuelPrediction: number // percentage
    timePrediction: number // percentage
    routeOptimization: number // percentage
  }
}

interface SmartRouteStop {
  id: string
  name: string
  type: "fuel" | "rest" | "scenic" | "service" | "maintenance"
  distance: number
  estimatedTime: string
  rating: number
  services: string[]
  fuelPrice?: number
  maintenanceServices?: string[]
  trafficImpact?: "none" | "minor" | "moderate" | "major"
  aiRecommendation?: string
  costSavings?: number
  priority: "low" | "medium" | "high" | "critical"
}

interface SmartRouteOption {
  id: string
  name: string
  type: "fastest" | "scenic" | "economy" | "smart_optimized"
  distance: number
  duration: string
  originalDuration: string
  fuelConsumption: number
  fuelCost: number
  tollCost: number
  difficulty: "easy" | "moderate" | "challenging"
  trafficData: TrafficData
  scenicRating: number
  stops: SmartRouteStop[]
  highlights: string[]
  aiInsights: string[]
  maintenanceAlerts: MaintenanceAlert[]
  fuelInsights: FuelInsight
  confidenceScore: number // AI prediction confidence 0-100
  learningImprovements: string[]
  alternativeRoutes?: Array<{
    reason: string
    route: Partial<SmartRouteOption>
  }>
}

const AITripPlanner = ({ onBack }: TripPlannerProps) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showRoutes, setShowRoutes] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null)
  const [realTimeUpdates, setRealTimeUpdates] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Form state
  const [formData, setFormData] = useState({
    startLocation: "",
    destination: "",
    fuelLevel: 75,
    vehicleMileage: 15,
    fuelType: "petrol",
    vehicleAge: 3,
    lastServiceKm: 10000,
    currentOdometer: 45000,
  })

  // Enhanced preferences with learning
  const [preferences, setPreferences] = useState({
    avoidTolls: false,
    avoidHighways: false,
    preferScenic: false,
    includeRestStops: true,
    fuelPriority: "balanced",
    maxStopDuration: 30,
    enableLearning: true,
    trafficAlerts: true,
    maintenanceAlerts: true,
    fuelPriceAlerts: true,
  })

  // Smart features state
  const [routes, setRoutes] = useState<SmartRouteOption[]>([])
  const [geminiSummary, setGeminiSummary] = useState<{ distanceKm: number; duration: string; confidence?: number } | null>(null)
  const [geminiSettlements, setGeminiSettlements] = useState<Array<{ name: string; type: string; state: string; lat?: number; lng?: number; segmentDistanceKm?: number }>>([])
  const [geminiError, setGeminiError] = useState<string | null>(null)
  const [useGeminiPrimary, setUseGeminiPrimary] = useState(true)
  const DEFAULT_FUEL_PRICE_PER_L = 105 // INR per litre (adjustable)
  const [geminiRoutes, setGeminiRoutes] = useState<Array<{ 
    name: string; 
    type: string; 
    distanceKm: number; 
    duration: string; 
    confidence: number; 
    notes?: string[];
    roadConditions?: string[];
    fuelStops?: Array<{ name: string; distance: number; type: string }>;
    restAreas?: Array<{ name: string; distance: number; facilities: string[] }>;
    tollInfo?: { totalToll: number; tollPlazas: Array<{ name: string; amount: number }> };
    trafficInsights?: string[];
    safetyTips?: string[];
    bestTravelTime?: string;
    seasonalConsiderations?: string[];
  }>>([])
  const [geminiAlternatives, setGeminiAlternatives] = useState<Array<{
    name: string;
    reason: string;
    distanceKm: number;
    duration: string;
    advantages: string[];
    disadvantages: string[];
  }>>([])
  const [geminiEmergencyContacts, setGeminiEmergencyContacts] = useState<Array<{
    type: string;
    number: string;
    description: string;
  }>>([])
  const [geminiWeatherConsiderations, setGeminiWeatherConsiderations] = useState<string[]>([])
  const [geminiFuelPriceTrends, setGeminiFuelPriceTrends] = useState<Array<{
    location: string;
    currentPrice: number;
    trend: string;
  }>>([])
  const [geminiTouristAttractions, setGeminiTouristAttractions] = useState<Array<{
    name: string;
    type: string;
    location: string;
    distanceFromStart: number;
    description: string;
    bestTimeToVisit: string;
    entryFee: string;
    highlights: string[];
  }>>([])
  const [geminiLocalCuisine, setGeminiLocalCuisine] = useState<Array<{
    location: string;
    specialties: string[];
    famousRestaurants: string[];
    foodCulture: string;
  }>>([])
  const [startSuggestions, setStartSuggestions] = useState<Array<{ name: string; state: string }>>([])
  const [destSuggestions, setDestSuggestions] = useState<Array<{ name: string; state: string }>>([])
  const [suggestLoading, setSuggestLoading] = useState<{ start: boolean; dest: boolean }>({ start: false, dest: false })
  const [startOpen, setStartOpen] = useState(false)
  const [destOpen, setDestOpen] = useState(false)
  const [userLearningData, setUserLearningData] = useState<UserLearningData>({
    drivingStyle: "normal",
    preferredRoutes: [],
    fuelEfficiencyHistory: [14.2, 15.1, 14.8, 15.3, 14.9],
    averageSpeed: 45,
    stopPreferences: {
      restFrequency: 120,
      fuelStopPreference: "convenient",
      scenicPreference: 3,
    },
    accuracyImprovement: {
      fuelPrediction: 15,
      timePrediction: 22,
      routeOptimization: 18,
    },
  })

  // Real-time updates simulation
  useEffect(() => {
    if (realTimeUpdates && routes.length > 0) {
      const interval = setInterval(() => {
        updateTrafficData()
        setLastUpdate(new Date())
      }, 30000) // Update every 30 seconds

      return () => clearInterval(interval)
    }
  }, [realTimeUpdates, routes.length])

  const updateTrafficData = useCallback(() => {
    setRoutes((prevRoutes) =>
      prevRoutes.map((route) => ({
        ...route,
        trafficData: {
          ...route.trafficData,
          level: Math.random() > 0.7 ? "moderate" : "low",
          delay: Math.floor(Math.random() * 15),
          lastUpdated: new Date(),
        },
      })),
    )
  }, [])

  const generateSmartRoutes = async () => {
    if (!formData.startLocation || !formData.destination) return

    setIsGenerating(true)

    // Call Gemini Trip API in parallel with simulated processing
    const geminiCall = (async () => {
      try {
        setGeminiError(null)
        const res = await fetch("/api/gemini-trip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: formData.startLocation,
            destination: formData.destination,
            preferences,
            needSettlements: true,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setGeminiError(data?.error || "Failed to get trip plan")
          setGeminiSummary(null)
          setGeminiSettlements([])
          setGeminiRoutes([])
        } else {
          setGeminiSummary(data.summary || null)
          setGeminiSettlements(Array.isArray(data.settlements) ? data.settlements : [])
          setGeminiRoutes(Array.isArray(data.routes) ? data.routes : [])
          setGeminiAlternatives(Array.isArray(data.alternativeRoutes) ? data.alternativeRoutes : [])
          setGeminiEmergencyContacts(Array.isArray(data.emergencyContacts) ? data.emergencyContacts : [])
          setGeminiWeatherConsiderations(Array.isArray(data.weatherConsiderations) ? data.weatherConsiderations : [])
          setGeminiFuelPriceTrends(Array.isArray(data.fuelPriceTrends) ? data.fuelPriceTrends : [])
          setGeminiTouristAttractions(Array.isArray(data.touristAttractions) ? data.touristAttractions : [])
          setGeminiLocalCuisine(Array.isArray(data.localCuisine) ? data.localCuisine : [])
        }
      } catch (e: any) {
        setGeminiError("Network error while fetching trip plan")
        setGeminiSummary(null)
        setGeminiSettlements([])
      }
    })()

    await Promise.all([
      new Promise((resolve) => setTimeout(resolve, 1500)),
      geminiCall,
    ])

    const mockRoutes: SmartRouteOption[] = [
      {
        id: "smart_optimized",
        name: "AI Optimized Route",
        type: "smart_optimized",
        distance: 242,
        duration: "3h 35m",
        originalDuration: "3h 45m",
        fuelConsumption: 15.8,
        fuelCost: 1422,
        tollCost: 150,
        difficulty: "easy",
        scenicRating: 4,
        confidenceScore: 94,
        trafficData: {
          level: "low",
          delay: 5,
          incidents: [
            {
              type: "construction",
              location: "Highway Junction KM 85",
              severity: "minor",
              estimatedClearTime: "2h 30m",
            },
          ],
          alternativeAvailable: true,
          lastUpdated: new Date(),
        },
        highlights: ["AI optimized for your driving style", "Real-time traffic avoidance", "Fuel-efficient route"],
        aiInsights: [
          "Based on your eco-friendly driving style, this route saves 12% fuel",
          "Traffic patterns suggest 10 minutes faster than usual",
          "Your preferred fuel stations are along this route",
        ],
        learningImprovements: [
          "Route prediction accuracy improved by 22%",
          "Fuel consumption estimates now 15% more accurate",
          "Personalized based on 47 previous trips",
        ],
        maintenanceAlerts: [
          {
            type: "oil_change",
            urgency: "medium",
            description: "Oil change due in 2,000 km",
            recommendedAction: "Schedule service at next convenient stop",
            estimatedCost: 3500,
            dueIn: 2000,
            nearbyServices: [
              {
                name: "AutoCare Service Center",
                distance: 85,
                rating: 4.3,
                estimatedCost: 3200,
              },
            ],
          },
        ],
        fuelInsights: {
          currentPrice: 102.5,
          averagePrice: 104.2,
          trend: "falling",
          bestPriceLocation: {
            name: "Indian Oil Station KM 120",
            price: 100.8,
            distance: 120,
            savings: 68,
          },
          priceHistory: [
            { date: "Today", price: 102.5 },
            { date: "Yesterday", price: 103.1 },
            { date: "2 days ago", price: 104.8 },
          ],
          recommendation: "Wait for KM 120 station - save ₹68 on full tank",
        },
        stops: [
          {
            id: "smart_fuel_1",
            name: "Indian Oil Station",
            type: "fuel",
            distance: 120,
            estimatedTime: "1h 45m",
            rating: 4.2,
            services: ["Fuel", "Restroom", "Snacks", "ATM"],
            fuelPrice: 100.8,
            priority: "high",
            aiRecommendation: "Best fuel price on route - save ₹68",
            costSavings: 68,
            trafficImpact: "none",
          },
          {
            id: "maintenance_1",
            name: "AutoCare Service Center",
            type: "maintenance",
            distance: 85,
            estimatedTime: "1h 15m",
            rating: 4.3,
            services: ["Oil Change", "General Service", "Tire Check"],
            maintenanceServices: ["Oil Change", "Filter Replacement", "Brake Check"],
            priority: "medium",
            aiRecommendation: "Convenient for upcoming oil change",
            trafficImpact: "minor",
          },
          {
            id: "smart_rest_1",
            name: "Highway Rest Plaza",
            type: "rest",
            distance: 180,
            estimatedTime: "2h 35m",
            rating: 4.1,
            services: ["Restaurant", "Restroom", "Fuel", "Shopping"],
            priority: "medium",
            aiRecommendation: "Perfect timing for your usual 2-hour break",
            trafficImpact: "none",
          },
        ],
        alternativeRoutes: [
          {
            reason: "Heavy traffic detected ahead",
            route: {
              name: "Alternative via State Highway",
              duration: "3h 42m",
              distance: 248,
              fuelCost: 1445,
            },
          },
        ],
      },
      {
        id: "fastest_smart",
        name: "Fastest Route (Traffic-Aware)",
        type: "fastest",
        distance: 235,
        duration: "3h 25m",
        originalDuration: "3h 15m",
        fuelConsumption: 16.8,
        fuelCost: 1512,
        tollCost: 220,
        difficulty: "easy",
        scenicRating: 2,
        confidenceScore: 88,
        trafficData: {
          level: "moderate",
          delay: 10,
          incidents: [
            {
              type: "accident",
              location: "Main Highway KM 45",
              severity: "major",
              estimatedClearTime: "1h 15m",
            },
          ],
          alternativeAvailable: true,
          lastUpdated: new Date(),
        },
        highlights: ["Fastest under normal conditions", "Highway route", "Minimal stops"],
        aiInsights: [
          "Current accident causing 10-minute delay",
          "Alternative route available if needed",
          "Traffic usually clears by afternoon",
        ],
        learningImprovements: ["Traffic prediction accuracy: 89%", "Incident detection improved"],
        maintenanceAlerts: [],
        fuelInsights: {
          currentPrice: 103.2,
          averagePrice: 104.2,
          trend: "stable",
          bestPriceLocation: {
            name: "HP Petrol Pump KM 95",
            price: 102.1,
            distance: 95,
            savings: 44,
          },
          priceHistory: [
            { date: "Today", price: 103.2 },
            { date: "Yesterday", price: 103.0 },
            { date: "2 days ago", price: 103.5 },
          ],
          recommendation: "Fuel prices stable - fill up at convenient location",
        },
        stops: [
          {
            id: "fast_fuel_1",
            name: "HP Petrol Pump",
            type: "fuel",
            distance: 95,
            estimatedTime: "1h 25m",
            rating: 4.0,
            services: ["Fuel", "Quick Mart", "Restroom"],
            fuelPrice: 102.1,
            priority: "medium",
            aiRecommendation: "Good fuel price and quick service",
            costSavings: 44,
            trafficImpact: "minor",
          },
        ],
      },
      {
        id: "scenic_smart",
        name: "Scenic Route (AI Enhanced)",
        type: "scenic",
        distance: 285,
        duration: "4h 15m",
        originalDuration: "4h 30m",
        fuelConsumption: 18.2,
        fuelCost: 1638,
        tollCost: 80,
        difficulty: "moderate",
        scenicRating: 5,
        confidenceScore: 91,
        trafficData: {
          level: "low",
          delay: 0,
          incidents: [],
          alternativeAvailable: false,
          lastUpdated: new Date(),
        },
        highlights: ["Beautiful mountain views", "Photo opportunities", "Peaceful drive"],
        aiInsights: [
          "Perfect weather for scenic photography",
          "Low traffic on mountain roads",
          "Matches your preference for scenic routes",
        ],
        learningImprovements: [
          "Scenic rating personalized to your preferences",
          "Photo stop recommendations based on your history",
        ],
        maintenanceAlerts: [
          {
            type: "brake_check",
            urgency: "low",
            description: "Mountain driving - brake check recommended",
            recommendedAction: "Quick brake inspection before mountain section",
            estimatedCost: 1500,
            dueIn: 0,
            nearbyServices: [
              {
                name: "Mountain Auto Service",
                distance: 45,
                rating: 4.5,
                estimatedCost: 1200,
              },
            ],
          },
        ],
        fuelInsights: {
          currentPrice: 105.8,
          averagePrice: 104.2,
          trend: "rising",
          bestPriceLocation: {
            name: "Valley Fuel Station",
            price: 103.5,
            distance: 160,
            savings: 92,
          },
          priceHistory: [
            { date: "Today", price: 105.8 },
            { date: "Yesterday", price: 104.9 },
            { date: "2 days ago", price: 104.2 },
          ],
          recommendation: "Fuel before mountain section - prices higher in hills",
        },
        stops: [
          {
            id: "scenic_viewpoint_1",
            name: "Mountain Viewpoint",
            type: "scenic",
            distance: 95,
            estimatedTime: "1h 35m",
            rating: 4.8,
            services: ["Photography", "Parking", "Cafe"],
            priority: "high",
            aiRecommendation: "Perfect lighting for photos at this time",
            trafficImpact: "none",
          },
          {
            id: "scenic_fuel_1",
            name: "Valley Fuel Station",
            type: "fuel",
            distance: 160,
            estimatedTime: "2h 25m",
            rating: 4.1,
            services: ["Fuel", "Local Food", "Restroom"],
            fuelPrice: 103.5,
            priority: "high",
            aiRecommendation: "Last cheap fuel before mountain section",
            costSavings: 92,
            trafficImpact: "none",
          },
          {
            id: "scenic_service_1",
            name: "Mountain Auto Service",
            type: "service",
            distance: 45,
            estimatedTime: "45m",
            rating: 4.5,
            services: ["Brake Check", "Tire Pressure", "Quick Service"],
            maintenanceServices: ["Brake Inspection", "Fluid Check"],
            priority: "medium",
            aiRecommendation: "Safety check before mountain driving",
            trafficImpact: "none",
          },
        ],
      },
    ]

    // If Gemini responded, build a primary route from Gemini summary
    if (useGeminiPrimary && geminiSummary) {
      const primary: SmartRouteOption = {
        id: "gemini_primary",
        name: "Gemini Route",
        type: "smart_optimized",
        distance: Math.round(geminiSummary.distanceKm),
        duration: geminiSummary.duration,
        originalDuration: geminiSummary.duration,
        fuelConsumption: Math.max(0, Math.round((geminiSummary.distanceKm / Math.max(1, formData.vehicleMileage)) * 10) / 10),
        fuelCost: Math.round(
          Math.max(0, (geminiSummary.distanceKm / Math.max(1, formData.vehicleMileage)) * DEFAULT_FUEL_PRICE_PER_L),
        ),
        tollCost: 0,
        difficulty: "easy",
        scenicRating: 3,
        confidenceScore: Math.round((geminiSummary.confidence ?? 0.9) * 100),
        trafficData: {
          level: "low",
          delay: 0,
          incidents: [],
          alternativeAvailable: false,
          lastUpdated: new Date(),
        },
        stops: [],
        highlights: ["Gemini-estimated distance", "Corridor settlements listed"],
        aiInsights: ["Generated via Gemini 1.5"],
        maintenanceAlerts: [],
        fuelInsights: {
          currentPrice: 0,
          averagePrice: 0,
          trend: "stable",
          bestPriceLocation: { name: "-", price: 0, distance: 0, savings: 0 },
          priceHistory: [],
          recommendation: "",
        },
      }
      // Map optional Gemini alternatives
      const altRoutes: SmartRouteOption[] = (geminiRoutes || []).slice(0, 3).map((r, idx) => ({
        id: `gemini_alt_${idx}`,
        name: r.name || "Alternative",
        type: (r.type as any) || "smart_optimized",
        distance: Math.round(r.distanceKm || 0),
        duration: r.duration || primary.duration,
        originalDuration: r.duration || primary.duration,
        fuelConsumption: Math.max(0, Math.round(((r.distanceKm || 0) / Math.max(1, formData.vehicleMileage)) * 10) / 10),
        fuelCost: Math.round(
          Math.max(0, ((r.distanceKm || 0) / Math.max(1, formData.vehicleMileage)) * DEFAULT_FUEL_PRICE_PER_L),
        ),
        tollCost: r.tollInfo?.totalToll || 0,
        difficulty: "easy",
        scenicRating: r.type === "scenic" ? 5 : 3,
        confidenceScore: Math.round(((r.confidence ?? geminiSummary.confidence ?? 0.85) as number) * 100),
        trafficData: {
          level: "low",
          delay: 0,
          incidents: [],
          alternativeAvailable: false,
          lastUpdated: new Date(),
        },
        stops: [],
        highlights: r.notes && r.notes.length ? r.notes.slice(0, 3) : ["Gemini alternative"],
        aiInsights: [
          "Generated via Gemini 1.5",
          ...(r.trafficInsights || []).slice(0, 2),
          ...(r.safetyTips || []).slice(0, 1)
        ],
        maintenanceAlerts: [],
        fuelInsights: primary.fuelInsights,
      }))
      // Sort routes by duration (fastest first) using a simple minutes extractor
      const routes = [primary, ...altRoutes]
      const toMinutes = (d: string) => {
        const [h, rest] = (d || "0h 0m").split("h")
        const hours = Number.parseInt(h) || 0
        const mins = Number.parseInt((rest || "").replace("m", "")) || 0
        return hours * 60 + mins
      }
      routes.sort((a, b) => toMinutes(a.duration) - toMinutes(b.duration))
      setRoutes(routes)
    } else {
      setRoutes(mockRoutes)
    }
    setShowRoutes(true)
    setIsGenerating(false)
  }

  const getRouteIcon = (type: string) => {
    switch (type) {
      case "smart_optimized":
        return <Brain className="w-5 h-5" />
      case "fastest":
        return <Zap className="w-5 h-5" />
      case "scenic":
        return <Camera className="w-5 h-5" />
      case "economy":
        return <DollarSign className="w-5 h-5" />
      default:
        return <Route className="w-5 h-5" />
    }
  }

  const getStopIcon = (type: string) => {
    switch (type) {
      case "fuel":
        return <Fuel className="w-4 h-4" />
      case "rest":
        return <Coffee className="w-4 h-4" />
      case "scenic":
        return <Camera className="w-4 h-4" />
      case "service":
        return <Wrench className="w-4 h-4" />
      case "maintenance":
        return <Settings className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  const getTrafficColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-600 dark:text-green-400"
      case "moderate":
        return "text-yellow-600 dark:text-yellow-400"
      case "heavy":
        return "text-orange-600 dark:text-orange-400"
      case "severe":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "low":
        return "text-blue-600 dark:text-blue-400"
      case "medium":
        return "text-yellow-600 dark:text-yellow-400"
      case "high":
        return "text-orange-600 dark:text-orange-400"
      case "critical":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
      case "medium":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
      case "high":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
      case "critical":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
    }
  }

  const startTrip = () => {
    if (selectedRoute) {
      const route = routes.find((r) => r.id === selectedRoute)
      if (route) {
        // Update learning data
        setUserLearningData((prev) => ({
          ...prev,
          preferredRoutes: [...prev.preferredRoutes, route.type],
        }))
        alert(
          `Starting AI-powered navigation for ${route.name}!\n\nReal-time updates enabled\nTraffic monitoring active`,
        )
      }
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const fetchSuggestions = useCallback(async (q: string) => {
    const res = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    })
    const data = await res.json()
    return (data?.suggestions || []) as Array<{ name: string; state: string }>
  }, [])

  // Debounce start input
  useEffect(() => {
    const q = formData.startLocation.trim()
    if (q.length < 2) {
      setStartSuggestions([])
      return
    }
    setSuggestLoading((s) => ({ ...s, start: true }))
    const t = setTimeout(async () => {
      try {
        const list = await fetchSuggestions(q)
        setStartSuggestions(list)
      } finally {
        setSuggestLoading((s) => ({ ...s, start: false }))
      }
    }, 300)
    return () => clearTimeout(t)
  }, [formData.startLocation, fetchSuggestions])

  // Debounce destination input
  useEffect(() => {
    const q = formData.destination.trim()
    if (q.length < 2) {
      setDestSuggestions([])
      return
    }
    setSuggestLoading((s) => ({ ...s, dest: true }))
    const t = setTimeout(async () => {
      try {
        const list = await fetchSuggestions(q)
        setDestSuggestions(list)
      } finally {
        setSuggestLoading((s) => ({ ...s, dest: false }))
      }
    }, 300)
    return () => clearTimeout(t)
  }, [formData.destination, fetchSuggestions])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* Enhanced Header with Real-time Status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-3 p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              AI Trip Planner
              <Brain className="w-6 h-6 ml-2 text-blue-600" />
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Smart route optimization with real-time learning</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm">
            {realTimeUpdates ? <Wifi className="w-4 h-4 mr-1" /> : <WifiOff className="w-4 h-4 mr-1" />}
            {realTimeUpdates ? "Live Updates" : "Offline"}
          </div>
          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
            AI Enhanced
          </div>
        </div>
      </div>

      {/* Learning Insights Panel */}
      {userLearningData && (
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">AI Learning Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {userLearningData.accuracyImprovement.fuelPrediction}%
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Fuel Prediction Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {userLearningData.accuracyImprovement.timePrediction}%
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Time Prediction Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {userLearningData.drivingStyle}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Detected Driving Style</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!showRoutes ? (
        <>
          {/* Enhanced Trip Details Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Trip Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Starting Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="startLocation"
                      type="text"
                      value={formData.startLocation}
                      onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                      onFocus={() => setStartOpen(true)}
                      onBlur={() => setTimeout(() => setStartOpen(false), 150)}
                      placeholder="Enter starting point"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    {startOpen && startSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow">
                        {startSuggestions.map((s, i) => (
                          <button
                            key={`${s.name}-${i}`}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setFormData({ ...formData, startLocation: `${s.name}, ${s.state}` })
                              setStartOpen(false)
                            }}
                          >
                            {s.name}, {s.state}
                          </button>
                        ))}
                      </div>
                    )}
                    {suggestLoading.start && (
                      <div className="absolute right-3 top-3 w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Destination</label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="destination"
                      type="text"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      onFocus={() => setDestOpen(true)}
                      onBlur={() => setTimeout(() => setDestOpen(false), 150)}
                      placeholder="Enter destination"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    {destOpen && destSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow">
                        {destSuggestions.map((s, i) => (
                          <button
                            key={`${s.name}-${i}`}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setFormData({ ...formData, destination: `${s.name}, ${s.state}` })
                              setDestOpen(false)
                            }}
                          >
                            {s.name}, {s.state}
                          </button>
                        ))}
                      </div>
                    )}
                    {suggestLoading.dest && (
                      <div className="absolute right-3 top-3 w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="fuelLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Fuel Level
                  </label>
                  <div className="space-y-2">
                    <input
                      id="fuelLevel"
                      type="range"
                      min="0"
                      max="100"
                      value={formData.fuelLevel}
                      onChange={(e) => setFormData({ ...formData, fuelLevel: Number.parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>0%</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">{formData.fuelLevel}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="vehicleMileage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vehicle Mileage (km/l)
                  </label>
                  <div className="relative">
                    <Car className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="vehicleMileage"
                      type="number"
                      value={formData.vehicleMileage}
                      onChange={(e) => setFormData({ ...formData, vehicleMileage: Number.parseFloat(e.target.value) })}
                      placeholder="15"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="vehicleAge" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vehicle Age (years)
                  </label>
                  <input
                    id="vehicleAge"
                    type="number"
                    value={formData.vehicleAge}
                    onChange={(e) => setFormData({ ...formData, vehicleAge: Number.parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fuel Type</label>
                  <select
                    id="fuelType"
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="cng">CNG</option>
                    <option value="electric">Electric</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="currentOdometer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Odometer (km)
                  </label>
                  <input
                    id="currentOdometer"
                    type="number"
                    value={formData.currentOdometer}
                    onChange={(e) => setFormData({ ...formData, currentOdometer: Number.parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label htmlFor="lastServiceKm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Service (km)
                  </label>
                  <input
                    id="lastServiceKm"
                    type="number"
                    value={formData.lastServiceKm}
                    onChange={(e) => setFormData({ ...formData, lastServiceKm: Number.parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Smart Preferences */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-purple-600" />
                Smart Preferences & Learning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Route Options</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.avoidTolls}
                        onChange={(e) => setPreferences({ ...preferences, avoidTolls: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Avoid tolls</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.avoidHighways}
                        onChange={(e) => setPreferences({ ...preferences, avoidHighways: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Avoid highways</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.preferScenic}
                        onChange={(e) => setPreferences({ ...preferences, preferScenic: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Prefer scenic routes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.includeRestStops}
                        onChange={(e) => setPreferences({ ...preferences, includeRestStops: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include rest stops</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Smart Features</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.enableLearning}
                        onChange={(e) => setPreferences({ ...preferences, enableLearning: e.target.checked })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                        <Brain className="w-4 h-4 mr-1" />
                        Enable AI Learning
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.trafficAlerts}
                        onChange={(e) => setPreferences({ ...preferences, trafficAlerts: e.target.checked })}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Real-time Traffic Alerts
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.maintenanceAlerts}
                        onChange={(e) => setPreferences({ ...preferences, maintenanceAlerts: e.target.checked })}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                        <Wrench className="w-4 h-4 mr-1" />
                        Maintenance Alerts
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.fuelPriceAlerts}
                        onChange={(e) => setPreferences({ ...preferences, fuelPriceAlerts: e.target.checked })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Fuel Price Optimization
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Smart Routes Button */}
          <div className="text-center">
            <ResponsiveButton
              variant="primary"
              size="lg"
              onClick={generateSmartRoutes}
              disabled={!formData.startLocation || !formData.destination || isGenerating}
              icon={
                isGenerating ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Brain className="w-5 h-5" />
                )
              }
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-3"
            >
              {isGenerating ? "AI Analyzing Routes..." : "Generate Smart Routes"}
            </ResponsiveButton>
          </div>
          <div className="mt-3 flex items-center justify-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={useGeminiPrimary} onChange={(e) => setUseGeminiPrimary(e.target.checked)} />
              Use Gemini as primary route
            </label>
          </div>
        </>
      ) : (
        <>
          {/* Gemini Trip Summary */}
          {(geminiSummary || geminiError) && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Navigation className="w-5 h-5 mr-2 text-purple-600" />
                  Gemini Trip Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {geminiError ? (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {geminiError} {geminiError.includes("GEMINI_API_KEY") && "• Set GEMINI_API_KEY in .env.local and restart."}
                  </div>
                ) : (
                  <div className="flex items-center gap-6 text-sm text-gray-800 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      <Route className="w-4 h-4 text-blue-600" />
                      <span>{geminiSummary?.distanceKm} km</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span>{geminiSummary?.duration}</span>
                    </div>
                    {typeof geminiSummary?.confidence === "number" && (
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-600" />
                        <span>{Math.round((geminiSummary?.confidence || 0) * 100)}% confidence</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Settlements List */}
                {!geminiError && geminiSettlements.length > 0 && (
                  <div className="mt-4">
                    <div className="font-medium mb-2 text-gray-900 dark:text-gray-100">Settlements on/near route</div>
                    <div className="max-h-56 overflow-auto rounded border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left">#</th>
                            <th className="px-3 py-2 text-left">Settlement</th>
                            <th className="px-3 py-2 text-left">Type</th>
                            <th className="px-3 py-2 text-left">State</th>
                            <th className="px-3 py-2 text-left">Segment (km)</th>
                            <th className="px-3 py-2 text-left">Lat/Lng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {geminiSettlements.map((s, idx) => (
                            <tr key={`${s.name}-${idx}`} className="text-gray-800 dark:text-gray-200">
                              <td className="px-3 py-2">{idx + 1}</td>
                              <td className="px-3 py-2 font-medium">{s.name}</td>
                              <td className="px-3 py-2 capitalize">{s.type}</td>
                              <td className="px-3 py-2">{s.state}</td>
                              <td className="px-3 py-2">{typeof s.segmentDistanceKm === "number" ? s.segmentDistanceKm : "-"}</td>
                              <td className="px-3 py-2">{s.lat && s.lng ? `${s.lat.toFixed(3)}, ${s.lng.toFixed(3)}` : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Corridor total (Gemini): {geminiSummary?.distanceKm ?? "-"} km
                    </div>
                    
                    {/* Emergency Contacts */}
                    {geminiEmergencyContacts.length > 0 && (
                      <div className="mt-4">
                        <div className="font-medium mb-2 text-gray-900 dark:text-gray-100">Emergency Contacts</div>
                        <div className="space-y-1">
                          {geminiEmergencyContacts.map((contact, idx) => (
                            <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">{contact.type}:</span> {contact.number} - {contact.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Weather Considerations */}
                    {geminiWeatherConsiderations.length > 0 && (
                      <div className="mt-4">
                        <div className="font-medium mb-2 text-gray-900 dark:text-gray-100">Weather Considerations</div>
                        <div className="space-y-1">
                          {geminiWeatherConsiderations.map((weather, idx) => (
                            <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                              • {weather}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                                         {/* Fuel Price Trends */}
                     {geminiFuelPriceTrends.length > 0 && (
                       <div className="mt-4">
                         <div className="font-medium mb-2 text-gray-900 dark:text-gray-100">Fuel Price Trends</div>
                         <div className="space-y-1">
                           {geminiFuelPriceTrends.map((fuel, idx) => (
                             <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                               {fuel.location}: ₹{fuel.currentPrice}/L ({fuel.trend})
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     {/* Tourist Attractions */}
                     {geminiTouristAttractions.length > 0 && (
                       <div className="mt-4">
                         <div className="font-medium mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                           <Camera className="w-4 h-4" />
                           Tourist Attractions En Route
                         </div>
                         <div className="space-y-3">
                           {geminiTouristAttractions.map((attraction, idx) => (
                             <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                               <div className="flex items-start justify-between mb-2">
                                 <div>
                                   <div className="font-medium text-blue-900 dark:text-blue-100">{attraction.name}</div>
                                   <div className="text-sm text-blue-700 dark:text-blue-300">{attraction.location}</div>
                                 </div>
                                 <div className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded capitalize">
                                   {attraction.type}
                                 </div>
                               </div>
                               <div className="text-sm text-blue-800 dark:text-blue-200 mb-2">{attraction.description}</div>
                               <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
                                 <div>Distance: {attraction.distanceFromStart} km</div>
                                 <div>Entry: {attraction.entryFee}</div>
                                 <div>Best Time: {attraction.bestTimeToVisit}</div>
                               </div>
                               {attraction.highlights.length > 0 && (
                                 <div className="mt-2">
                                   <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Highlights:</div>
                                   <div className="flex flex-wrap gap-1">
                                     {attraction.highlights.slice(0, 3).map((highlight, hIdx) => (
                                       <span key={hIdx} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded">
                                         {highlight}
                                       </span>
                                     ))}
                                   </div>
                                 </div>
                               )}
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     {/* Local Cuisine */}
                     {geminiLocalCuisine.length > 0 && (
                       <div className="mt-4">
                         <div className="font-medium mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                           <Coffee className="w-4 h-4" />
                           Local Cuisine & Food Culture
                         </div>
                         <div className="space-y-3">
                           {geminiLocalCuisine.map((cuisine, idx) => (
                             <div key={idx} className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                               <div className="font-medium text-orange-900 dark:text-orange-100 mb-2">{cuisine.location}</div>
                               <div className="text-sm text-orange-800 dark:text-orange-200 mb-2">{cuisine.foodCulture}</div>
                               {cuisine.specialties.length > 0 && (
                                 <div className="mb-2">
                                   <div className="text-xs font-medium text-orange-800 dark:text-orange-200 mb-1">Must-Try Dishes:</div>
                                   <div className="flex flex-wrap gap-1">
                                     {cuisine.specialties.slice(0, 4).map((dish, dIdx) => (
                                       <span key={dIdx} className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-300 rounded">
                                         {dish}
                                       </span>
                                     ))}
                                   </div>
                                 </div>
                               )}
                               {cuisine.famousRestaurants.length > 0 && (
                                 <div>
                                   <div className="text-xs font-medium text-orange-800 dark:text-orange-200 mb-1">Famous Restaurants:</div>
                                   <div className="text-xs text-orange-700 dark:text-orange-300">
                                     {cuisine.famousRestaurants.slice(0, 2).join(", ")}
                                   </div>
                                 </div>
                               )}
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {/* Real-time Update Status */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Smart Route Recommendations</h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRoutes(false)}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                Modify Trip
              </Button>
            </div>
          </div>

          {/* Smart Route Cards */}
          <div className="space-y-6 mb-6">
            {routes.map((route) => (
              <Card
                key={route.id}
                className={`cursor-pointer transition-all ${
                  selectedRoute === route.id ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : "hover:shadow-md"
                }`}
                onClick={() => setSelectedRoute(route.id)}
              >
                <CardContent className="p-6">
                  {/* Route Header with AI Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-lg mr-3 ${
                          route.type === "smart_optimized"
                            ? "bg-purple-100 dark:bg-purple-900/30"
                            : route.type === "fastest"
                              ? "bg-orange-100 dark:bg-orange-900/30"
                              : route.type === "scenic"
                                ? "bg-green-100 dark:bg-green-900/30"
                                : "bg-blue-100 dark:bg-blue-900/30"
                        }`}
                      >
                        {getRouteIcon(route.type)}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mr-2">{route.name}</h3>
                          {route.type === "smart_optimized" && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded-full">
                              AI Optimized
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span>{route.distance} km</span>
                          <span className="flex items-center">
                            {route.duration}
                            {route.originalDuration !== route.duration && (
                              <span className="ml-1 text-green-600 dark:text-green-400">
                                (saved{" "}
                                {formatTime(
                                  Number.parseInt(route.originalDuration.split("h")[0]) * 60 +
                                    Number.parseInt(route.originalDuration.split("h")[1]?.split("m")[0] || "0") -
                                    (Number.parseInt(route.duration.split("h")[0]) * 60 +
                                      Number.parseInt(route.duration.split("h")[1]?.split("m")[0] || "0")),
                                )}
                                )
                              </span>
                            )}
                          </span>
                          <div className="flex items-center">
                            <Target className="w-3 h-3 mr-1" />
                            <span>{route.confidenceScore}% confidence</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        ₹{route.fuelCost + route.tollCost}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total cost</div>
                    </div>
                  </div>

                  {/* Traffic Status */}
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Activity className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">Traffic Status</span>
                      </div>
                      <div className={`flex items-center ${getTrafficColor(route.trafficData.level)}`}>
                        <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                        <span className="capitalize font-medium">{route.trafficData.level}</span>
                      </div>
                    </div>
                    {route.trafficData.delay > 0 && (
                      <div className="text-sm text-orange-600 dark:text-orange-400">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {route.trafficData.delay} min delay expected
                      </div>
                    )}
                    {route.trafficData.incidents.length > 0 && (
                      <div className="mt-2">
                        {route.trafficData.incidents.map((incident, index) => (
                          <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            {incident.type} at {incident.location}
                            {incident.estimatedClearTime && (
                              <span className="ml-2 text-green-600 dark:text-green-400">
                                (clears in {incident.estimatedClearTime})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Route Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Fuel className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {route.fuelConsumption}L
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Fuel needed</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-600" />
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">₹{route.fuelCost}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Fuel cost</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Star className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{route.scenicRating}/5</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Scenic rating</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Shield className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {route.maintenanceAlerts.length}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Maintenance alerts</div>
                    </div>
                  </div>

                  {/* Fuel Insights */}
                  {route.fuelInsights && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Fuel className="w-4 h-4 mr-2 text-green-600" />
                          <span className="font-medium text-green-900 dark:text-green-100">Fuel Price Insights</span>
                        </div>
                        <div className="flex items-center text-green-700 dark:text-green-300">
                          <TrendingDown className="w-4 h-4 mr-1" />
                          <span className="capitalize">{route.fuelInsights.trend}</span>
                        </div>
                      </div>
                      <div className="text-sm text-green-800 dark:text-green-200">
                        <div className="flex justify-between mb-1">
                          <span>Current: ₹{route.fuelInsights.currentPrice}/L</span>
                          <span>Best: ₹{route.fuelInsights.bestPriceLocation.price}/L</span>
                        </div>
                        <div className="font-medium">{route.fuelInsights.recommendation}</div>
                      </div>
                    </div>
                  )}

                  {/* Maintenance Alerts */}
                  {route.maintenanceAlerts.length > 0 && (
                    <div className="mb-4">
                      {route.maintenanceAlerts.map((alert, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border mb-2 ${
                            alert.urgency === "critical"
                              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                              : alert.urgency === "high"
                                ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                                : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Wrench className={`w-4 h-4 mr-2 ${getUrgencyColor(alert.urgency)}`} />
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {alert.type.replace("_", " ").toUpperCase()}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(alert.urgency)}`}>
                              {alert.urgency.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">{alert.description}</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {alert.recommendedAction}
                          </div>
                          {alert.nearbyServices.length > 0 && (
                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                              Nearby: {alert.nearbyServices[0].name} ({alert.nearbyServices[0].distance}km) - ₹
                              {alert.nearbyServices[0].estimatedCost}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI Insights */}
                  {route.aiInsights.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center mb-2">
                        <Lightbulb className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">AI Insights</span>
                      </div>
                      <div className="space-y-1">
                        {route.aiInsights.map((insight, index) => (
                          <div key={index} className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
                            <CheckCircle2 className="w-3 h-3 mr-2 mt-0.5 text-blue-600" />
                            {insight}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learning Improvements */}
                  {route.learningImprovements.length > 0 && (
                    <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center mb-2">
                        <Brain className="w-4 h-4 mr-2 text-purple-600" />
                        <span className="font-medium text-purple-900 dark:text-purple-100">Learning Improvements</span>
                      </div>
                      <div className="space-y-1">
                        {route.learningImprovements.map((improvement, index) => (
                          <div key={index} className="text-sm text-purple-800 dark:text-purple-200 flex items-start">
                            <BarChart3 className="w-3 h-3 mr-2 mt-0.5 text-purple-600" />
                            {improvement}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alternative Routes Alert */}
                  {route.alternativeRoutes && route.alternativeRoutes.length > 0 && (
                    <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="w-4 h-4 mr-2 text-orange-600" />
                        <span className="font-medium text-orange-900 dark:text-orange-100">Alternative Available</span>
                      </div>
                      {route.alternativeRoutes.map((alt, index) => (
                        <div key={index} className="text-sm text-orange-800 dark:text-orange-200">
                          <div className="font-medium">{alt.reason}</div>
                          <div>
                            {alt.route.name}: {alt.route.duration} ({alt.route.distance}km) - ₹{alt.route.fuelCost}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Expand/Collapse Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {route.highlights.map((highlight, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedRoute(expandedRoute === route.id ? null : route.id)
                      }}
                    >
                      {expandedRoute === route.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Expanded Route Details */}
                  {expandedRoute === route.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Smart Stops</h4>
                      <div className="space-y-3">
                        {route.stops.map((stop) => (
                          <div
                            key={stop.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-center">
                              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-3">
                                {getStopIcon(stop.type)}
                              </div>
                              <div>
                                <div className="flex items-center">
                                  <div className="font-medium text-gray-900 dark:text-gray-100 mr-2">{stop.name}</div>
                                  <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(stop.priority)}`}>
                                    {stop.priority}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {stop.distance} km • {stop.estimatedTime} from start
                                </div>
                                {stop.aiRecommendation && (
                                  <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center mt-1">
                                    <Brain className="w-3 h-3 mr-1" />
                                    {stop.aiRecommendation}
                                  </div>
                                )}
                                <div className="flex items-center mt-1">
                                  <div className="flex items-center mr-3">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < Math.floor(stop.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">{stop.rating}</span>
                                  </div>
                                  {stop.fuelPrice && (
                                    <span className="text-xs text-green-600 dark:text-green-400 mr-3">
                                      ₹{stop.fuelPrice}/L
                                    </span>
                                  )}
                                  {stop.costSavings && (
                                    <span className="text-xs text-green-600 dark:text-green-400">
                                      Save ₹{stop.costSavings}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex flex-wrap gap-1 justify-end">
                                {stop.services.slice(0, 3).map((service, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                                  >
                                    {service}
                                  </span>
                                ))}
                                {stop.services.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                                    +{stop.services.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enhanced Start Trip Button */}
          {selectedRoute && (
            <div className="fixed bottom-6 left-4 right-4 z-10">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {routes.find((r) => r.id === selectedRoute)?.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <span className="mr-3">
                        {routes.find((r) => r.id === selectedRoute)?.distance} km •{" "}
                        {routes.find((r) => r.id === selectedRoute)?.duration}
                      </span>
                      <span className="flex items-center text-green-600 dark:text-green-400">
                        <Target className="w-3 h-3 mr-1" />
                        {routes.find((r) => r.id === selectedRoute)?.confidenceScore}% AI confidence
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-gray-100">
                      ₹
                      {(routes.find((r) => r.id === selectedRoute)?.fuelCost || 0) +
                        (routes.find((r) => r.id === selectedRoute)?.tollCost || 0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total cost</div>
                  </div>
                </div>

                {/* Smart Features Status */}
                <div className="flex items-center justify-center space-x-4 mb-3 text-xs">
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <Wifi className="w-3 h-3 mr-1" />
                    Live Traffic
                  </div>
                  <div className="flex items-center text-blue-600 dark:text-blue-400">
                    <Brain className="w-3 h-3 mr-1" />
                    AI Learning
                  </div>
                  <div className="flex items-center text-purple-600 dark:text-purple-400">
                    <Fuel className="w-3 h-3 mr-1" />
                    Fuel Optimization
                  </div>
                  <div className="flex items-center text-orange-600 dark:text-orange-400">
                    <Wrench className="w-3 h-3 mr-1" />
                    Maintenance Alerts
                  </div>
                </div>

                <ResponsiveButton
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={startTrip}
                  icon={<Play className="w-5 h-5" />}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Start AI-Powered Navigation
                </ResponsiveButton>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AITripPlanner
