'use client';
import { useEffect } from 'react'
import { LandingPageContentTop } from '@/components/LandingPageContentTop'
import { LandingPageContentBottom } from '@/components/LandingPageContentBottom'
import { ContractGenerator } from '@/components/ContractGenerator'

export default function Home() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="md:w-1/2">
        <LandingPageContentTop />
        <div className="md:hidden">
          <ContractGenerator />
        </div>
        <LandingPageContentBottom />
      </div>
      <div className="hidden md:block md:w-1/2">
        <ContractGenerator />
      </div>
    </div>
  )
}
