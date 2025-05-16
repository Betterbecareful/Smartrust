"use client"

import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { MainNav } from "@/components/MainNav"
import { AuthProvider } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/components/ThemeProvider"
import Link from "next/link"
import { JoinSmarTrustNewsletter } from "@/components/JoinSmarTrustNewsletter"
import { DemoProvider } from "@/contexts/DemoContext"
import { RoleProvider } from "@/contexts/RoleContext"
import { usePathname } from "next/navigation"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <DemoProvider>
            <RoleProvider>
              <AuthProvider>
                {(authContext) => (
                  <div className="flex min-h-screen flex-col" style={{ paddingTop: "112px" }}>
                    <header>
                      <MainNav />
                    </header>
                    <main className="flex-1">
                      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="relative">
                          <img
                            src="/abstract-purple-wave.png"
                            alt=""
                            className="w-full h-[60px] object-cover rounded-lg mb-6 opacity-30"
                          />
                          {children}
                          <img
                            src="/abstract-purple-geometric.png"
                            alt=""
                            className="w-full h-[60px] object-cover rounded-lg mt-6 opacity-30"
                          />
                        </div>
                      </div>
                    </main>
                    {!authContext.user && (
                      <>
                        {["/", "/about", "/faq", "/contact", "/terms", "/privacy"].includes(pathname) && (
                          <JoinSmarTrustNewsletter />
                        )}
                      </>
                    )}
                    <footer className="bg-purple-50 dark:bg-purple-900 text-purple-900 dark:text-purple-50 py-8">
                      <div className="container px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                          <div>
                            <h3 className="text-lg font-semibold mb-4">SmarTrust</h3>
                            <p className="text-xs">&copy; 2025 SmarTrust. All rights reserved.</p>
                          </div>
                          <div>
                            <ul className="space-y-2">
                              <li>
                                <Link href="/" className="hover:underline">
                                  Home
                                </Link>
                              </li>
                              <li>
                                <Link href="/about" className="hover:underline">
                                  About
                                </Link>
                              </li>
                              <li>
                                <Link href="/faq" className="hover:underline">
                                  FAQ
                                </Link>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <ul className="space-y-2">
                              <li>
                                <Link href="/contact" className="hover:underline">
                                  Contact Us
                                </Link>
                              </li>
                              <li>
                                <Link href="/terms" className="hover:underline">
                                  Terms of Service
                                </Link>
                              </li>
                              <li>
                                <Link href="/privacy" className="hover:underline">
                                  Data Privacy
                                </Link>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <ul className="space-y-2">
                              <li>
                                <a
                                  href="https://x.com/smartrustx"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                >
                                  X.com
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </footer>
                  </div>
                )}
              </AuthProvider>
            </RoleProvider>
          </DemoProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
