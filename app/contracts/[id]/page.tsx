'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { useRole } from '@/contexts/RoleContext'
import type { ContractStatus } from '@/components/ContractCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Plus, ChevronRight } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

type MilestoneData = {
  id: number
  name: string
  description: string | null
  amount: number | null
  status: string | null
  paymentStatus: string | null
  originalDueDate: string | null
  updatedDueDate: string | null
}

type TaskData = {
  id: number
  refTaskName: string | null
  label: string | null
  status: string | null
  displayOrder: number | null
}

type ContractData = {
  id: number
  name: string | null
  category: string | null
  status: ContractStatus | null
  description: string | null
  totalValue: number | null
  currency: string | null
  actionRequired: boolean | null
  dueDate: string | null
  counterpartyName: string | null
  escrowBalance: number | null
}

export default function ContractDetailsPage() {
  const { id } = useParams()
  const { role } = useRole()
  const { toast } = useToast()

  const [contract, setContract] = useState<ContractData | null>(null)
  const [milestones, setMilestones] = useState<MilestoneData[]>([])
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [showAddMilestone, setShowAddMilestone] = useState(false)
  const [newMilestone, setNewMilestone] = useState({ name: '', amount: '', dueDate: '' })
  const [showFundEscrow, setShowFundEscrow] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [activeTask, setActiveTask] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      // 1) Fetch contract
      const { data: c, error: cErr } = await supabase
        .from('contracts')
        .select(`
          id,
          name,
          category,
          status,
          description,
          total_value,
          currency,
          action_required,
          due_date,
          counterparty_name,
          escrow_balance
        `)
        .eq('id', Number(id))
        .single()

      if (cErr || !c) {
        console.error(cErr)
        setLoading(false)
        return
      }

      // 2) Fetch milestones
      const { data: ms, error: msErr } = await supabase
        .from('milestones')
        .select(`
          id,
          name,
          description,
          value,
          milestone_status,
          payment_status,
          original_due_date,
          updated_due_date
        `)
        .eq('contract', Number(id))
        .order('id', { ascending: true })

      if (msErr) {
        console.error(msErr)
      }

      // 3) Fetch tasks
      const { data: ts, error: tsErr } = await supabase
        .from('tasks')
        .select(`
          id,
          ref_task_name,
          label,
          status,
          display_order
        `)
        .eq('contract', Number(id))
        .order('display_order', { ascending: true })

      if (tsErr) {
        console.error(tsErr)
      }

      // Map snake_case → camelCase
      setContract({
        id: c.id,
        name: c.name,
        category: c.category,
        status: c.status as ContractStatus,
        description: c.description,
        totalValue: c.total_value,
        currency: c.currency,
        actionRequired: c.action_required,
        dueDate: c.due_date,
        counterpartyName: c.counterparty_name,
        escrowBalance: c.escrow_balance,
      })

      setMilestones(
        (ms || []).map(m => ({
          id: m.id,
          name: m.name,
          description: m.description,
          amount: m.value,
          status: m.milestone_status,
          paymentStatus: m.payment_status,
          originalDueDate: m.original_due_date,
          updatedDueDate: m.updated_due_date,
        }))
      )

      setTasks(
        (ts || []).map(t => ({
          id: t.id,
          refTaskName: t.ref_task_name,
          label: t.label,
          status: t.status,
          displayOrder: t.display_order,
        }))
      )

      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div>Loading…</div>
  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Contract Not Found</h2>
        <p className="text-muted-foreground mb-6">That contract doesn’t exist.</p>
        <Button asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    )
  }

  const statusConfig = {
    draft: { label: 'Draft', color: 'bg-gray-200 text-gray-800', icon: Clock },
    pending_signature: { label: 'Pending Signature', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    pending_funding: { label: 'Pending Funding', color: 'bg-blue-100 text-blue-800', icon: Clock },
    active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    completed: { label: 'Completed', color: 'bg-purple-100 text-purple-800', icon: CheckCircle2 },
    disputed: { label: 'Disputed', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  } as const

  const cfg = statusConfig[contract.status || 'draft']
  const formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: contract.currency || 'USD' }).format(contract.totalValue || 0)
  const formattedEscrow = new Intl.NumberFormat('en-US', { style: 'currency', currency: contract.currency || 'USD' }).format(contract.escrowBalance || 0)
  const canEdit = ['draft', 'pending_signature'].includes(contract.status || '')
  const needsFunding = contract.status === 'pending_funding'
  const isBuyer = role === 'Buyer'

  const handleTaskClick = (taskId: string) => setActiveTask(taskId)
  const handleAddMilestone = () => {
    if (!newMilestone.name || !newMilestone.amount || !newMilestone.dueDate) {
      return toast({ title: 'Missing Information', description: 'Fill all milestone fields', variant: 'destructive' })
    }
    toast({ title: 'Milestone Added', description: `${newMilestone.name} added.` })
    setShowAddMilestone(false)
    setNewMilestone({ name: '', amount: '', dueDate: '' })
  }
  const handleFundEscrow = () => {
    if (!fundAmount) {
      return toast({ title: 'Missing Info', description: 'Enter amount to fund', variant: 'destructive' })
    }
    toast({
      title: 'Escrow Funded',
      description: new Intl.NumberFormat('en-US', { style: 'currency', currency: contract.currency || 'USD' }).format(Number(fundAmount)) + ' added.',
    })
    setShowFundEscrow(false)
    setFundAmount('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-2xl font-bold">{contract.name}</h1>
        <Badge className={cfg.color}><cfg.icon className="h-4 w-4 mr-1" />{cfg.label}</Badge>
      </div>

      {/* Contract Details & Escrow */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
            <CardDescription>Overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm text-muted-foreground">Category</h3>
                <p>{contract.category}</p>
              </div>
              <div>
                <h3 className="text-sm text-muted-foreground">Counterparty</h3>
                <p>{contract.counterpartyName}</p>
              </div>
              <div>
                <h3 className="text-sm text-muted-foreground">Total Value</h3>
                <p className="font-semibold">{formattedValue}</p>
              </div>
              {contract.dueDate && (
                <div>
                  <h3 className="text-sm text-muted-foreground">Due Date</h3>
                  <p>{new Date(contract.dueDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            <Separator />
            <div>
              <h3 className="text-sm text-muted-foreground mb-1">Description</h3>
              <p>{contract.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Escrow Status</CardTitle>
            <CardDescription>Funding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm text-muted-foreground">Balance</h3>
              <p className="text-2xl font-bold">{formattedEscrow}</p>
              <p className="text-sm text-muted-foreground">of {formattedValue}</p>
            </div>
            {needsFunding && isBuyer && (
              <Button className="w-full" onClick={() => setShowFundEscrow(true)}>
                Fund Escrow
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Milestones & Tasks */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex justify-between items-center">
            <div>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>Deliverables & payments</CardDescription>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => setShowAddMilestone(true)}>
                <Plus className="mr-1" /> Add
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {milestones.length ? (
              <div className="space-y-4">
                {milestones.map(m => (
                  <div key={m.id} className="flex justify-between items-center p-4 border rounded">
                    <div>
                      <h3 className="font-medium">{m.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(m.originalDueDate || '').toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-medium">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: contract.currency || 'USD' }).format(m.amount || 0)}
                      </p>
                      <Badge className={
                        m.status === 'completed' ? 'bg-green-100 text-green-800'
                          : m.status === 'in_progress' ? 'bg-blue-100 text-blue-800'
                          : m.status === 'disputed' ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }>
                        {m.status?.replace('_', ' ') || 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No milestones yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-auto pr-2">
            {tasks.map(t => (
              <div
                key={t.id}
                className="flex justify-between items-center p-3 border rounded cursor-pointer hover:bg-gray-50"
                onClick={() => handleTaskClick(t.refTaskName || '')}
              >
                <span>{t.label}</span>
                <ChevronRight />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Task Slide-out Panel */}
      <Sheet open={!!activeTask} onOpenChange={() => setActiveTask(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {activeTask === 'invite_counterparty' && 'Invite Counterparty'}
              {/* add more titles for other tasks here */}
            </SheetTitle>
          </SheetHeader>
          <div className="py-6">
            {activeTask === 'invite_counterparty' ? (
              <div className="space-y-4">
                <p>Invite them to sign this contract.</p>
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="their@example.com" />
                <Button className="w-full">Send Invite</Button>
              </div>
            ) : (
              <Button className="w-full" onClick={() => setActiveTask(null)}>Close</Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Milestone Dialog */}
      <Dialog open={showAddMilestone} onOpenChange={() => setShowAddMilestone(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
            <DialogDescription>Track deliverables</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="milestone-name">Name</Label>
              <Input
                id="milestone-name"
                value={newMilestone.name}
                onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="milestone-amount">Amount</Label>
              <Input
                id="milestone-amount"
                type="number"
                value={newMilestone.amount}
                onChange={e => setNewMilestone({ ...newMilestone, amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="milestone-date">Due Date</Label>
              <Input
                id="milestone-date"
                type="date"
                value={newMilestone.dueDate}
                onChange={e => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMilestone(false)}>Cancel</Button>
            <Button onClick={handleAddMilestone}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fund Escrow Dialog */}
      <Dialog open={showFundEscrow} onOpenChange={() => setShowFundEscrow(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Escrow</DialogTitle>
            <DialogDescription>Add funds</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="fund-amount">Amount</Label>
            <Input
              id="fund-amount"
              type="number"
              value={fundAmount}
              onChange={e => setFundAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFundEscrow(false)}>Cancel</Button>
            <Button onClick={handleFundEscrow}>Fund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
