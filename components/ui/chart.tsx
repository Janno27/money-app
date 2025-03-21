"use client"

import * as React from "react"
import { Tooltip } from "recharts"
import { cn } from "@/lib/utils"

export type ChartConfig = Record<string, { label: string; color: string }>

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

export function ChartContainer({
  config,
  children,
  className,
  ...props
}: ChartContainerProps) {
  const cssVars = React.useMemo(() => {
    const vars: Record<string, string> = {}
    Object.entries(config).forEach(([key, value]) => {
      vars[`--color-${key}`] = value.color
    })
    return vars
  }, [config])

  return (
    <div className={cn("", className)} style={cssVars} {...props}>
      {children}
    </div>
  )
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: number;
    [key: string]: unknown;
  }>;
  label?: string;
  className?: string;
  [key: string]: unknown;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  ...props
}: ChartTooltipContentProps) {
  if (!active || !payload) {
    return null
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-2 shadow-sm text-xs",
        className
      )}
      {...props}
    >
      <div className="grid gap-2">
        <div className="font-medium">{label}</div>
        <div className="grid gap-1">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-2">
              <div
                className="flex items-center gap-1"
                style={{
                  color: item.color,
                }}
              >
                <div className="h-1 w-1 rounded-full" style={{ background: item.color }} />
                <span>{item.name}</span>
              </div>
              <div>{item.value.toLocaleString('fr-FR')}€</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export { Tooltip as ChartTooltip } 