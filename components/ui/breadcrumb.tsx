"use client"

import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbProps extends React.ComponentProps<"nav"> {
  segments: {
    title: string
    href?: string
  }[]
  separator?: React.ReactNode
}

export function Breadcrumb({
  segments,
  separator = <ChevronRight className="h-4 w-4" />,
  className,
  ...props
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex w-full items-center overflow-auto text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      <ol className="flex min-w-full items-center gap-1.5">
        <li>
          <a
            href="/"
            className="flex items-center gap-1.5 text-foreground hover:text-muted-foreground"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Accueil</span>
          </a>
        </li>
        {segments.map((segment, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {separator}
            {segment.href ? (
              <a
                href={segment.href}
                className="hover:text-foreground"
              >
                {segment.title}
              </a>
            ) : (
              <span className="text-foreground">{segment.title}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
