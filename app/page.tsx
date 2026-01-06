"use client"

import { useState, useEffect } from "react"
import { Map, Bookmark, Globe, Home, Clock, Settings, MapPin, Bluetooth, Sparkles, Zap, Shield } from "lucide-react"
import MapComponent from "@/components/map-component"
import CarHealthDashboard from "@/components/car-health-dashboard"
import FuelStations from "@/components/fuel-stations"
import MileageTracker from "@/components/mileage-tracker"
import ParkingFinder from "@/components/parking-finder"
import LiveTrackingView from "@/components/live-tracking-view"
import LoginForm from "@/components/login-form"
import SignupForm from "@/components/signup-form"
import EnhancedBluetoothConnect from "@/components/enhanced-bluetooth-connect"
import ResponsiveButton from "@/components/ui/responsive-button"
import { useTheme } from "@/context/theme-context"
import { useMediaQuery } from "@/hooks/use-media-query"
import ParkingManagement from "@/components/parking-management"
import useUnifiedBluetooth from "@/hooks/use-unified-bluetooth"
import useEnhancedGPS from "@/hooks/use-enhanced-gps"
import SOSButton from "@/components/sos-button"
import SOSDashboard from "@/components/sos-dashboard"
import EnhancedSettings from "@/components/enhanced-settings"
import TripPlannerCard from "@/components/trip-planner-card"
import AITripPlanner from "@/components/ai-trip-planner"

export default function VehicleIntelligence() {
  const { theme, resolvedTheme, accentColor, toggleTheme } = useTheme()
  const isLandscape = useMediaQuery("(orientation: landscape)")
  const isMobile = useMediaQuery("(max-width: 640px)")
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)")

  const [currentTime, setCurrentTime] = useState("9:41 AM")
  const [activeTab, setActiveTab] = useState("home")
  const [showMap, setShowMap] = useState(false)
  const [showCarHealth, setShowCarHealth] = useState(false)
  const [currentView, setCurrentView] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [showSignupForm, setShowSignupForm] = useState(false)
  const [showBluetoothConnect, setShowBluetoothConnect] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; photo?: string } | null>(null)
  const [carData, setCarData] = useState({
    fuelLevel: 65,
    oilLife: 78,
    tirePressure: {
      frontLeft: 32,
      frontRight: 33,
      rearLeft: 32,
      rearRight: 31,
    },
    batteryHealth: 92,
    mileage: 12543,
    engineTemp: "Normal",
    lastService: "2023-12-15",
    isConnected: false,
  })

  const [showSOSDashboard, setShowSOSDashboard] = useState(false)
  const [showTripPlanner, setShowTripPlanner] = useState(false)

  // Enhanced Car Bluetooth hook with permissions
  const {
    isSupported: bluetoothSupported,
    isConnected: bluetoothConnected,
    connectedDevice,
    carData: liveCarData,
    connectionQuality,
    error: bluetoothError,
    permission: bluetoothPermission,
  } = useUnifiedBluetooth({
    autoConnect: false,
    enableRealTimeData: true,
    dataUpdateInterval: 1000,
    reconnectAttempts: 3,
  })

  // Enhanced GPS tracking hook with permissions
  const {
    currentPosition,
    isTracking: isGPSTracking,
    accuracy,
    speed: gpsSpeed,
    heading,
    error: gpsError,
    hasPermission: hasGPSPermission,
    totalDistance,
    averageSpeed,
  } = useEnhancedGPS({
    enableHighAccuracy: true,
    trackingInterval: 1000,
    distanceFilter: 2,
    autoStart: false,
  })

  // Update car data from Bluetooth device data
  useEffect(() => {
    if (bluetoothConnected && liveCarData) {
      setCarData((prev) => ({
        ...prev,
        isConnected: true,
        batteryHealth: liveCarData.batteryLevel || prev.batteryHealth,
        fuelLevel: liveCarData.fuelLevel || prev.fuelLevel,
        engineTemp: liveCarData.engineTemp ? `${Math.round(liveCarData.engineTemp)}°C` : prev.engineTemp,
      }))
    } else {
      setCarData((prev) => ({
        ...prev,
        isConnected: false,
      }))
    }
  }, [bluetoothConnected, liveCarData])

  // Update time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const ampm = hours >= 12 ? "PM" : "AM"
      const formattedHours = hours % 12 || 12
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
      setCurrentTime(`${formattedHours}:${formattedMinutes} ${ampm}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleLogin = (email: string, password: string) => {
    setIsLoggedIn(true)
    setUserProfile({
      name: email.split("@")[0],
      email: email,
    })
    setShowLoginForm(false)
  }

  const handleGoogleLogin = () => {
    setIsLoggedIn(true)
    setUserProfile({
      name: "Google User",
      email: "user@gmail.com",
      photo: "https://lh3.googleusercontent.com/a/default-user",
    })
    setShowLoginForm(false)
    setShowSignupForm(false)
  }

  const handleSignup = (email: string, password: string, name: string) => {
    setIsLoggedIn(true)
    setUserProfile({
      name: name,
      email: email,
    })
    setShowSignupForm(false)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserProfile(null)
    setActiveTab("home")
  }

  const handleConnectCar = (connected: boolean, deviceInfo?: any) => {
    setCarData((prev) => ({
      ...prev,
      isConnected: connected,
    }))

    if (connected && deviceInfo) {
      setCarData((prev) => ({
        ...prev,
        batteryHealth: deviceInfo.batteryLevel || prev.batteryHealth,
        fuelLevel: deviceInfo.fuelLevel || prev.fuelLevel,
        engineTemp: deviceInfo.engineTemp || prev.engineTemp,
      }))
    }

    setShowBluetoothConnect(false)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setCurrentView(null)
    setShowMap(false)
    setShowCarHealth(false)
    setShowLoginForm(false)
    setShowSignupForm(false)
    setShowBluetoothConnect(false)
    setShowSettings(false)
  }

  const handleCardClick = (view: string) => {
    if (!isLoggedIn) {
      setShowLoginForm(true)
      return
    }

    setCurrentView(view)

    if (view === "findParking" || view === "locateFuel" || view === "liveTracking") {
      setShowMap(true)
    } else {
      setShowMap(false)
    }

    if (view === "mileageMonitoring") {
      setShowCarHealth(true)
    } else {
      setShowCarHealth(false)
    }

    if (view === "connectCar") {
      setShowBluetoothConnect(true)
    }
  }

  const renderContent = () => {
    if (showLoginForm) {
      return (
        <LoginForm
          onLogin={handleLogin}
          onGoogleLogin={handleGoogleLogin}
          onSwitchToSignup={() => {
            setShowLoginForm(false)
            setShowSignupForm(true)
          }}
        />
      )
    }

    if (showSignupForm) {
      return (
        <SignupForm
          onSignup={handleSignup}
          onGoogleSignup={handleGoogleLogin}
          onSwitchToLogin={() => {
            setShowSignupForm(false)
            setShowLoginForm(true)
          }}
        />
      )
    }

    if (showBluetoothConnect) {
      return <EnhancedBluetoothConnect onConnect={handleConnectCar} debugMode={false} />
    }

    if (showSettings) {
      return (
        <EnhancedSettings
          userProfile={userProfile}
          onLogout={handleLogout}
          onUpdateProfile={setUserProfile}
          bluetoothStatus={{
            supported: bluetoothSupported,
            connected: bluetoothConnected,
            device: connectedDevice,
            quality: connectionQuality,
            error: bluetoothError,
            permission: bluetoothPermission,
          }}
          gpsStatus={{
            tracking: isGPSTracking,
            accuracy,
            position: currentPosition,
            speed: gpsSpeed,
            error: gpsError,
            hasPermission: hasGPSPermission,
          }}
          carData={carData}
          onConnectCar={handleConnectCar}
          onShowSOSDashboard={() => setShowSOSDashboard(true)}
        />
      )
    }

    if (showSOSDashboard) {
      return <SOSDashboard onClose={() => setShowSOSDashboard(false)} />
    }

    if (showTripPlanner) {
      return <AITripPlanner onBack={() => setShowTripPlanner(false)} />
    }

    if (activeTab === "home") {
      if (currentView === "findParking") {
        return <ParkingFinder />
      } else if (currentView === "mileageMonitoring") {
        return <MileageTracker carData={carData} />
      } else if (currentView === "liveTracking") {
        return <LiveTrackingView />
      } else if (currentView === "locateFuel") {
        return <FuelStations />
      }

      return (
        <>
          {/* Enhanced Hero Section */}
          <div className="relative overflow-hidden rounded-2xl mb-8 p-8 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white animate-fadeIn">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-4 right-4 opacity-20">
              <Sparkles className="w-16 h-16" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-white/20 rounded-full mr-4">
                  <Zap className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">Vehicle Intelligence</h1>
                  <p className="text-orange-100 text-lg">Smart connectivity for the modern driver</p>
                </div>
              </div>
              <p className="text-orange-50 mb-6 max-w-2xl">
                Experience next-generation vehicle management with real-time GPS tracking, Bluetooth connectivity, and
                intelligent safety features designed for your peace of mind.
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-orange-200" />
                  <span>Real-time Tracking</span>
                </div>
                <div className="flex items-center text-sm">
                  <Bluetooth className="w-4 h-4 mr-2 text-orange-200" />
                  <span>Smart Connectivity</span>
                </div>
                <div className="flex items-center text-sm">
                  <Shield className="w-4 h-4 mr-2 text-orange-200" />
                  <span>Emergency SOS</span>
                </div>
              </div>

              {!isLoggedIn && (
                <div className="flex gap-3 flex-col sm:flex-row">
                  <ResponsiveButton
                    variant="secondary"
                    onClick={() => setShowLoginForm(true)}
                    className="bg-white text-orange-600 hover:bg-orange-50"
                  >
                    Get Started
                  </ResponsiveButton>
                  <ResponsiveButton
                    variant="outline"
                    onClick={() => setShowSignupForm(true)}
                    className="border-white text-white hover:bg-white/10"
                  >
                    Learn More
                  </ResponsiveButton>
                </div>
              )}
            </div>
          </div>

          {!isLoggedIn && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl mb-6 border border-blue-100 dark:border-blue-800 animate-fadeIn">
              <div className="flex items-start">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
                  <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Welcome to the Future of Driving
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 text-sm mb-4">
                    Join thousands of drivers who trust Vehicle Intelligence for their daily commute and long journeys.
                    Sign in or create an account to unlock powerful features.
                  </p>
                  <div className="flex gap-3 flex-col sm:flex-row">
                    <ResponsiveButton variant="primary" onClick={() => setShowLoginForm(true)}>
                      Sign In
                    </ResponsiveButton>
                    <ResponsiveButton variant="outline" onClick={() => setShowSignupForm(true)}>
                      Create Account
                    </ResponsiveButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Real-time Status Cards */}
          {isLoggedIn && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* GPS Status */}
              <div
                className={`p-6 rounded-xl border animate-fadeIn transition-all hover:shadow-lg ${
                  isGPSTracking
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
                    : "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div
                      className={`p-2 rounded-lg mr-3 ${isGPSTracking ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-800"}`}
                    >
                      <MapPin
                        className={`w-5 h-5 ${isGPSTracking ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}
                      />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">GPS Tracking</h3>
                  </div>
                  {isGPSTracking && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                </div>
                <p
                  className={`text-sm mb-2 ${isGPSTracking ? "text-green-700 dark:text-green-300" : "text-gray-600 dark:text-gray-400"}`}
                >
                  {isGPSTracking
                    ? `Active • ${accuracy ? `±${Math.round(accuracy)}m accuracy` : "High precision"}`
                    : "Enable real-time location tracking"}
                </p>
                {currentPosition && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                    {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
                    {gpsSpeed && <span className="ml-2">• {Math.round(gpsSpeed * 3.6)} km/h</span>}
                  </div>
                )}
              </div>

              {/* Bluetooth Status */}
              <div
                className={`p-6 rounded-xl border animate-fadeIn transition-all hover:shadow-lg ${
                  bluetoothConnected
                    ? "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800"
                    : "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div
                      className={`p-2 rounded-lg mr-3 ${bluetoothConnected ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-800"}`}
                    >
                      <Bluetooth
                        className={`w-5 h-5 ${bluetoothConnected ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}
                      />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Car Connection</h3>
                  </div>
                  {bluetoothConnected && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
                </div>
                <p
                  className={`text-sm mb-2 ${bluetoothConnected ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-400"}`}
                >
                  {bluetoothConnected
                    ? `Connected to ${connectedDevice?.name} • ${connectionQuality} signal`
                    : "Connect to your car's OBD-II or Bluetooth system"}
                </p>
                {liveCarData && (
                  <div className="grid grid-cols-2 gap-2 text-xs bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                    <div>Speed: {liveCarData.speed ? Math.round(liveCarData.speed) : 0} km/h</div>
                    <div>Fuel: {liveCarData.fuelLevel ? Math.round(liveCarData.fuelLevel) : "N/A"}%</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isLoggedIn && !carData.isConnected && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl mb-6 border border-purple-100 dark:border-purple-800 animate-fadeIn">
              <div className="flex items-start">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-4">
                  <Bluetooth className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Connect Your Vehicle</h3>
                  <p className="text-purple-800 dark:text-purple-200 text-sm mb-4">
                    Connect to your car via Bluetooth to enable real-time monitoring, diagnostics, and enhanced safety
                    features
                  </p>
                  <ResponsiveButton
                    variant="primary"
                    onClick={() => handleCardClick("connectCar")}
                    icon={<Bluetooth className="w-4 h-4" />}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Connect Vehicle
                  </ResponsiveButton>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Feature Cards */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-text-primary dark:text-text-primary">Smart Features</h2>

            <div
              className={`grid ${isLandscape && !isMobile ? "grid-cols-4" : "grid-cols-2"} gap-4 animate-slideUp`}
              style={{ animationDelay: "0.2s" }}
            >
              <button
                className="group bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all hover:shadow-lg hover:-translate-y-1"
                onClick={() => handleCardClick("liveTracking")}
              >
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg mb-4 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  Live Tracking
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Real-time GPS monitoring with route optimization
                </p>
              </button>

              <button
                className="group bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all hover:shadow-lg hover:-translate-y-1"
                onClick={() => handleCardClick("findParking")}
              >
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-4 group-hover:scale-110 transition-transform">
                  <Map className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Smart Parking
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Find and reserve parking spots instantly</p>
              </button>

              <button
                className="group bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all hover:shadow-lg hover:-translate-y-1"
                onClick={() => handleCardClick("mileageMonitoring")}
              >
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mb-4 group-hover:scale-110 transition-transform">
                  <Bookmark className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  Vehicle Health
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monitor engine, fuel, and diagnostics</p>
              </button>

              <button
                className="group bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all hover:shadow-lg hover:-translate-y-1"
                onClick={() => handleCardClick("locateFuel")}
              >
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-4 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Fuel Stations
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Locate nearby fuel stations with prices</p>
              </button>

              {/* AI Trip Planner Card - Prominent placement */}
              <div className="col-span-2 mb-6">
                <TripPlannerCard onNavigateToPlanner={() => setShowTripPlanner(true)} />
              </div>
            </div>
          </div>

          {/* Stats Section for logged in users */}
          {isLoggedIn && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl mb-6 animate-fadeIn">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Your Driving Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {totalDistance ? `${(totalDistance / 1000).toFixed(1)}` : "0"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">km Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {averageSpeed ? Math.round(averageSpeed * 3.6) : "0"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">km/h Avg</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{carData.fuelLevel}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Fuel Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {carData.batteryHealth}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Battery</div>
                </div>
              </div>
            </div>
          )}
        </>
      )
    } else if (activeTab === "mileage") {
      return <MileageTracker carData={carData} />
    } else if (activeTab === "fuelStations") {
      return <FuelStations />
    } else if (activeTab === "map") {
      return (
        <div className="p-4 animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-text-primary dark:text-text-primary">Real-time Map</h2>
          <MapComponent view="locateFuel" fullScreen={true} />
        </div>
      )
    } else if (activeTab === "settings") {
      return <CarHealthDashboard carData={carData} />
    }
  }

  return (
    <div
      className={`flex flex-col min-h-screen bg-app-bg text-text-primary theme-transition`}
      style={{ backgroundColor: resolvedTheme === "dark" ? "#0f172a" : "#f8fafc" }}
    >
      {/* Parking Management */}
      <ParkingManagement isLoggedIn={isLoggedIn} />

      {/* Main Content */}
      <div className={`flex-1 px-4 sm:px-6 pb-24 ${isLandscape ? "pb-20" : "pb-28"}`}>
        {showMap && !showLoginForm && !showSignupForm && !showBluetoothConnect && !showSettings && (
          <div className="mb-4 animate-fadeIn">
            <MapComponent view={currentView} />
          </div>
        )}

        {showCarHealth && !showLoginForm && !showSignupForm && !showBluetoothConnect && !showSettings && (
          <div className="mb-4 animate-fadeIn">
            <CarHealthDashboard carData={carData} />
          </div>
        )}

        {renderContent()}
      </div>

      {/* Floating SOS Button */}
      {isLoggedIn && <SOSButton variant="floating" size="lg" />}

      {/* Bottom Navigation */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg backdrop-blur-lg bg-white/95 dark:bg-gray-900/95`}
      >
        <div className={`flex justify-around items-center px-2 sm:px-4 ${isLandscape ? "py-1.5" : "py-2"}`}>
          <button className="flex flex-col items-center btn-hover group" onClick={() => handleTabChange("home")}>
            <Home
              className={`w-6 h-6 transition-colors ${activeTab === "home" ? "text-orange-500 dark:text-orange-400" : "text-gray-400 dark:text-gray-500 group-hover:text-orange-400"}`}
            />
            <span
              className={`text-xs font-medium transition-colors ${activeTab === "home" ? "text-orange-500 dark:text-orange-400" : "text-gray-400 dark:text-gray-500 group-hover:text-orange-400"}`}
            >
              Home
            </span>
          </button>

          <button className="flex flex-col items-center btn-hover group" onClick={() => handleTabChange("mileage")}>
            <Clock
              className={`w-6 h-6 transition-colors ${activeTab === "mileage" ? "text-orange-500 dark:text-orange-400" : "text-gray-400 dark:text-gray-500 group-hover:text-orange-400"}`}
            />
            <span
              className={`text-xs font-medium transition-colors ${activeTab === "mileage" ? "text-orange-500 dark:text-orange-400" : "text-gray-400 dark:text-gray-500 group-hover:text-orange-400"}`}
            >
              Mileage
            </span>
          </button>

          <button className="flex flex-col items-center btn-hover group" onClick={() => handleTabChange("map")}>
            <MapPin
              className={`w-6 h-6 transition-colors ${activeTab === "map" ? "text-orange-500 dark:text-orange-400" : "text-gray-400 dark:text-gray-500 group-hover:text-orange-400"}`}
            />
            <span
              className={`text-xs font-medium transition-colors ${activeTab === "map" ? "text-orange-500 dark:text-orange-400" : "text-gray-400 dark:text-gray-500 group-hover:text-orange-400"}`}
            >
              Map
            </span>
          </button>

          <button
            className="flex flex-col items-center btn-hover group"
            onClick={() => handleTabChange("fuelStations")}
          >
            <Globe
              className={`w-6 h-6 transition-colors ${activeTab === "fuelStations" ? "text-orange-500 dark:text-orange-400" : "text-gray-400 dark:text-gray-500 group-hover:text-orange-400"}`}
            />
            <span
              className={`text-xs font-medium transition-colors ${activeTab === "fuelStations" ? "text-orange-500 dark:text-orange-400" : "text-gray-400 dark:text-gray-500 group-hover:text-orange-400"}`}
            >
              Fuel
            </span>
          </button>

          <button className="flex flex-col items-center btn-hover group" onClick={() => setShowSettings(true)}>
            <Settings
              className={`w-6 h-6 transition-colors ${showSettings ? "text-orange-500 dark:text-orange-400" : "text-gray-400 dark:text-gray-500 group-hover:text-orange-400"}`}
            />
            <span
              className={`text-xs font-medium transition-colors ${showSettings ? "text-orange-500 dark:text-orange-400" : "text-gray-400 dark:text-gray-500 group-hover:text-orange-400"}`}
            >
              Settings
            </span>
          </button>
        </div>

        {/* iOS Home Indicator */}
        <div className="flex justify-center pb-2 pt-1">
          <div className="w-32 h-1 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
