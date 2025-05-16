import { Button } from "@/components/ui/button"
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserCircle } from 'lucide-react'

export function AccountMenu() {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleViewAccount = () => {
    router.push('/account')
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <UserCircle className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleViewAccount}>
          Account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="text-purple-600 dark:text-purple-400">
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
