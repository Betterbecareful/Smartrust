"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme, systemTheme } = useTheme()
  const [isSystemTheme, setIsSystemTheme] = useState(true)

  useEffect(() => {
    // Check if there's a stored preference
    const storedTheme = localStorage.getItem("theme-preference")
    const storedIsSystem = localStorage.getItem("theme-is-system")

    if (storedTheme && storedIsSystem === "false") {
      setTheme(storedTheme)
      setIsSystemTheme(false)
    } else {
      // Start with system theme
      setTheme("system")
      setIsSystemTheme(true)
    }
  }, [setTheme])

  const toggleTheme = () => {
    // Get the current effective theme (what's actually showing)
    const currentEffectiveTheme = isSystemTheme ? systemTheme : theme

    if (isSystemTheme) {
      // First click: switch to opposite of system theme
      const newTheme = systemTheme === "dark" ? "light" : "dark"
      setTheme(newTheme)
      setIsSystemTheme(false)
      localStorage.setItem("theme-preference", newTheme)
      localStorage.setItem("theme-is-system", "false")
    } else {
      // Subsequent clicks: toggle between light and dark
      const newTheme = currentEffectiveTheme === "dark" ? "light" : "dark"
      setTheme(newTheme)
      localStorage.setItem("theme-preference", newTheme)
    }
  }

  // Determine which icon to show based on the current effective theme
  const currentEffectiveTheme = isSystemTheme ? systemTheme : theme
  const isDark = currentEffectiveTheme === "dark"

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {isDark ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
