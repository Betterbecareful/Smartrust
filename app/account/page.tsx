"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Camera, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import dynamic from "next/dynamic"
import axios from 'axios';

const CubidWidget = dynamic(
  () => import('cubid-sdk').then((mod) => mod.CubidWidget),
  { ssr: false }
);

const AVATAR_OPTIONS = [
  { id: "avatar1", url: "/avatars/avatar1.png" },
  { id: "avatar2", url: "/avatars/avatar2.png" },
  { id: "avatar3", url: "/avatars/avatar3.png" },
  { id: "avatar4", url: "/avatars/avatar4.png" },
  { id: "avatar5", url: "/avatars/avatar5.png" },
  { id: "avatar6", url: "/avatars/avatar6.png" },
]

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "zh", label: "Chinese" },
]

const CURRENCIES = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
]

const COUNTRIES = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "uk", label: "United Kingdom" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "jp", label: "Japan" },
]

export default function Account() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    language: "en",
    currency: "USD",
    avatarUrl: "",
  })

  const [addressPredictions, setAddressPredictions] = useState<string[]>([])

  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = () => {
      setAddressPredictions([])
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])

  const fetchAddressPredictions = async (input: string) => {
    if (!input || input.length < 3) return

    try {
      // In a real implementation, this would call the Google Places API
      // For this demo, we'll use a mock implementation
      const mockPredictions = [
        `${input}, 123 Main St, New York, NY`,
        `${input}, 456 Broadway, New York, NY`,
        `${input}, 789 Park Ave, New York, NY`,
        `${input} Plaza, Chicago, IL`,
        `${input} Avenue, Los Angeles, CA`,
      ]

      setAddressPredictions(mockPredictions)

      // Uncomment and modify this for real Google Places API implementation
      /*
      const response = await fetch(`/api/address-suggestions?input=${encodeURIComponent(input)}`);
      const data = await response.json();
      setAddressPredictions(data.predictions.map((p: any) => p.description));
      */
    } catch (error) {
      console.error("Error fetching address predictions:", error)
      setAddressPredictions([])
    }
  }

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("email", user?.email).single()

      if (error) throw error
      const { data: created_user_data } = await axios.post(
        "https://passport.cubid.me/api/dapp/create_user",
        {
          dapp_id: 56,
          email:data.email,
          stamptype: "email",
        }
      );
      if (data) {
        setProfileData({
          ...data,
          displayName: data.display_name || "",
          email: data.email || user?.email || "",
          phone: data.phone || "",
          address: data.address || "",
          country: data.country || "",
          language: data.language || "en",
          currency: data.currency || "USD",
          avatarUrl: data.photo || "",
          cubid_data:created_user_data
        })
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size should be less than 5MB",
        variant: "destructive",
      })
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Generate a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage.from("avatars").upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName)

      // Update profile with new avatar URL
      setProfileData((prev) => ({ ...prev, avatarUrl: urlData.publicUrl }))

      toast({
        title: "Success",
        description: "Profile picture uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setShowAvatarSelector(false)
    }
  }

  const selectAvatar = (url: string) => {
    setProfileData((prev) => ({ ...prev, avatarUrl: url }))
    setShowAvatarSelector(false)
  }

  const saveProfile = async () => {
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          display_name: profileData.displayName,
          phone: profileData.phone,
          address: profileData.address,
          country: profileData.country,
          language: profileData.language,
          currency: profileData.currency,
          photo: profileData.avatarUrl,
        })
        .eq("email", user?.email)

      if (error) throw error

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const chaincrewapikey = 'ded6fd77-4809-44fa-8da4-bfc09f944bac';


  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileData.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback>{profileData.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                aria-label="Edit profile picture"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            {showAvatarSelector && (
              <div className="mb-4 p-4 border rounded-lg w-full">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Edit Profile Picture</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAvatarSelector(false)}
                    className="h-8 w-8 p-0"
                  >
                    ✕
                  </Button>
                </div>
                <div className="mb-4">
                  <Label htmlFor="avatar-upload" className="block mb-2">
                    Upload a photo
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <div className="flex items-center mt-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Uploading...</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="block mb-2">Or choose an avatar</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {AVATAR_OPTIONS.map((avatar) => (
                      <Avatar
                        key={avatar.id}
                        className="h-16 w-16 cursor-pointer hover:ring-2 hover:ring-purple-500"
                        onClick={() => selectAvatar(avatar.url)}
                      >
                        <AvatarImage src={avatar.url || "/placeholder.svg"} />
                        <AvatarFallback>A</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Stamps</CardTitle>
          </CardHeader>
          <CardContent>
            <CubidWidget stampToRender="phone" uuid={profileData?.cubid_data?.uuid} page_id={'20'} api_key={chaincrewapikey} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Full Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  value={profileData.displayName}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  disabled
                  placeholder="Your email address"
                />
                <p className="text-xs text-muted-foreground">Contact support to change your email</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  placeholder="Your phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={profileData.country} onValueChange={(value) => handleSelectChange("country", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <Input
                    id="address"
                    name="address"
                    value={profileData.address}
                    onChange={(e) => {
                      setProfileData((prev) => ({ ...prev, address: e.target.value }))
                      // Fetch address predictions when user types
                      if (e.target.value.length > 3) {
                        fetchAddressPredictions(e.target.value)
                      }
                    }}
                    placeholder="Start typing your address"
                    className="w-full"
                    autoComplete="off"
                  />
                  {addressPredictions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                      {addressPredictions.map((prediction, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                            setProfileData((prev) => ({ ...prev, address: prediction }))
                            setAddressPredictions([])
                          }}
                        >
                          {prediction}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={saveProfile} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={profileData.language} onValueChange={(value) => handleSelectChange("language", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((language) => (
                      <SelectItem key={language.value} value={language.value}>
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={profileData.currency} onValueChange={(value) => handleSelectChange("currency", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={saveProfile} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account by enabling two-factor authentication.
              </p>
              <Button variant="outline">Enable 2FA</Button>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <h3 className="text-lg font-medium">Connected Devices</h3>
              <p className="text-sm text-muted-foreground">
                Manage devices that are currently signed in to your account.
              </p>
              <Button variant="outline">Manage Devices</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
