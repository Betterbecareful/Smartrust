"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Notification = {
  id: number
  message: string
  read: boolean
  timestamp: Date
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 4,
      message:
        "Your contract <a href='/contracts/abc-website'>ABC Website</a> is now ready for Escrow, click here to fund it.",
      read: false,
      timestamp: new Date(2023, 5, 15, 10, 30),
    },
    {
      id: 3,
      message: "John Doe suggested edits to contract <a href='/contracts/abc-website'>ABC Website</a>",
      read: true,
      timestamp: new Date(2023, 5, 14, 15, 45),
    },
    {
      id: 2,
      message:
        "Your invite was accepted. John Doe has been added as a Freelancer to contract <a href='/contracts/abc-website'>ABC Website</a>",
      read: true,
      timestamp: new Date(2023, 5, 13, 9, 0),
    },
    {
      id: 1,
      message: "Congrats on creating your first contract",
      read: true,
      timestamp: new Date(2023, 5, 12, 14, 20),
    },
  ])
  const [showDot, setShowDot] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDot(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  const handleOpen = () => {
    setIsOpen(true)
    setShowDot(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
    setShowDot(false)
  }

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          handleOpen()
        } else {
          handleClose()
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {showDot && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          handleClose()
        }}
        sideOffset={5}
      >
        {notifications.map((notification, index) => (
          <DropdownMenuItem
            key={notification.id}
            className={`px-4 py-3 ${index !== 0 ? "border-t border-gray-200 dark:border-gray-700" : ""} ${!notification.read ? "font-bold" : ""}`}
          >
            <div>
              <div
                dangerouslySetInnerHTML={{
                  __html: notification.message.replace(/<a /g, '<a class="text-blue-500 underline" '),
                }}
              />
              <div className="text-xs text-gray-500 mt-1">{notification.timestamp.toLocaleString()}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
