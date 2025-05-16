"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowDownAZ, ArrowUpAZ, RotateCcw, Search } from "lucide-react"
import { useRole } from "@/contexts/RoleContext"

// Mock data for contract vaults
const mockContractVaults = [
  {
    id: "vault-1",
    contractId: "contract-1",
    contractName: "Website Redesign",
    counterpartyName: "Acme Corp",
    funded: 5000,
    released: 1500,
    balance: 3500,
    currency: "USD",
    status: "active",
  },
  {
    id: "vault-2",
    contractId: "contract-3",
    contractName: "Mobile App Development",
    counterpartyName: "Tech Solutions Ltd",
    funded: 6000,
    released: 0,
    balance: 6000,
    currency: "USD",
    status: "active",
  },
  {
    id: "vault-3",
    contractId: "contract-6",
    contractName: "Video Production",
    counterpartyName: "Creative Visuals",
    funded: 3750,
    released: 1500,
    balance: 2250,
    currency: "USD",
    status: "disputed",
  },
  {
    id: "vault-4",
    contractId: "contract-7",
    contractName: "Translation Services",
    counterpartyName: "Global Linguists",
    funded: 2000,
    released: 2000,
    balance: 0,
    currency: "EUR",
    status: "completed",
  },
  {
    id: "vault-5",
    contractId: "contract-8",
    contractName: "Marketing Campaign",
    counterpartyName: "Brand Boosters",
    funded: 8000,
    released: 4000,
    balance: 4000,
    currency: "GBP",
    status: "active",
  },
]

// Mock data for transactions
const mockTransactions = [
  {
    id: "tx-1",
    vaultId: "vault-1",
    date: "2023-10-01T10:30:00Z",
    description: "Initial funding",
    debit: 5000,
    credit: 0,
    currency: "USD",
  },
  {
    id: "tx-2",
    vaultId: "vault-1",
    date: "2023-10-15T14:45:00Z",
    description: "Milestone: Design Approval",
    debit: 0,
    credit: 1500,
    currency: "USD",
  },
  {
    id: "tx-3",
    vaultId: "vault-2",
    date: "2023-10-05T09:15:00Z",
    description: "Initial funding",
    debit: 6000,
    credit: 0,
    currency: "USD",
  },
  {
    id: "tx-4",
    vaultId: "vault-3",
    date: "2023-09-20T11:00:00Z",
    description: "Initial funding",
    debit: 3750,
    credit: 0,
    currency: "USD",
  },
  {
    id: "tx-5",
    vaultId: "vault-3",
    date: "2023-10-01T16:30:00Z",
    description: "Milestone: Script & Storyboard",
    debit: 0,
    credit: 1500,
    currency: "USD",
  },
  {
    id: "tx-6",
    vaultId: "vault-4",
    date: "2023-09-10T08:45:00Z",
    description: "Initial funding",
    debit: 2000,
    credit: 0,
    currency: "EUR",
  },
  {
    id: "tx-7",
    vaultId: "vault-4",
    date: "2023-09-25T13:20:00Z",
    description: "Final payment",
    debit: 0,
    credit: 2000,
    currency: "EUR",
  },
  {
    id: "tx-8",
    vaultId: "vault-5",
    date: "2023-09-15T10:00:00Z",
    description: "Initial funding",
    debit: 8000,
    credit: 0,
    currency: "GBP",
  },
  {
    id: "tx-9",
    vaultId: "vault-5",
    date: "2023-10-10T15:30:00Z",
    description: "Milestone: Campaign Strategy",
    debit: 0,
    credit: 4000,
    currency: "GBP",
  },
]

export default function VaultPage() {
  const { role } = useRole()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currencyFilter, setCurrencyFilter] = useState<string>("all")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [filteredVaults, setFilteredVaults] = useState(mockContractVaults)
  const [filteredTransactions, setFilteredTransactions] = useState(mockTransactions)

  // Get unique currencies for the filter
  const uniqueCurrencies = Array.from(new Set(mockContractVaults.map((vault) => vault.currency)))

  // Apply filters
  useEffect(() => {
    // Filter vaults
    const vaults = mockContractVaults
      .filter((vault) => {
        const matchesSearch =
          vault.contractName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vault.counterpartyName.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === "all" || vault.status === statusFilter
        const matchesCurrency = currencyFilter === "all" || vault.currency === currencyFilter

        return matchesSearch && matchesStatus && matchesCurrency
      })
     

    setFilteredVaults(vaults)

    // Filter transactions based on filtered vaults
    const vaultIds = vaults.map((vault) => vault.id)
    const transactions = mockTransactions
      .filter((tx) => vaultIds.includes(tx.vaultId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date descending

    setFilteredTransactions(transactions)
  }, [searchTerm, statusFilter, currencyFilter, sortDirection])

  const resetFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCurrencyFilter("all")
    setSortDirection("desc")
  }

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Vault</h1>
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              {uniqueCurrencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
            className="w-10 h-10"
          >
            {sortDirection === "asc" ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
          </Button>

          <Button variant="outline" onClick={resetFilters} className="ml-auto">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Filters
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Vaults</CardTitle>
          <CardDescription>Overview of your contract escrow vaults</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Contract</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead className="text-right">Funded</TableHead>
                  <TableHead className="text-right">Released</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVaults.length > 0 ? (
                  filteredVaults.map((vault) => (
                    <TableRow key={vault.id}>
                      <TableCell className="font-medium">{vault.contractName}</TableCell>
                      <TableCell>{vault.counterpartyName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(vault.funded, vault.currency)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(vault.released, vault.currency)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(vault.balance, vault.currency)}
                      </TableCell>
                      <TableCell>{vault.currency}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            vault.status === "active"
                              ? "bg-green-100 text-green-800"
                              : vault.status === "completed"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {vault.status.charAt(0).toUpperCase() + vault.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No vaults found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All transactions for the filtered vaults</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Date</TableHead>
                  <TableHead className="w-[300px]">Description</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead>Currency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => {
                    const vault = mockContractVaults.find((v) => v.id === tx.vaultId)
                    return (
                      <TableRow key={tx.id}>
                        <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{tx.description}</TableCell>
                        <TableCell>{vault?.contractName}</TableCell>
                        <TableCell className="text-right">
                          {tx.debit > 0 ? formatCurrency(tx.debit, tx.currency) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {tx.credit > 0 ? formatCurrency(tx.credit, tx.currency) : "-"}
                        </TableCell>
                        <TableCell>{tx.currency}</TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No transactions found for the selected vaults.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
