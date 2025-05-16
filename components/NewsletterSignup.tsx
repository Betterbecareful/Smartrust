"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

export function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [ipAddress, setIpAddress] = useState("")
  const { toast } = useToast()
  const MAX_SIGNUPS = 3 // Limit per IP

  useEffect(() => {
    // Fetch the user's IP address
    fetch("https://api.ipify.org?format=json")
      .then((response) => response.json())
      .then((data) => setIpAddress(data.ip))
      .catch((error) => console.error("Error fetching IP:", error))
  }, [])

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ipAddress) {
      toast({
        title: "Error",
        description: "Unable to fetch your IP address. Please try again later.",
        variant: "destructive",
      })
      return
    }

    // Improved email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    try {
      // Count the existing signups for this IP
      const { count, error: countError } = await supabase
        .from("newsletter_signups")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", ipAddress)

      if (countError) {
        console.error("Error counting newsletter signups:", countError)
        toast({
          title: "Error",
          description: "An error occurred while verifying signups. Please try again.",
          variant: "destructive",
        })
        return
      }

      if (count >= MAX_SIGNUPS) {
        toast({
          title: "Signup Limit Reached",
          description: `You have already signed up ${MAX_SIGNUPS} times from this IP address. Please try again later.`,
          variant: "destructive",
        })
        return
      }

      // Insert the new signup
      const { error } = await supabase.from("newsletter_signups").insert({
        ip_address: ipAddress,
        email: email,
      })

      if (error) {
        console.error("Error saving newsletter signup:", error)
        toast({
          title: "Error",
          description: "An error occurred while signing up. Please try again.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Subscribed!",
        description: "You've been added to our newsletter. Thank you!",
      })
      setEmail("") // Clear the email field
    } catch (error) {
      console.error("Unexpected error during newsletter signup:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-100 to-purple-100 dark:from-gray-800 dark:to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
          Join SmarTrust And Get Early Access
        </h2>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-300">
          Want to get notified when we go live? Get early access to a safer, more transparent way to do business.
          Whether you're a freelancer, a buyer, or a platform looking to enhance transaction security, SmarTrust is your
          partner in creating trustworthy connections.
        </p>
        <form onSubmit={handleNewsletterSignup} className="mt-8">
          <Label htmlFor="newsletter-email" className="mb-2 block text-gray-700 dark:text-gray-300">
            Sign up for our newsletter:
          </Label>
          <div className="flex">
            <Input
              id="newsletter-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mr-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
              Subscribe
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
