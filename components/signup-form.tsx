"use client"

import type React from "react"

import { useState } from "react"
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react"

interface SignupFormProps {
  onSignup: (email: string, password: string, name: string) => void
  onSwitchToLogin: () => void
  onGoogleSignup?: () => void
}

const SignupForm = ({ onSignup, onSwitchToLogin, onGoogleSignup }: SignupFormProps) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [signupProgress, setSignupProgress] = useState(0)

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Reset errors
    setErrors({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    })

    // Validate inputs
    let isValid = true

    if (!name) {
      setErrors((prev) => ({ ...prev, name: "Name is required" }))
      isValid = false
    }

    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }))
      isValid = false
    } else if (!validateEmail(email)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email" }))
      isValid = false
    }

    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }))
      isValid = false
    } else if (password.length < 6) {
      setErrors((prev) => ({ ...prev, password: "Password must be at least 6 characters" }))
      isValid = false
    }

    if (password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }))
      isValid = false
    }

    if (isValid) {
      setIsLoading(true)

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSignupProgress((prev) => {
          const newProgress = prev + 20
          if (newProgress >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return newProgress
        })
      }, 300)

      // Simulate API call
      setTimeout(() => {
        clearInterval(progressInterval)
        setSignupProgress(100)

        setTimeout(() => {
          onSignup(email, password, name)
          setIsLoading(false)
          setSignupProgress(0)
        }, 500)
      }, 1500)
    }
  }

  const handleGoogleSignup = () => {
    setIsGoogleLoading(true)
    // Simulate Google signup
    setTimeout(() => {
      if (onGoogleSignup) {
        onGoogleSignup()
      } else {
        onSignup("google-user@gmail.com", "google-auth", "Google User")
      }
      setIsGoogleLoading(false)
    }, 1500)
  }

  return (
    <div className="py-8 px-4 sm:px-6 md:px-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className={`w-full pl-10 pr-3 py-2 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              className={`w-full pl-10 pr-3 py-2 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              className={`w-full pl-10 pr-10 py-2 border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || isGoogleLoading}
            >
              {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              className={`w-full pl-10 pr-10 py-2 border ${errors.confirmPassword ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          className="w-full bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors relative overflow-hidden"
          disabled={isLoading || isGoogleLoading}
        >
          {isLoading ? (
            <>
              <div
                className="absolute inset-0 bg-orange-600"
                style={{ width: `${signupProgress}%`, transition: "width 0.3s ease" }}
              ></div>
              <span className="relative z-10">Creating Account... {signupProgress}%</span>
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          className="mt-4 w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg py-2 px-4 text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={isLoading || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Connecting...</span>
            </div>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Sign up with Google</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <button className="text-orange-600 font-medium" onClick={onSwitchToLogin}>
            Login
          </button>
        </p>
      </div>
    </div>
  )
}

export default SignupForm
