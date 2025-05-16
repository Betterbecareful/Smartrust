"use client"

import { useEffect, useState } from "react"
import { ContractCard, type ContractStatus } from "@/components/ContractCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useRole } from "@/contexts/RoleContext"
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Plus,
  RotateCcw,
  Search,
  UserPlus,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Contract = {
  id: number
  name: string
  category: string
  status: ContractStatus
  role: "provider" | "buyer"
  counterpartyName: string
  actionRequired: boolean
  description?: string
  created_at?: string
  dashboard_state?: string
  owner?: number
  uuid?: string
  nominal_value?: number
  currency?: string
}

export default function ContractsDashboard() {
  const { role } = useRole()
  const router = useRouter()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("both")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [actionRequiredOnly, setActionRequiredOnly] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("contracts").select("*,owner:users(*)")
      if (error) {
        console.error("Error fetching contracts:", error)
      } else {
        setContracts(data as Contract[])
      }
    })()
  }, [])


  const filteredContracts = contracts
    .filter((contract) => {
      const matchesSearch = true
      const matchesStatus =
        statusFilter === "all" || contract.status === statusFilter

      const matchesRole =
        roleFilter === "both" ||
        (roleFilter === "provide" && contract.role === "provider") ||
        (roleFilter === "buy" && contract.role === "buyer")

      const matchesActionRequired =
        !actionRequiredOnly || contract.actionRequired

      if (activeTab === "action_required") {
        return matchesSearch && matchesStatus && matchesRole && contract.actionRequired
      } else if (activeTab === "my_contracts") {
        return matchesSearch && matchesStatus && matchesRole
      } else {
        return matchesSearch && matchesStatus && matchesRole && matchesActionRequired
      }
    })
  
  const handleCreateContract = () => {
    router.push("/contracts/new")
  }
  
  console.log({ contracts, filteredContracts })


  const resetFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setRoleFilter("both")
    setSortDirection("asc")
    setActionRequiredOnly(false)
  }

  console.log({ filteredContracts })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Contracts Dashboard</h1>
        <Button onClick={handleCreateContract}>
          <Plus className="mr-2 h-4 w-4" /> Create Contract
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contracts..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">All Roles</SelectItem>
              <SelectItem value="provide">I Provide</SelectItem>
              <SelectItem value="buy">I Buy</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_signature">Pending Signature</SelectItem>
              <SelectItem value="pending_funding">Pending Funding</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
            className="w-10 h-10"
          >
            {sortDirection === "asc" ? (
              <ArrowDownAZ className="h-4 w-4" />
            ) : (
              <ArrowUpAZ className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant={actionRequiredOnly ? "default" : "outline"}
            onClick={() => setActionRequiredOnly(!actionRequiredOnly)}
            className="whitespace-nowrap"
          >
            Action Required Only
          </Button>

          <Button variant="outline" onClick={resetFilters} className="ml-auto">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Filters
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Contracts</TabsTrigger>
          <TabsTrigger value="action_required">Action Required</TabsTrigger>
          <TabsTrigger value="my_contracts">
            {role === "Freelancer" ? "My Services" : "My Projects"}
          </TabsTrigger>
        </TabsList>
        {[
          "all",
          "action_required",
          "my_contracts"
        ].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {filteredContracts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContracts.map((contract) => (
                  <>
                    {console.log({ contract })}
                    <ContractCard key={contract.id} {...contract} />
                  </>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {tab === "action_required"
                    ? "No contracts requiring action."
                    : tab === "my_contracts"
                      ? role === "Freelancer"
                        ? "You don't have any active services."
                        : "You don't have any active projects."
                      : "No contracts found matching your criteria."}
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
