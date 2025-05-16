'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Extend the auth User type with our database fields
type DatabaseUser = User & {
  display_name?: string
  photo?: string | null
  // Add any other fields from your users table here
}

type AuthContextType = {
  user: DatabaseUser | null
  session: Session | null
  signIn: (email: string) => Promise<any>
  verifyOTP: (email: string, otp: string) => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthProviderProps = {
  children: (authContext: AuthContextType) => React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<DatabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [cooldownActive, setCooldownActive] = useState(false)

  // Get the complete user data from the database
  const getCompleteUserData = async (authUser: User) => {
    try {
      // Fetch the user data from the 'users' table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single()

      if (error) {
        console.error('Error fetching user data:', error)
        return null
      }

      // If we found user data, merge it with the auth user
      if (data) {
        // Create a merged user object with both auth and database properties
        const completeUser: DatabaseUser = {
          ...authUser,
          // Add all database fields
          display_name: data.display_name,
          photo: data.photo,
          ...data
          // Add any other fields you have in your users table
        }
        return completeUser
      }
      
      return null
    } catch (error) {
      console.error('Unexpected error fetching user data:', error)
      return null
    }
  }

  const upsertUserInDatabase = async (session: Session) => {
    try {
      const authUser = session.user
      if (!authUser) throw new Error('No user found in session.')

      // Check if user exists
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking user existence:', error)
        throw error
      }

      // If user doesn't exist, create them
      if (!data) {
        const { error: insertError } = await supabase.from('users').insert({
          email: authUser.email,
          display_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Unknown User',
          photo: authUser.user_metadata?.avatar_url || null,
        })

        if (insertError) {
          console.error('Error inserting new user:', insertError)
          throw insertError
        }
      }

      // Fetch the complete user data
      const completeUser = await getCompleteUserData(authUser)
      
      // Update the user state with the complete data
      if (completeUser) {
        setUser(completeUser)
      } else {
        // Fallback to auth user if we couldn't get complete data
        console.warn('Could not fetch complete user data, using auth user as fallback')
        setUser(authUser as DatabaseUser)
      }
    } catch (error: any) {
      console.error('Unexpected error in upserting user:', error)
    }
  }

  useEffect(() => {
    const fetchInitialSession = async () => {
      const { data: initialSession } = await supabase.auth.getSession()
      setSession(initialSession.session)
      
      if (initialSession.session?.user) {
        await upsertUserInDatabase(initialSession.session)
      } else {
        setUser(null)
      }
    }

    fetchInitialSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        
        if (session?.user) {
          await upsertUserInDatabase(session)
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string) => {
    if (cooldownActive) {
      throw new Error('Please wait before requesting a new OTP.')
    }

    try {
      const { error, data } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })
      if (error) throw error

      setCooldownActive(true)
      setTimeout(() => setCooldownActive(false), 60000)

      return data
    } catch (error: any) {
      console.error('Sign In Error:', error)
      throw error
    }
  }

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      })

      if (error) {
        if (error.code === 'otp_expired') {
          console.error('OTP expired. The token is no longer valid.')
          throw new Error('The OTP has expired. Please request a new one.')
        } else {
          console.error('Verify OTP Error:', error)
          throw error
        }
      }

      return data
    } catch (error: any) {
      console.error('Unexpected OTP Verification Error:', error)
      throw new Error('OTP verification failed. Please try again.')
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
  }

  const value = {
    user,
    session,
    signIn,
    verifyOTP: (email: string, otp: string) => verifyOTP(email, otp),
    signOut,
  }

  return <AuthContext.Provider value={value}>{children(value)}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}