"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  trend?: {
    value: number
    label: string
  }
  icon?: React.ReactNode
  className?: string
  description?: string
}

export function StatCard({
  title,
  value,
  trend,
  icon,
  className,
  description,
}: StatCardProps) {
  return (
    <Card className={cn("transition-all", className)}>
      <CardContent className="p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        {icon && (
          <div className="h-12 w-12 rounded-full bg-primary/10 p-2.5 text-primary">
            {icon}
          </div>
        )}
        {(description || (trend && trend.value !== 0)) && (
          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            {trend && trend.value !== 0 && (
              <span
                className={cn(
                  "mr-2 font-medium",
                  trend.value > 0
                    ? "text-green-600"
                    : trend.value < 0
                    ? "text-red-600"
                    : ""
                )}
              >
                {trend.value > 0 ? "+" : ""}
                {trend.value.toFixed(1)}%
              </span>
            )}
            <span>{description || trend?.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}