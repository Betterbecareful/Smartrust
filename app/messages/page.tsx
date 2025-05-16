'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from 'lucide-react'
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useRouter } from 'next/navigation'

const mockContacts = [
  { id: 1, name: "Alice Johnson", lastMessage: "Hey, how's the project going?" },
  { id: 2, name: "Bob Smith", lastMessage: "Can you review the contract?" },
  { id: 3, name: "Carol Williams", lastMessage: "Payment received, thanks!" },
  { id: 4, name: "David Brown", lastMessage: "When can we schedule a call?" },
  { id: 5, name: "Eva Davis", lastMessage: "I've updated the task list." },
  { id: 6, name: "Frank Miller", lastMessage: "Do you have time for a quick chat?" },
  { id: 7, name: "Grace Lee", lastMessage: "The client loved our proposal!" },
  { id: 8, name: "Henry Wilson", lastMessage: "Can we discuss the project timeline?" },
  { id: 9, name: "Ivy Chen", lastMessage: "I've sent you the updated designs." },
  { id: 10, name: "Jack Taylor", lastMessage: "Let's catch up on the progress tomorrow." }
]

const generateMockMessages = (count: number) => {
  const messages = []
  for (let i = 0; i < count; i++) {
    messages.push({
      id: i + 1,
      sender: i % 2 === 0 ? "You" : mockContacts[0].name,
      content: `This is message number ${i + 1}. ${i % 3 === 0 ? 'It\'s a bit longer to test wrapping.' : ''}`
    })
  }
  return messages
}

const mockMessages = {
  1: generateMockMessages(20),
  2: generateMockMessages(5),
  3: generateMockMessages(7),
  4: generateMockMessages(3),
  5: generateMockMessages(6),
  6: generateMockMessages(4),
  7: generateMockMessages(8),
  8: generateMockMessages(5),
  9: generateMockMessages(6),
  10: generateMockMessages(4)
}

export default function Messages() {
  const [selectedContact, setSelectedContact] = useState(mockContacts[0])
  const [newMessage, setNewMessage] = useState('')
  const [isOpen, setIsOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the message to your backend
    console.log('Sending message:', newMessage)
    setNewMessage('')
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedContact])

  const handleClose = () => {
    setIsOpen(false)
    router.push('/dashboard')
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-full h-[90vh] p-0">
        <div className="flex h-full">
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <h2 className="text-2xl font-bold p-4">Contacts</h2>
            {mockContacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  selectedContact.id === contact.id ? 'bg-gray-200 dark:bg-gray-700' : ''
                }`}
                onClick={() => setSelectedContact(contact)}
              >
                <h3 className="font-semibold">{contact.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{contact.lastMessage}</p>
              </div>
            ))}
          </div>
          <div className="w-2/3 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <h2 className="text-2xl font-bold mb-4">{selectedContact.name}</h2>
              {mockMessages[selectedContact.id as keyof typeof mockMessages].map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 ${
                    message.sender === 'You' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block p-2 rounded-lg ${
                      message.sender === 'You'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 flex">
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 mr-2"
              />
              <Button type="submit">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
