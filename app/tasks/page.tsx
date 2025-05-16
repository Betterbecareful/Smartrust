'use client'

import { useState, useEffect } from 'react'
import { useRole } from '@/contexts/RoleContext'
import { useAuth } from '@/contexts/AuthContext'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Button } from "@/components/ui/button"
import { Plus, Loader2, UserPlus } from 'lucide-react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

type Contract = {
  id: number
  description: string
  dashboard_state: string
  owner: number
  nominal_value: number
  currency: string
  stage: number
  metadata: any
  created_at?: string
}

type Task = {
  id: number
  contract: number
  ref_task_name: string
  label: string
  status: 'todo' | 'in_progress' | 'done'
  created_at?: string
  display_order: number
}

type Lane = {
  id: string
  title: string
  tasks: Task[]
}

export default function TasksPage() {
  const { role } = useRole()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [lanes, setLanes] = useState<Lane[]>([
    { id: 'todo', title: 'To Do', tasks: [] },
    { id: 'in_progress', title: 'In Progress', tasks: [] },
    { id: 'done', title: 'Done', tasks: [] }
  ])
  const [selectedContractId, setSelectedContractId] = useState<string>('')
  
  const [newTaskContent, setNewTaskContent] = useState('')
  const [activeColumn, setActiveColumn] = useState('')
  
  // Use separate state variables for each dialog
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    const fetchContracts = async () => {
      if (!user) return

      setLoading(true)
      try {
        const { data: contractsData, error: contractsError } = await supabase
          .from('contracts')
          .select('*')
          .order('created_at', { ascending: false })

        if (contractsError) throw contractsError

        if (contractsData && contractsData.length > 0) {
          setContracts(contractsData)
          setSelectedContractId(contractsData[0].id.toString())
        }
      } catch (error) {
        console.error("Error fetching contracts:", error)
        toast({
          title: "Error",
          description: "Failed to load contracts.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchContracts()
  }, [user, toast])

  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedContractId) return
      
      setLoading(true)
      try {
        const contractId = parseInt(selectedContractId)
        
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('contract', contractId)
          .order('display_order', { ascending: true })

        if (tasksError) throw tasksError

        // Group tasks by status
        const todoTasks = tasksData?.filter(task => task.status === 'todo') || []
        const inProgressTasks = tasksData?.filter(task => task.status === 'in_progress') || []
        const doneTasks = tasksData?.filter(task => task.status === 'done') || []
        
        // Sort tasks by display_order within each lane
        todoTasks.sort((a, b) => a.display_order - b.display_order)
        inProgressTasks.sort((a, b) => a.display_order - b.display_order)
        doneTasks.sort((a, b) => a.display_order - b.display_order)

        // Update lanes with new tasks
        setLanes([
          { id: 'todo', title: 'To Do', tasks: todoTasks },
          { id: 'in_progress', title: 'In Progress', tasks: inProgressTasks },
          { id: 'done', title: 'Done', tasks: doneTasks }
        ])
      } catch (error) {
        console.error("Error fetching tasks:", error)
        toast({
          title: "Error",
          description: "Failed to load tasks for the selected contract.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [selectedContractId, toast])

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: 'Error', description: 'Please enter an email.', variant: 'destructive' })
      return
    }
    setIsInviting(true)
    try {
      const { data, error } = await supabase
        .from('invite_user')
        .insert({
          email: inviteEmail.trim(),
          invited_user: user?.id,
          contract_id: parseInt(selectedContractId, 10),
        }).select("*")
      if (error) throw error
      const id = (data as any)[0]?.id
      const link = `${window.location.origin}/invite/${id}`
      setInviteLink(link)
      toast({ title: 'Invite Sent', description: 'Invite link is ready.' })
    } catch (err) {
      console.error('Invite error:', err)
      toast({ title: 'Error', description: 'Failed to send invite.', variant: 'destructive' })
    } finally {
      setIsInviting(false)
    }
  }

  const getContractName = (contract: Contract) => {
    if (contract.metadata?.name) {
      return contract.metadata.name
    }
    
    if (contract.description) {
      return contract.description.substring(0, 30) + (contract.description.length > 30 ? '...' : '')
    }
    
    return `Contract #${contract.id}`
  }

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result

    // If there's no destination (dropped outside the list) or no movement, return
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return
    }

    const taskId = parseInt(draggableId)
    const sourceColumnId = source.droppableId
    const destinationColumnId = destination.droppableId
    const sourceIndex = source.index
    const destinationIndex = destination.index

    // Create a copy of the current lanes
    const newLanes = [...lanes]
    
    // Find the source and destination lane
    const sourceLane = newLanes.find(lane => lane.id === sourceColumnId)
    const destinationLane = newLanes.find(lane => lane.id === destinationColumnId)
    
    if (!sourceLane || !destinationLane) return

    // Get the task to move
    const [movedTask] = sourceLane.tasks.splice(sourceIndex, 1)
    
    // Update the task's status if moving to a different lane
    if (sourceColumnId !== destinationColumnId) {
      movedTask.status = destinationColumnId as 'todo' | 'in_progress' | 'done'
    }
    
    // Insert the task at the destination
    destinationLane.tasks.splice(destinationIndex, 0, movedTask)
    
    // Update the display_order for all tasks in the affected lanes
    if (sourceColumnId === destinationColumnId) {
      sourceLane.tasks.forEach((task, index) => {
        task.display_order = index
      })
    } else {
      sourceLane.tasks.forEach((task, index) => {
        task.display_order = index
      })
      
      destinationLane.tasks.forEach((task, index) => {
        task.display_order = index
      })
    }
    
    // Update the state immediately for a responsive UI
    setLanes(newLanes)
    
    try {
      // First, update the moved task's status and position
      await supabase
        .from('tasks')
        .update({ 
          status: movedTask.status,
          display_order: destinationIndex
        })
        .eq('id', movedTask.id)
      
      // Then, update the display_order for all tasks in affected lanes
      const updatesSource = sourceLane.tasks.map(task => ({
        id: task.id,
        display_order: task.display_order
      }))
      
      const updatesDestination = sourceColumnId !== destinationColumnId 
        ? destinationLane.tasks.map(task => ({
            id: task.id,
            display_order: task.display_order
          }))
        : []
      
      const updates = [...updatesSource, ...updatesDestination]
      
      if (updates.length > 0) {
        await supabase.from('tasks').upsert(updates)
      }
    } catch (error) {
      console.error("Error updating task positions:", error)
      toast({
        title: "Error",
        description: "Failed to update task status or order.",
        variant: "destructive"
      })
    }
  }

  const handleCreateTask = async () => {
    if (!newTaskContent.trim() || !selectedContractId || !activeColumn) return

    try {
      const contractId = parseInt(selectedContractId)
      
      // Find the target lane to determine display_order
      const targetLane = lanes.find(lane => lane.id === activeColumn)
      const displayOrder = targetLane ? targetLane.tasks.length : 0
      
      const newTask = {
        contract: contractId,
        ref_task_name: "User created task",
        label: newTaskContent,
        status: activeColumn as 'todo' | 'in_progress' | 'done',
        display_order: displayOrder,
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single()

      if (error) throw error

      // Update local state with new task
      setLanes(prev => {
        const newLanes = [...prev]
        const laneIndex = newLanes.findIndex(lane => lane.id === activeColumn)
        
        if (laneIndex !== -1) {
          newLanes[laneIndex].tasks.push(data)
        }
        
        return newLanes
      })

      toast({
        title: "Success",
        description: "Task created successfully!",
      })
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: "Error",
        description: "Failed to create task.",
        variant: "destructive"
      })
    } finally {
      setNewTaskContent('')
      setActiveColumn('')
      setIsTaskDialogOpen(false)
    }
  }

  const handleLaneClick = (laneId) => {
    setActiveColumn(laneId)
    setIsTaskDialogOpen(true)
  }

  // Custom card styles matching the original design
  const getCardStyle = (laneId) => {
    if (laneId === 'todo') {
      return "border border-blue-200 bg-opacity-60 bg-blue-50"
    } else if (laneId === 'in_progress') {
      return "border border-yellow-200 bg-opacity-60 bg-yellow-50"
    } else {
      return "border border-green-200 bg-opacity-60 bg-green-50"
    }
  }

  if (loading && contracts.length === 0) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading contracts...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm">To Do</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-sm">In Progress</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm">Done</span>
          </div>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No contracts found.</p>
          <Button>Create a Contract</Button>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center space-x-4">
            <Select
              value={selectedContractId}
              onValueChange={setSelectedContractId}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select a contract" />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id.toString()}>
                    {getContractName(contract)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedContractId && (
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" /> Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="inviteEmail">Email</Label>
                      <Input
                        id="inviteEmail"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                    {!inviteLink ? (
                      <Button onClick={handleSendInvite} disabled={isInviting}>
                        {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Invite
                      </Button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Input readOnly value={inviteLink} className="flex-1" />
                        <Button onClick={() => navigator.clipboard.writeText(inviteLink)}>
                          Copy
                        </Button>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsInviteDialogOpen(false)
                        setInviteEmail('')
                        setInviteLink(null)
                      }}
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-10">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <p>Loading tasks...</p>
            </div>
          ) : (
            <>
              <div className="flex space-x-4">
                <DragDropContext onDragEnd={handleDragEnd}>
                  {lanes.map(lane => (
                    <div key={lane.id} className="w-1/3 min-w-80">
                      <div className="bg-black border border-gray-100 rounded-lg p-4 min-h-[700px] relative">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-lg">{lane.title}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleLaneClick(lane.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Droppable droppableId={lane.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`min-h-[600px] transition-colors ${
                                snapshot.isDraggingOver ? 'bg-gray-700' : ''
                              }`}
                            >
                              {lane.tasks.map((task, index) => (
                                <Draggable
                                  key={task.id.toString()}
                                  draggableId={task.id.toString()}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`p-3 mb-2 rounded-lg shadow-sm ${
                                        getCardStyle(lane.id)
                                      } ${
                                        snapshot.isDragging ? 'opacity-75 shadow-md' : ''
                                      } bg-gray-900`}
                                      style={{
                                        ...provided.draggableProps.style,
                                        cursor: 'grab'
                                      }}
                                    >
                                      <div className="font-medium text-sm">{task.label}</div>
                                      <div className="text-xs text-gray-500 mt-1">{task.ref_task_name}</div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    </div>
                  ))}
                </DragDropContext>
              </div>
              
              {/* Task creation dialog - now using isTaskDialogOpen */}
              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="task-description" className="text-right">
                        Task
                      </Label>
                      <Input
                        id="task-description"
                        value={newTaskContent}
                        onChange={(e) => setNewTaskContent(e.target.value)}
                        className="col-span-3"
                        placeholder="What needs to be done?"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateTask}>Create Task</Button>
                </DialogContent>
              </Dialog>
            </>
          )}
        </>
      )}
    </div>
  )
}