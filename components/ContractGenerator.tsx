"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { GetStartedModal } from "@/components/GetStartedModal"
// import generateMockContract from mock; now using AI-backed generation
import { MarkdownViewer } from "@/components/MarkdownViewer"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { supabase } from '@/lib/supabase'
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react" // Import Loader icon
import { Description } from "@radix-ui/react-toast"

type UserRole = "Freelancer" | "Buyer" | "Lawyer"
type KYCLevel = "FullyVerified" | "IdentityVerified" | "PrivateVerified" | "Anonymous"

// Task type definitions
type RefTask = {
  id: number;
  name: string;
  originator: string;
  task_owner: string;
  buyer_todo_label: string;
  buyer_done_label: string;
  seller_todo_label: string;
  seller_done_label: string;
  display_order: number;
  dependencies?: number[];
}

type TaskStatus = "todo" | "in_progress" | "done";

export function ContractGenerator() {
  const { user } = useAuth()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const step2Ref = useRef<HTMLDivElement>(null)
  const kycRef = useRef<HTMLDivElement>(null)
  const step3Ref = useRef<HTMLDivElement>(null)
  const contractRef = useRef<HTMLDivElement>(null)

  console.log({ user })

  // Save generated contract to Supabase and navigate to its detail page
  const handleSaveContract = async () => {
    // Set loading state
    setContractSaving(true)

    // Validation - ensure user is logged in
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to save a contract.', variant: 'destructive' })
      setContractSaving(false)
      return
    }

    // Retrieve the generated contract from localStorage
    const contractText = localStorage.getItem('generatedContract') || ''
    if (!contractText) {
      toast({ title: 'Error', description: 'No contract content found.', variant: 'destructive' })
      setContractSaving(false)
      return
    }

    // Prepare file content if needed
    let fileContent = ''
    if (activeTab === 'upload' && file) {
      try {
        fileContent = await readFileAsText(file)
      } catch (error) {
        console.error('Error reading file:', error)
        setContractSaving(false)
        return
      }
    }

    // Try to extract currency and amount information from input
    let nominalValue = 0
    let currencyCode = "USD"

    // Simple regex to find currency patterns like USD 1000 or $1000
    const currencyMatch = input.match(/([A-Z]{3}|[$€£¥])\s*(\d+(?:,\d+)*(?:\.\d+)?)/i)
    if (currencyMatch) {
      // Map currency symbols to codes if needed
      const symbolMap: Record<string, string> = {
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP',
        '¥': 'JPY'
      }

      // Set currency based on match
      currencyCode = currencyMatch[1].length === 1
        ? (symbolMap[currencyMatch[1]] || "USD")
        : currencyMatch[1].toUpperCase()

      // Parse numeric value, removing commas
      nominalValue = parseFloat(currencyMatch[2].replace(/,/g, ''))
    }

    // Prepare contract data mapping to table schema
    const contractPayload = {
      description: contractText.substring(0, 255), // Use the first part of contract as description
      dashboard_state: "draft", // Initial state
      owner: user.id, // Current user's ID
      nominal_value: nominalValue, // Extracted value or default
      currency: currencyCode, // Extracted currency or default
      stage: 1, // Initial stage
      // Store all metadata for reference
      metadata: {
        role,
        kycLevel,
        name,
        location,
        hasPartner,
        partnerName,
        input,
        fileContent,
        questions: questions.map(q => q.text),
        questionResponses,
        selectedTemplate,
      }
    }

    try {
      // Insert into Supabase
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .insert(contractPayload)
        .select('id')
        .single()

      if (contractError) {
        console.error('Contract save error:', contractError)
        let errorMessage = 'Unable to save contract.'

        // Handle specific database errors
        if (contractError.code === '23505') errorMessage = 'A contract with this UUID already exists.'
        if (contractError.code === '23503') errorMessage = 'Referenced data is missing.'

        throw new Error(errorMessage)
      }

      if (!contractData?.id) {
        throw new Error('Contract was saved but ID was not returned.')
      }

      // Generate task descriptions based on contract metadata
      const taskDescriptions = generateTasks({ hasPartner, partnerName })

      // Fetch reference tasks from the database
      const { data: refTasks, error: refTasksError } = await supabase
        .from('ref_tasks')
        .select('*')
        .order('display_order', { ascending: true })

      if (refTasksError) {
        console.error('Error fetching reference tasks:', refTasksError)
        throw new Error('Unable to load task templates.')
      }

      // Match generated task descriptions with reference tasks
      const matchedTasks = matchTasksWithRefTasks(taskDescriptions, refTasks)
      console.log({ matchedTasks })
      // Create task records for each matched task
      if (matchedTasks.length > 0) {
        const taskRecords = matchedTasks.map((match, index) => {
          // Determine the appropriate label based on the user's role
          let label = ''
          if (role === 'Freelancer') {
            label = match.refTask.seller_todo_label || match.refTask.name
          } else {
            label = match.refTask.buyer_todo_label || match.refTask.name
          }

          return {
            contract: contractData.id,
            ref_task_name: match.refTask.name,
            label: label,
            status: 'todo',
            created_at: new Date().toISOString(),
            // You may want to add additional metadata here
            display_order: match.refTask.display_order || index
          }
        })

        // Insert task records into the tasks table
        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(taskRecords)

        if (tasksError) {
          console.error('Error creating tasks:', tasksError)
          // Don't throw here, as we want to continue with the contract even if tasks fail
          toast({
            title: 'Warning',
            description: 'Contract saved, but there was an issue creating tasks.',
            variant: 'warning'
          })
        }
      }

      // Log success
      console.log('Contract saved successfully with ID:', contractData.id)

      // Show success message
      toast({ title: 'Success', description: 'Contract and tasks saved successfully!' })

      // Navigate to contract detail
      router.push(`/contracts/${contractData.id}`)
    } catch (error: any) {
      console.error('Save error:', error)
      toast({ title: 'Error', description: error.message || 'Unable to save contract.', variant: 'destructive' })
      setContractSaving(false)
    }
  }

  // Function to match generated task descriptions with reference tasks
  const matchTasksWithRefTasks = (taskDescriptions: string[], refTasks: RefTask[]) => {
    // Initialize array to store matched tasks
    const matchedTasks: { description: string, refTask: RefTask }[] = []

    // Create a simplified version of task descriptions and ref task names
    // for better matching (lowercase, no punctuation, etc.)
    const simplifyText = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '').trim()

    // Process each task description
    taskDescriptions.forEach(description => {
      const simplifiedDescription = simplifyText(description)

      // Try to find an exact match first
      let match = refTasks.find(refTask =>
        simplifyText(refTask.name) === simplifiedDescription
      )

      // If no exact match, try to find a partial match
      if (!match) {
        match = refTasks.find(refTask => {
          const simplifiedRefTaskName = simplifyText(refTask.name)
          return (
            simplifiedDescription.includes(simplifiedRefTaskName) ||
            simplifiedRefTaskName.includes(simplifiedDescription)
          )
        })
      }

      // If a match is found, add it to the matchedTasks array
      if (match) {
        matchedTasks.push({ description, refTask: match })
      } else {
        // For unmatched descriptions, try to create a default task
        const defaultTask = refTasks.find(refTask =>
          simplifyText(refTask.name) === 'default task' ||
          simplifyText(refTask.name) === 'custom task'
        )

        if (defaultTask) {
          matchedTasks.push({
            description,
            refTask: {
              ...defaultTask,
              name: description, // Use the description as the task name
              buyer_todo_label: description,
              seller_todo_label: description
            }
          })
        }
      }
    })

    if (matchedTasks.length === 0) {
      taskDescriptions.forEach(description => {
        const defaultTask = refTasks[0]
        matchedTasks.push({
          description,
          refTask: {
            ...defaultTask,
            name: defaultTask.name, // Use the description as the task name
            buyer_todo_label: description,
            seller_todo_label: description
          }
        })
      })
    }

    return matchedTasks
  }

  const [role, setRole] = useState<UserRole | null>(null)
  const [kycLevel, setKycLevel] = useState<KYCLevel | null>(null)
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState("")
  const [location, setLocation] = useState("")
  const [locationError, setLocationError] = useState("")
  const [hasPartner, setHasPartner] = useState<boolean | null>(null)
  const [partnerName, setPartnerName] = useState("")
  const [input, setInput] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [generatedContract, setGeneratedContract] = useState("")
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [ipAddress, setIpAddress] = useState("")
  const [generationAttempts, setGenerationAttempts] = useState(0)
  const [helperText, setHelperText] = useState("")
  const { toast } = useToast()

  // New loading states
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [contractGenerating, setContractGenerating] = useState(false)
  const [contractSaving, setContractSaving] = useState(false)
  const [ipFetching, setIpFetching] = useState(false)

  const [activeTab, setActiveTab] = useState("describe")
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [showQuestions, setShowQuestions] = useState(false)
  // Clarifying questions fetched from AI
  const [questions, setQuestions] = useState<{ text: string }[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questionResponses, setQuestionResponses] = useState<string[]>([])
  const [questionsCompleted, setQuestionsCompleted] = useState(false)
  const [questionsLocked, setQuestionsLocked] = useState(false)
  /**
   * Generate standardized onboarding and execution tasks based on contract metadata
   */
  const generateTasks = (meta: {
    hasPartner: boolean | null
    partnerName: string
  }) => {
    const tasks: string[] = []
    if (!meta.hasPartner) {
      tasks.push('Identify a partner')
      tasks.push('Send invitation to partner')
    } else {
      tasks.push('Invite counterparty to join and view contract')
    }
    const standard = [
      'Review and finalize contract',
      'Define and deploy escrow terms',
      'Deploy escrow smart contract',
      'Fund escrow',
      'Sign contract (both parties)',
      'Start delivering contracted services',
      'Review and approve milestones',
      'Release milestone payment',
      'Complete final review',
    ]
    return tasks.concat(standard)
  }

  const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const scrollTarget = window.pageYOffset + rect.bottom - window.innerHeight + 20 // 20px padding
      window.scrollTo({ top: scrollTarget, behavior: "smooth" })
    }
  }

  // Helper to read file content as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  // Fetch clarifying questions from AI based on user input or uploaded file
  const handleAnalyzeWithAI = async () => {
    setQuestionsLoading(true)
    setShowQuestions(false)
    setQuestions([])
    setQuestionResponses([])
    setQuestionsCompleted(false)
    setQuestionsLocked(false)
    setShowTemplateSelector(false)
    try {
      const payload: any = { input }
      if (activeTab === "upload" && file) {
        const content = await readFileAsText(file)
        payload.fileContent = content
      }
      const response = await fetch("/api/clarifying-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error("Failed to generate questions")
      const data = await response.json()
      // Remove boilerplate language from questions
      const qs: { text: string }[] = data.questions.map((q: string) => {
        // Strip out "Answer this question." or similar boilerplate text
        const cleanedQuestion = q.replace(/Answer this question\.\s*/gi, '')
          .replace(/Please answer\s*this question\.?\s*/gi, '')
          .replace(/Please provide an answer\.\s*/gi, '')
        return { text: cleanedQuestion }
      })
      setQuestions(qs)
      setQuestionResponses(Array(qs.length).fill(""))
      setShowQuestions(true)
      setCurrentQuestionIndex(0)
      setTimeout(() => scrollToBottom(step3Ref), 100)
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Unable to generate questions. Please try again.", variant: "destructive" })
    } finally {
      setQuestionsLoading(false)
    }
  }

  const handleGenerateContract = async () => {
    // enforce free-generation limit for anonymous users
    if (generationAttempts >= 3 && !user) {
      toast({
        title: "Limit Reached",
        description: "You have reached the free generation limit. Please log in to continue.",
        variant: "destructive",
      })
      return
    }
    setQuestionsLocked(true)
    setContractGenerating(true) // Set loading state to true

    // Prepare payload for contract generation API
    let fileContent = ''
    if (activeTab === 'upload' && file) {
      try {
        fileContent = await readFileAsText(file)
      } catch (e) {
        console.error('Error reading file:', e)
      }
    }
    const payload = {
      input,
      fileContent,
      questions,
      questionResponses,
      selectedTemplate,
    }
    try {
      const res = await fetch('/api/generate-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err)
      }
      const data = await res.json()
      const contractText = data.contract || ''
      setGeneratedContract(contractText)
      setCurrentStep(4)
      setGenerationAttempts((prev) => prev + 1)
      toast({ title: 'Contract Generated', description: 'Your contract has been generated. Sign in to edit and save it.' })
      localStorage.setItem('generatedContract', contractText)
      setTimeout(() => scrollToBottom(contractRef), 100)
    } catch (err: any) {
      console.error('Contract generation error:', err)
      toast({ title: 'Error', description: 'Unable to generate contract. Please try again.', variant: 'destructive' })
    } finally {
      setContractGenerating(false) // Set loading state to false when done
    }
  }

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)
    setKycLevel(null)
    setName("")
    setLocation("")
    setHasPartner(null)
    setPartnerName("")
    setInput("")
    setFile(null)
    setGeneratedContract("")
    setCurrentStep(1.5)
    setHelperText("")

    // Scroll to KYC question after role selection
    setTimeout(() => scrollToBottom(kycRef), 100)
  }

  const handleKycLevelSelect = (level: KYCLevel) => {
    setKycLevel(level)
    setCurrentStep(2)

    // Scroll to step 2 after KYC selection
    setTimeout(() => scrollToBottom(step2Ref), 100)
  }

  const getStepThreeHeading = () => {
    switch (role) {
      case "Freelancer":
        return "What services do you provide?"
      case "Lawyer":
        return "Describe Your Legal Services"
      case "Buyer":
        return "What project do you need help with?"
      default:
        return "Describe your project"
    }
  }

  const getStepThreeDescription = () => {
    switch (role) {
      case "Freelancer":
        return (
          <ul className="list-disc pl-5 space-y-2">
            <li>The specific services you offer</li>
            <li>The expected delivery timeline</li>
            <li>The price, or your pricing structure / rates</li>
            <li>Key deliverables clients can expect</li>
            <li>Any specific terms or conditions</li>
          </ul>
        )
      case "Buyer":
        return (
          <ul className="list-disc pl-5 space-y-2">
            <li>Project scope and objectives</li>
            <li>Expected timeline or deadlines</li>
            <li>Price, payment terms and/or budget range</li>
            <li>Required deliverables</li>
            <li>Specific skills or expertise needed</li>
            <li>Any special requirements or conditions</li>
          </ul>
        )
      case "Lawyer":
        return (
          <ul className="list-disc pl-5 space-y-2">
            <li>Your legal specialization areas</li>
            <li>Types of disputes you handle</li>
            <li>Typical resolution timeframes</li>
            <li>Fee structure</li>
            <li>Jurisdiction and certifications</li>
            <li>Dispute resolution approach</li>
          </ul>
        )
      default:
        return "Provide details about your project or services to help us generate an appropriate contract."
    }
  }

  const handlePartnerSelection = (hasPartner: boolean) => {
    setHasPartner(hasPartner)
    if (!hasPartner) {
      setCurrentStep(3)
      // Scroll to step 3 after partner selection
      setTimeout(() => scrollToBottom(step3Ref), 100)
    }
    setHelperText("")
  }

  const handleContinueToServices = () => {
    setCurrentStep(3)
    // Scroll to step 3 after entering partner name
    setTimeout(() => scrollToBottom(step3Ref), 100)
  }

  useEffect(() => {
    if (currentStep < 4) {
      setGeneratedContract("")
    }
  }, [currentStep])

  useEffect(() => {
    setIpFetching(true) // Start loading
    fetch("https://api.ipify.org?format=json")
      .then((response) => response.json())
      .then((data) => setIpAddress(data.ip))
      .catch((error) => console.error("Error fetching IP:", error))
      .finally(() => setIpFetching(false)) // End loading
  }, [])

  useEffect(() => {
    if (role === "Lawyer" && name.length >= 5 && location.length >= 3) {
      setCurrentStep(3)
      setHelperText("")
      // Scroll to step 3 for lawyer
      setTimeout(() => scrollToBottom(step3Ref), 100)
    }
  }, [role, name, location])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (currentStep >= 2) {
      timer = setTimeout(() => {
        switch (currentStep) {
          case 2:
            if (name.length < 5) setHelperText("Enter a name with minimum 5 characters")
            break
          case 3:
            if (!input) setHelperText("Please provide details about your project or services")
            break
          default:
            setHelperText("")
        }
      }, 10000)
    }

    return () => clearTimeout(timer)
  }, [currentStep, name, input])

  useEffect(() => {
    if (containerRef.current && currentStep === 4) {
      scrollToBottom(contractRef)
    }
  }, [currentStep])

  const wigglingPen = {
    animate: {
      rotate: [0, 5, -5, 5, 0],
      transition: { duration: 0.5, repeat: Number.POSITIVE_INFINITY },
    },
  }

  const getRoleDisplayName = (roleType: UserRole) => {
    switch (roleType) {
      case "Freelancer":
        return "Service Provider / Freelancer"
      case "Buyer":
        return "Client / Buyer / Project Manager"
      case "Lawyer":
        return "Lawyer / Arbitrator / Adjudicator"
      default:
        return ""
    }
  }

  const getRoleDescription = (roleType: UserRole) => {
    switch (roleType) {
      case "Freelancer":
        return "I provide services or freelance work to clients"
      case "Buyer":
        return "I need to hire someone for a project or service"
      case "Lawyer":
        return "I am a lawyer and provide arbitration services"
      default:
        return ""
    }
  }

  const getKycDisplayName = (level: KYCLevel) => {
    switch (level) {
      case "FullyVerified":
        return "Fully verified, both identity and proof of address"
      case "IdentityVerified":
        return "Verified identity, including sharing of Name and verified photo"
      case "PrivateVerified":
        return "Verified identity, but without sharing any details (unless police reports are filed)"
      case "Anonymous":
        return "Anonymous contract, no identity verification"
      default:
        return ""
    }
  }

  // Loading spinner component for reuse
  const LoadingSpinner = () => (
    <Loader2 className="h-4 w-4 animate-spin mr-2" />
  )

  return (
    <div
      ref={containerRef}
      className="bg-gradient-to-br from-gray-100 to-purple-100 dark:from-gray-800 dark:to-purple-900 p-8 rounded-lg overflow-y-auto"
    >
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Create Your Smart Contract</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-300">
        Create professional contracts tailored to your specific needs. Our AI-powered system will guide you through the
        process and ensure your contract includes all necessary elements and is ready for escrow.
      </p>

      <div className={`mb-8 ${currentStep > 1 ? "opacity-50" : ""}`}>
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">What's your role?</h3>
        {role ? (
          // Display selected role without dropdown
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-purple-500">
            <div className="font-bold text-lg text-black dark:text-white">{getRoleDisplayName(role)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{getRoleDescription(role)}</div>
          </div>
        ) : (
          // Role selection buttons
          <div className="space-y-4">
            {["Freelancer", "Buyer", "Lawyer"].map((buttonRole) => (
              <Button
                key={buttonRole}
                onClick={() => handleRoleChange(buttonRole as UserRole)}
                className="w-full h-auto py-4 px-6 justify-start text-left bg-white dark:bg-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div>
                  <div className="font-bold text-lg">
                    {buttonRole === "Freelancer" && "Service Provider / Freelancer"}
                    {buttonRole === "Buyer" && "Client / Buyer / Project Manager"}
                    {buttonRole === "Lawyer" && "Lawyer / Arbitrator / Adjudicator"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {buttonRole === "Freelancer" && "I provide services or freelance work to clients"}
                    {buttonRole === "Buyer" && "I need to hire someone for a project or service"}
                    {buttonRole === "Lawyer" && "I am a lawyer and provide arbitration services"}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>

      {role && currentStep >= 1.5 && (
        <div ref={kycRef} className={`mb-8 ${currentStep > 1.5 ? "opacity-50" : ""}`}>
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Will this be an anonymous or KYC?</h3>
          <p className="mb-4 text-gray-600 dark:text-gray-300">We can help with verification of ID.</p>

          {currentStep > 1.5 ? (
            // Display selected KYC level when step is completed
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-purple-500">
              <div className="font-bold text-xs text-black dark:text-white">{kycLevel && getKycDisplayName(kycLevel)}</div>
            </div>
          ) : (
            // KYC selection buttons
            <div className="space-y-4">
              {["FullyVerified", "IdentityVerified", "PrivateVerified"].map((level) => (
                <Button
                  key={level}
                  onClick={() => handleKycLevelSelect(level as KYCLevel)}
                  className="w-full h-auto py-4 px-6 justify-start text-left bg-white dark:bg-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className=" text-xs">{getKycDisplayName(level as KYCLevel)}</div>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {role && kycLevel && currentStep >= 2 && (
        <div ref={step2Ref} className={`mb-8 ${currentStep > 2 ? "opacity-50" : ""} relative z-10`}>
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Great! And who are you?</h3>
          <p className="mb-4 text-gray-600 dark:text-gray-300">We'll add your name into the contract.</p>

          {currentStep > 2 ? (
            // Display name as text when step is completed
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Your name</p>
              <p className="text-lg text-gray-800 dark:text-white">{name}</p>
            </div>
          ) : (
            // Editable input when on this step
            <Input
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (e.target.value.length >= 5) {
                  setNameError("")
                  setHelperText("")
                }
              }}
              className="mb-4 h-auto py-4 px-6 text-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          )}

          {nameError && <p className="text-red-500 mb-2">{nameError}</p>}

          {name.length >= 5 && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Where are you located?</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-300">We will use this to determine the applicable law.</p>

              {currentStep > 2 ? (
                // Display location as text when step is completed
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your location</p>
                  <p className="text-lg text-gray-800 dark:text-white">{location}</p>
                </div>
              ) : (
                // Editable input when on this step
                <Input
                  placeholder="Enter a state, province, territory or city"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value)
                    if (e.target.value.length >= 3) {
                      setLocationError("")
                      setHelperText("")
                    }
                  }}
                  className="mb-4 h-auto py-4 px-6 text-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              )}

              {locationError && <p className="text-red-500 mb-2">{locationError}</p>}
              {helperText && location.length < 3 && (
                <p className="text-purple-600 dark:text-purple-400 mt-2">{helperText}</p>
              )}
            </div>
          )}

          {role !== "Lawyer" && name.length >= 5 && location.length >= 3 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
                {role === "Buyer" ? "Do you have a Freelancer selected?" : "Do you have a buyer already?"}
              </h4>

              {currentStep > 2 ? (
                // Display partner selection as text when step is completed
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {hasPartner ? "Partner status" : "No partner selected"}
                  </p>
                  <p className="text-lg text-gray-800 dark:text-white">
                    {hasPartner
                      ? `${role === "Buyer" ? "Freelancer" : "Buyer"}: ${partnerName}`
                      : "No partner selected yet"}
                  </p>
                </div>
              ) : (
                // Editable selection when on this step
                <>
                  <div className="space-y-4">
                    <Button
                      onClick={() => handlePartnerSelection(true)}
                      className={`w-full h-auto py-4 px-6 justify-start text-left bg-white dark:bg-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 ${hasPartner === true ? "ring-2 ring-purple-500" : ""}`}
                    >
                      Yes, I have someone in mind
                    </Button>
                    {/* Only show "No, not yet" when hasPartner is not true */}
                    {hasPartner !== true && (
                      <Button
                        onClick={() => handlePartnerSelection(false)}
                        className={`w-full h-auto py-4 px-6 justify-start text-left bg-white dark:bg-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 ${hasPartner === false ? "ring-2 ring-purple-500" : ""}`}
                      >
                        No, not yet
                      </Button>
                    )}
                  </div>
                  {hasPartner === null && helperText && (
                    <p className="text-purple-600 dark:text-purple-400 mt-2">Make a selection</p>
                  )}
                  {hasPartner === true && (
                    <div className="mt-4">
                      <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
                        {role === "Buyer" ? "Enter the Freelancer's name:" : "Enter the Buyer's name:"}
                      </h4>
                      <Input
                        placeholder={`Enter ${role === "Buyer" ? "freelancer" : "buyer"}'s full name`}
                        value={partnerName}
                        onChange={(e) => {
                          setPartnerName(e.target.value)
                        }}
                        className="mb-4 h-auto py-4 px-6 text-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      />
                      {partnerName.length < 5 && (
                        <p className="text-purple-600 dark:text-purple-400 mt-2">
                          Please enter your {role === "Buyer" ? "freelancer" : "buyer"}'s name (minimum 5 characters)
                        </p>
                      )}
                      {partnerName.length >= 5 && (
                        <Button onClick={handleContinueToServices} className="mt-2">
                          Continue to Services
                        </Button>
                      )}
                    </div>
                  )}
                  {hasPartner === false && (
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      That's okay! We'll help you add a partner and update the contract accordingly later.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {helperText && name.length < 5 && <p className="text-purple-600 dark:text-purple-400 mt-2">{helperText}</p>}
        </div>
      )}

      {((role === "Lawyer" && name.length >= 5 && location.length >= 3) ||
        (role !== "Lawyer" &&
          ((hasPartner === false && name.length >= 5 && location.length >= 3) ||
            (currentStep >= 3 && hasPartner && partnerName.length >= 5)))) &&
        currentStep >= 3 && (
          <div ref={step3Ref} className={`mb-8 ${currentStep > 3 ? "opacity-50" : ""}`}>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{getStepThreeHeading()}</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-300">Please provide details about:</p>

            {role !== "Lawyer" && (
              <div className="mb-4">
                <div className="flex border-b border-gray-200">
                  <button
                    className={`py-2 px-4 font-medium ${activeTab === "describe" ? "border-b-2 border-purple-500 text-purple-600" : "text-gray-500"}`}
                    onClick={() => !generatedContract && setActiveTab("describe")}
                    disabled={!!generatedContract}
                  >
                    Describe The Project
                  </button>
                  <button
                    className={`py-2 px-4 font-medium ${activeTab === "upload" ? "border-b-2 border-purple-500 text-purple-600" : "text-gray-500"}`}
                    onClick={() => !generatedContract && setActiveTab("upload")}
                    disabled={!!generatedContract}
                  >
                    Upload Project Files
                  </button>
                </div>
              </div>
            )}

            {activeTab === "describe" && (
              <>
                {getStepThreeDescription()}

                {currentStep > 3 ? (
                  // Display description as text when step is completed
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg mb-4 mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Project description</p>
                    <p className="text-gray-800 dark:text-white whitespace-pre-line">{input}</p>
                  </div>
                ) : (
                  // Editable textarea when on this step
                  <Textarea
                    placeholder="Type your description here..."
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      setHelperText("")
                    }}
                    className="mb-4 mt-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    rows={10}
                  />
                )}

                {helperText && <p className="text-purple-600 dark:text-purple-400 mb-4">{helperText}</p>}

                {!showQuestions && !generatedContract && role !== "Lawyer" && (
                  <div className="flex space-x-4 mt-4">
                    <Button
                      onClick={handleAnalyzeWithAI}
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={questionsLoading}
                    >
                      {questionsLoading ? (
                        <><LoadingSpinner /> Generating Questions...</>
                      ) : (
                        <><span className="mr-2">🤖</span> Generate with AI</>
                      )}
                    </Button>
                    <Button onClick={() => setShowTemplateSelector(true)} variant="outline" disabled={questionsLoading}>
                      <span className="mr-2">📄</span> Use Template (No AI)
                    </Button>
                  </div>
                )}

                {role === "Lawyer" && !generatedContract && (
                  <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <h4 className="font-medium mb-3">Join SmarTrust as a Legal Professional</h4>
                    <p className="mb-4 text-gray-600 dark:text-gray-300">
                      Thank you for your interest in joining SmarTrust as a legal professional. After signing up, our
                      team will review your application and qualifications. Once approved, you'll be available to
                      parties who need dispute resolution services.
                    </p>
                    <Button
                      onClick={() => setIsGetStartedOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700 w-full"
                    >
                      Sign up to SmarTrust
                    </Button>
                  </div>
                )}

                {showTemplateSelector && !generatedContract && role !== "Lawyer" && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <h4 className="font-medium mb-3">Select a Contract Template</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {["Website Design", "Creative Design", "Catering", "Event Production", "Other"].map(
                        (template) => (
                          <Button
                            key={template}
                            variant="outline"
                            className="justify-start"
                            onClick={() => {
                              setSelectedTemplate(template)
                              setShowTemplateSelector(false)
                              handleGenerateContract()
                            }}
                            disabled={contractGenerating}
                          >
                            {template}
                          </Button>
                        ),
                      )}
                    </div>
                    <Button
                      className="mt-3"
                      variant="ghost"
                      onClick={() => setShowTemplateSelector(false)}
                      disabled={contractGenerating}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </>
            )}

            {activeTab === "upload" && (
              <>
                <p className="mb-4">
                  Upload your existing contract or project files to help us generate a tailored contract.
                </p>

                {currentStep > 3 ? (
                  // Display file info as text when step is completed
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Uploaded file</p>
                    <p className="text-gray-800 dark:text-white">{file ? file.name : "No file uploaded"}</p>
                  </div>
                ) : (
                  // Editable file input when on this step
                  <Input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="mb-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    disabled={!!generatedContract || questionsLoading || contractGenerating}
                  />
                )}

                {helperText && <p className="text-purple-600 dark:text-purple-400 mb-4">{helperText}</p>}

                {!showQuestions && !generatedContract && (
                  <div className="flex space-x-4 mt-4">
                    <Button
                      onClick={handleAnalyzeWithAI}
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={questionsLoading || contractGenerating}
                    >
                      {questionsLoading ? (
                        <><LoadingSpinner /> Analyzing with AI...</>
                      ) : (
                        <><span className="mr-2">🤖</span> Analyze with AI</>
                      )}
                    </Button>
                    <Button
                      onClick={handleGenerateContract}
                      variant="outline"
                      disabled={questionsLoading || contractGenerating}
                    >
                      {contractGenerating ? (
                        <><LoadingSpinner /> Generating...</>
                      ) : (
                        <><span className="mr-2">📄</span> Use As-Is (No AI)</>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}

            {showQuestions && role !== "Lawyer" && (
              <div className="mt-6 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <h4 className="font-medium mb-4">Please answer all questions below:</h4>

                {!questionsLocked ? (
                  <>
                    {questions.map((question, index) => (
                      <div key={index} className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                        <p className="font-medium mb-2">{question.text}</p>
                        <Textarea
                          value={questionResponses[index] || ""}
                          onChange={(e) => {
                            const newResponses = [...questionResponses];
                            newResponses[index] = e.target.value;
                            setQuestionResponses(newResponses);
                          }}
                          className="mb-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                          rows={3}
                          disabled={questionsLocked || contractGenerating}
                          placeholder="Your answer..."
                        />
                      </div>
                    ))}

                    {/* <Button
                      onClick={() => setQuestionsCompleted(true)}
                      disabled={questionResponses.length < questions.length || questionResponses.some(response => !response?.trim())}
                      className="w-full"
                    >
                      Complete
                    </Button> */}

                    <div className="text-sm text-gray-500 mt-2">
                      {questionResponses.filter(r => r?.trim()).length} of {questions.length} questions answered
                    </div>
                  </>
                ) : (
                  <>
                    {questions.map((question, index) => (
                      <div key={index} className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                        <p className="font-medium mb-2">{question.text}</p>
                        <div className="p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                          <p className="text-gray-800 dark:text-gray-200">
                            {questionResponses[index] || "Not yet answered"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {showQuestions && !generatedContract && role !== "Lawyer" && (
              <Button
                onClick={handleGenerateContract}
                className="mt-4 w-full"
                disabled={
                  contractGenerating ||
                  questionResponses.length < questions.length ||
                  questionResponses.some((response) => !response?.trim())
                }
              >
                {contractGenerating ? (
                  <><LoadingSpinner /> Generating Contract...</>
                ) : (
                  'Generate Contract'
                )}
              </Button>
            )}
          </div>
        )}

      {generatedContract && (
        <div ref={contractRef} className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            Step 4: Review your generated contract
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Here's a preview of your generated contract. Sign in to edit and save it.
          </p>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <MarkdownViewer content={generatedContract} />
          </div>
          {/* Dynamic task generation based on contract answers */}
          {user && (
            <div className="mt-4 mb-4">
              <h4 className="font-medium mb-2">Next Steps</h4>
              <ul className="list-disc pl-5 space-y-2">
                {generateTasks({ hasPartner, partnerName }).map((task, idx) => (
                  <li key={idx}>{task}</li>
                ))}
              </ul>
            </div>
          )}
          <Button
            onClick={user ? handleSaveContract : () => setIsGetStartedOpen(true)}
            className="mt-4"
            disabled={contractSaving}
          >
            {user ? (
              contractSaving ? (
                <><LoadingSpinner /> Saving Contract...</>
              ) : (
                "Save Contract"
              )
            ) : (
              "Sign In to Edit"
            )}
          </Button>
        </div>
      )}

      <GetStartedModal isOpen={isGetStartedOpen} onClose={() => setIsGetStartedOpen(false)} />
    </div>
  )
}