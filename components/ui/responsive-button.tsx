"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ResponsiveButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
  disabled?: boolean
  icon?: ReactNode
  iconPosition?: "left" | "right"
}

const ResponsiveButton = ({
  children,
  onClick,
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  icon,
  iconPosition = "left",
}: ResponsiveButtonProps) => {
  const baseStyles =
    "rounded-lg font-medium transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 flex items-center justify-center"

  const variantStyles = {
    primary: "bg-accent-blue text-white hover:bg-blue-600 dark:hover:bg-blue-500",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
    outline:
      "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
    danger: "bg-accent-red text-white hover:bg-red-600 dark:hover:bg-red-500",
  }

  const sizeStyles = {
    sm: "text-xs py-1.5 px-3",
    md: "text-sm py-2 px-4",
    lg: "text-base py-2.5 px-5",
  }

  const widthStyles = fullWidth ? "w-full" : ""

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        widthStyles,
        disabled && "opacity-50 cursor-not-allowed hover:scale-100 active:scale-100",
        className,
      )}
    >
      {icon && iconPosition === "left" && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
    </button>
  )
}

export default ResponsiveButton
