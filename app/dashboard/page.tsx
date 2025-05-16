'use client'

import { useRole } from '@/contexts/RoleContext'
import ContractsDashboard from '@/components/ContractsDashboard'
import AdjudicatorDashboard from '@/components/AdjudicatorDashboard'
import AdminDashboard from '@/components/AdminDashboard'

export default function DashboardPage() {
  const { role } = useRole()

  switch (role) {
    case 'Buyer':
    case 'Freelancer':
      return <ContractsDashboard />
    case 'Adjudicator':
      return <AdjudicatorDashboard />
    case 'Admin':
      return <AdminDashboard />
    default:
      return <div>Invalid role</div>
  }
}
