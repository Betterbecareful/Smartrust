"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import type { ContractStatus } from "@/components/ContractCard"

// Mock data for contracts - same as in ContractDetailsPage
const mockContracts = [
  {
    id: "contract-1",
    name: "Website Redesign",
    category: "Web Development",
    status: "active" as ContractStatus,
    totalValue: 5000,
    currency: "USD",
    actionRequired: true,
    dueDate: "2023-12-15",
    counterpartyName: "Acme Corp",
    description: "Complete redesign of company website with new branding and improved UX.",
    escrowBalance: 5000,
    milestones: [
      { id: "m1", name: "Design Approval", amount: 1500, status: "completed", dueDate: "2023-10-15" },
      { id: "m2", name: "Frontend Development", amount: 2000, status: "in_progress", dueDate: "2023-11-15" },
      { id: "m3", name: "Backend Integration", amount: 1500, status: "pending", dueDate: "2023-12-15" },
    ],
  },
  {
    id: "contract-2",
    name: "Logo Design",
    category: "Graphic Design",
    status: "pending_signature" as ContractStatus,
    totalValue: 800,
    currency: "USD",
    actionRequired: true,
    counterpartyName: "StartUp Inc",
    description: "Design of new company logo and brand identity package.",
    escrowBalance: 0,
    milestones: [
      { id: "m1", name: "Initial Concepts", amount: 300, status: "pending", dueDate: "2023-11-01" },
      { id: "m2", name: "Final Design", amount: 500, status: "pending", dueDate: "2023-11-15" },
    ],
  },
  {
    id: "contract-5",
    name: "SEO Optimization",
    category: "Digital Marketing",
    status: "draft" as ContractStatus,
    totalValue: 3000,
    currency: "USD",
    actionRequired: true,
    counterpartyName: "Digital Growth Agency",
    description: "Comprehensive SEO audit and implementation of optimization strategies.",
    escrowBalance: 0,
    milestones: [
      { id: "m1", name: "SEO Audit", amount: 800, status: "pending", dueDate: "2023-11-30" },
      { id: "m2", name: "On-Page Optimization", amount: 1200, status: "pending", dueDate: "2023-12-15" },
      { id: "m3", name: "Content Strategy", amount: 1000, status: "pending", dueDate: "2023-12-31" },
    ],
  },
]

const CATEGORIES = [
  "Web Development",
  "Graphic Design",
  "Content Creation",
  "Digital Marketing",
  "App Development",
  "Multimedia",
  "Consulting",
  "Other",
]

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"]

export default function EditContractPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  // Find the contract by ID from the mock data
  const contractData = mockContracts.find((c) => c.id === params.id)

  const initialContractState = contractData
    ? {
        name: contractData.name,
        category: contractData.category,
        description: contractData.description,
        totalValue: contractData.totalValue.toString(),
        currency: contractData.currency,
        dueDate: contractData.dueDate || "",
        counterpartyName: contractData.counterpartyName,
      }
    : {
        name: "",
        category: "",
        description: "",
        totalValue: "",
        currency: "",
        dueDate: "",
        counterpartyName: "",
      }

  const [contract, setContract] = useState(initialContractState)

  if (!contractData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Contract Not Found</h2>
        <p className="text-muted-foreground mb-6">The contract you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    )
  }

  // Check if contract can be edited
  if (!["draft", "pending_signature"].includes(contractData.status)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Cannot Edit Contract</h2>
        <p className="text-muted-foreground mb-6">
          This contract cannot be edited because it has already been signed or funded.
        </p>
        <Button asChild>
          <Link href={`/contracts/${contractData.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contract Details
          </Link>
        </Button>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContract((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setContract((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    // In a real app, you would save the changes to the database
    toast({
      title: "Contract Updated",
      description: "Your changes have been saved successfully.",
    })
    router.push(`/contracts/${contractData.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/contracts/${contractData.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Contract</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
          <CardDescription>Update the contract information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Contract Name</Label>
              <Input
                id="name"
                name="name"
                value={contract.name}
                onChange={handleInputChange}
                placeholder="Enter contract name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={contract.category} onValueChange={(value) => handleSelectChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="counterpartyName">Counterparty Name</Label>
              <Input
                id="counterpartyName"
                name="counterpartyName"
                value={contract.counterpartyName}
                onChange={handleInputChange}
                placeholder="Enter counterparty name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={contract.dueDate}
                onChange={handleInputChange}
                placeholder="Select due date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalValue">Total Value</Label>
              <Input
                id="totalValue"
                name="totalValue"
                type="number"
                value={contract.totalValue}
                onChange={handleInputChange}
                placeholder="Enter total value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={contract.currency} onValueChange={(value) => handleSelectChange("currency", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={contract.description}
                onChange={handleInputChange}
                placeholder="Enter contract description"
                rows={5}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/contracts/${contractData.id}`}>Cancel</Link>
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
