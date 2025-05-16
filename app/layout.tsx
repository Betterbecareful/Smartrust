'use client';
import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./ClientLayout"
import dynamic from 'next/dynamic';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const Provider = dynamic(
  () => import('cubid-sdk').then((mod) => mod.Provider),
  { ssr: false }
);

const queryClient = new QueryClient();


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return <QueryClientProvider client={queryClient}>
    <Provider>
      <ClientLayout>{children}</ClientLayout>
    </Provider>
  </QueryClientProvider>
}


import './globals.css'