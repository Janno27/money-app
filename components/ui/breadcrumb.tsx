"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  title: string
  href?: string
}

export interface BreadcrumbProps
  extends React.HTMLAttributes<HTMLElement> {
  segments: BreadcrumbItem[]
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
      aria-label="breadcrumb"
      className={cn("flex items-center text-sm", className)}
      {...props}
    >
      <ol className="flex items-center gap-1.5">
        <li>
          <Link
            href="/"
            aria-label="Home"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>
        </li>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          return (
            <React.Fragment key={segment.title}>
              <li aria-hidden="true" className="text-muted-foreground">
                {separator}
              </li>
              <li>
                {isLast || !segment.href ? (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={cn(
                      "text-sm",
                      isLast ? "font-medium text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {segment.title}
                  </span>
                ) : segment.href ? (
                  <Link
                    href={segment.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {segment.title}
                  </Link>
                ) : null}
              </li>
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
