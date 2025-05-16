import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"

export type ContractStatus = "draft" | "pending_signature" | "pending_funding" | "active" | "completed" | "disputed"

export interface ContractCardProps {
  id?: string
  name?: string
  category?: string
  status?: ContractStatus
  totalValue?: number
  currency?: string
  actionRequired?: boolean
  dueDate?: string
  counterpartyName?: string
  className?: string
}

export function ContractCard({
  id,
  name,
  category,
  status,
  totalValue,
  currency,
  actionRequired,
  dueDate,
  counterpartyName,
  className,
  nominal_value,
  description,
  owner
}: any) {
  // Update the statusConfig object to use brighter colors for the status pills
  const statusConfig = {
    draft: {
      label: "Draft",
      color: "bg-gray-300 text-gray-900",
      icon: Clock,
    },
    pending_signature: {
      label: "Pending Signature",
      color: "bg-yellow-300 text-yellow-900",
      icon: Clock,
    },
    pending_funding: {
      label: "Pending Funding",
      color: "bg-blue-300 text-blue-900",
      icon: Clock,
    },
    active: {
      label: "Active",
      color: "bg-green-300 text-green-900",
      icon: CheckCircle2,
    },
    completed: {
      label: "Completed",
      color: "bg-purple-300 text-purple-900",
      icon: CheckCircle2,
    },
    disputed: {
      label: "Disputed",
      color: "bg-red-300 text-red-900",
      icon: AlertCircle,
    },
  }
  console.log({
    name
  })

  const { label = "", color = "", icon: Icon = "" } = statusConfig?.[status ?? "draft"]


  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalValue)

  return (
    <Link href={`/contracts/${id}`} className="block">
      <Card
        className={cn(
          "transition-all hover:shadow-md hover:scale-[1.02] transform duration-300 cursor-pointer h-full",
          actionRequired ? "border-l-4 border-l-purple-500" : "",
          className,
        )}
      >
        <CardContent className="pt-6 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">{description}</h3>
              <p className="text-sm text-muted-foreground">{category}</p>
            </div>
            <Badge className={cn("ml-2", color)}>
              <Icon className="h-3.5 w-3.5 mr-1" />
              {label}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">With</span>
              <span className="text-sm font-medium">{owner?.display_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Value</span>
              <span className="text-sm font-medium">{currency}{nominal_value}</span>
            </div>
            {dueDate && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Due</span>
                <span className="text-sm font-medium">{new Date(dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 pb-4">
          {actionRequired ? (
            <div className="w-full flex items-center justify-between">
              <span className="text-sm font-medium text-purple-600">Action Required</span>
              <Badge variant="outline" className="ml-2">
                View
              </Badge>
            </div>
          ) : (
            <div className="w-full text-right">
              <Badge variant="outline">View Details</Badge>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}
