'use client'

import React, { createContext, useContext, useState } from 'react'

type Role = 'Freelancer' | 'Buyer' | 'Adjudicator' | 'Admin'

type RoleContextType = {
  role: Role
  setRole: (role: Role) => void
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('Freelancer')

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = () => {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}
