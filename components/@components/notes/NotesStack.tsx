"use client"

import { useState } from "react"
import { Note } from "./types"
import { NoteCard } from "./NoteCard"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotesStackProps {
  notes: Note[]
  onUpdateNote: (id: string, updates: Partial<Note>) => void
  onDeleteNote: (id: string) => void
  onViewAll?: () => void
}

export function NotesStack({ notes, onUpdateNote, onDeleteNote, onViewAll }: NotesStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (notes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Aucune note
      </div>
    )
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev + 1) % notes.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev - 1 + notes.length) % notes.length)
  }

  return (
    <div className="relative h-full">
      <div className="absolute inset-0 flex items-center justify-center">
        {notes.map((note, index) => {
          const offset = index - currentIndex
          const isVisible = Math.abs(offset) <= 2

          return isVisible ? (
            <div
              key={note.id}
              className={cn(
                "absolute transition-all duration-300 ease-in-out w-full max-w-[300px]",
                offset === 0 && "z-30 scale-100 opacity-100 rotate-0",
                offset === 1 && "z-20 scale-[0.95] opacity-40 translate-y-[5px] rotate-3",
                offset === -1 && "z-20 scale-[0.95] opacity-40 translate-y-[5px] -rotate-3",
                offset === 2 && "z-10 scale-[0.9] opacity-30 translate-y-[10px] rotate-6",
                offset === -2 && "z-10 scale-[0.9] opacity-30 translate-y-[10px] -rotate-6",
                Math.abs(offset) > 2 && "opacity-0 pointer-events-none"
              )}
            >
              <NoteCard
                note={note}
                onUpdate={(updates) => onUpdateNote(note.id, updates)}
                onDelete={() => onDeleteNote(note.id)}
              />
            </div>
          ) : null
        })}
      </div>
      
      {notes.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 z-40">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {onViewAll && (
        <div className="absolute bottom-2 right-2 z-40">
          <Button
            variant="link"
            size="sm"
            className="text-primary flex items-center gap-1 hover:gap-2 transition-all"
            onClick={onViewAll}
          >
            Voir toutes
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
} 