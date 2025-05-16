'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from 'next/navigation'

export default function GetStarted({ initialEmail }: { initialEmail?: string } = {}) {
  console.log("Rendering GetStarted component"); // Confirm component rendering

  const [email, setEmail] = useState(initialEmail ?? '')
  const [otp, setOtp] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isOtpSending, setIsOtpSending] = useState(false)
  const { signIn, verifyOTP, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    console.log("Checking for user:", user); // Debug user state
    if (user) {
      console.log("Redirecting to /dashboard");
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsOtpSending(true)
    console.log("Attempting to send OTP for email:", email); // Debug email

    try {
      await signIn(email)
      console.log("OTP sent successfully"); // Log success
      setIsOtpSent(true) // Update state
      toast({
        title: "OTP Sent",
        description: "We've sent you a one-time password. Please check your email.",
      })
    } catch (error) {
      console.error("Send OTP Error:", error)
      toast({
        title: "Error",
        description: "An error occurred while sending the OTP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsOtpSending(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Verifying OTP:", otp); // Debug OTP

    try {
      await verifyOTP(email, otp)
      toast({
        title: "Success",
        description: "You've successfully signed in!",
      })
    } catch (error: any) {
      console.error("Verify OTP Error:", error)
      if (error.message.includes("expired") || error.status === 401) {
        toast({
          title: "Error",
          description: "The OTP has expired. Please request a new one.",
          variant: "destructive",
        })
        setIsOtpSent(false) // Reset to email input step
      } else {
        toast({
          title: "Error",
          description: "Invalid OTP. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Get Started with SmarTrust</h1>
      {isOtpSent ? (
        <>
          <p className="mb-4">Enter the OTP sent to your email.</p>
          <form onSubmit={handleVerifyOTP}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="otp">One-Time Password</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Verify OTP</Button>
              <Button
                onClick={handleSendOTP}
                className="w-full mt-2"
                disabled={isOtpSending}
              >
                Resend OTP
              </Button>
            </div>
          </form>
        </>
      ) : (
        <>
          <p className="mb-4">Enter your email to sign up or log in.</p>
          <form onSubmit={handleSendOTP}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={Boolean(initialEmail)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isOtpSending}>
                {isOtpSending ? "Sending..." : "Send OTP"}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
