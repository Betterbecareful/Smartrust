'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from '@/lib/supabase'

export default function Contact() {
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [ipAddress, setIpAddress] = useState('')
  const [submissionCount, setSubmissionCount] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    // Fetch the user's IP address
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => setIpAddress(data.ip))
      .catch(error => console.error('Error fetching IP:', error))
  }, [])

  useEffect(() => {
    if (ipAddress) {
      // Fetch the number of submissions for this IP
      const fetchSubmissions = async () => {
        const { data, error } = await supabase
          .from('contact_submissions')
          .select('count')
          .eq('ip_address', ipAddress)
          .single()

        if (error) {
          console.error('Error fetching contact submissions:', error)
        } else if (data) {
          setSubmissionCount(data.count)
        }
      }

      fetchSubmissions()
    }
  }, [ipAddress])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (submissionCount >= 3) {
      toast({
        title: "Submission Limit Reached",
        description: "You have reached the maximum number of contact form submissions. Please try again later.",
        variant: "destructive",
      })
      return
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!category) {
      toast({
        title: "Error",
        description: "Please select a category.",
        variant: "destructive",
      })
      return
    }

    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    // Update the submission count in the database
    const { error } = await supabase
      .from('contact_submissions')
      .upsert({ ip_address: ipAddress, count: submissionCount + 1 }, { onConflict: 'ip_address' })

    if (error) {
      console.error('Error updating contact submissions:', error)
      toast({
        title: "Error",
        description: "An error occurred while submitting your message. Please try again.",
        variant: "destructive",
      })
      return
    }

    // Here you would typically send the form data to your backend
    console.log({ category, message, email })
    toast({
      title: "Message Sent",
      description: "We've received your message and will get back to you soon.",
    })
    // Reset form
    setCategory('')
    setMessage('')
    setEmail('')
    setSubmissionCount(prev => prev + 1)
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Inquiry</SelectItem>
              <SelectItem value="support">Technical Support</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            placeholder="Type your message here"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="min-h-[100px] max-h-[250px]"
            rows={4}
          />
        </div>
        <div>
          <Label htmlFor="email">Your Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit">Send Message</Button>
      </form>
    </div>
  )
}
