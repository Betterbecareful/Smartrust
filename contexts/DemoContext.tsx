'use client'

import React, { createContext, useContext, useState } from 'react'

type DemoContextType = {
  isDemoAuthenticated: boolean
  toggleDemoAuth: () => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoAuthenticated, setIsDemoAuthenticated] = useState(false)

  const toggleDemoAuth = () => {
    setIsDemoAuthenticated(prev => !prev)
  }

  return (
    <DemoContext.Provider value={{ isDemoAuthenticated, toggleDemoAuth }}>
      {children}
    </DemoContext.Provider>
  )
}

export const useDemoAuth = () => {
  const context = useContext(DemoContext)
  if (context === undefined) {
    throw new Error('useDemoAuth must be used within a DemoProvider')
  }
  return context
}
