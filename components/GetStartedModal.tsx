'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OTPModal } from "@/components/OTPModal"

interface GetStartedModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GetStartedModal({ isOpen, onClose }: GetStartedModalProps) {
  const [email, setEmail] = useState('')
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)
  const { signIn } = useAuth()
  const { toast } = useToast()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await signIn(email)
      console.log("SignIn result:", result)
      if (result.user === null && result.session === null) {
        setIsOtpModalOpen(true)
        toast({
          title: "Passcode Sent",
          description: "We've sent you a one-time passcode. Please check your email.",
        })
      } else {
        throw new Error("Unexpected response from signIn")
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error)
      toast({
        title: "Error",
        description: error?.message || "An error occurred while sending the passcode. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleOTPModalClose = () => {
    setIsOtpModalOpen(false)
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Get Started with SmarTrust</DialogTitle>
          </DialogHeader>
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
                />
              </div>
              <Button type="submit" className="w-full">Send Passcode</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {isOtpModalOpen && (
        <OTPModal 
          isOpen={isOtpModalOpen} 
          onClose={handleOTPModalClose} 
          email={email} 
          onBack={() => setIsOtpModalOpen(false)}
        />
      )}
    </>
  )
}
