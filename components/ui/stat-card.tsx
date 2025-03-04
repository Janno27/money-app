"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
  }
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          {icon && (
            <div className="h-12 w-12 rounded-full bg-primary/10 p-2.5 text-primary">
              {icon}
            </div>
          )}
        </div>
        {(description || trend) && (
          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            {trend && (
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
                {trend.value}%
              </span>
            )}
            <span>{description || trend?.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 