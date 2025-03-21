"use client"

import { useState, useEffect } from "react"
import { Note } from "./types"
import { NoteCard } from "./NoteCard"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ArrowRight, Pen } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

interface NotesStackProps {
  notes: Note[]
  onUpdateNote: (id: string, updates: Partial<Note>) => void
  onDeleteNote: (id: string) => void
  onViewAll?: () => void
  className?: string
  hideTitle?: boolean
  onCreate?: () => void
  isLoading?: boolean
}

export function NotesStack({
  notes,
  onUpdateNote,
  onDeleteNote,
  onViewAll,
  className = "",
  hideTitle = false,
  onCreate,
  isLoading = false
}: NotesStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sortedNotes, setSortedNotes] = useState<Note[]>([])

  useEffect(() => {
    const sorted = [...notes].sort((a, b) => {
      return new Date(b.updated_at || b.created_at).getTime() - 
        new Date(a.updated_at || a.created_at).getTime()
    })
    
    setSortedNotes(sorted)
    // Réinitialiser l'index si nécessaire
    if (currentIndex >= sorted.length && sorted.length > 0) {
      setCurrentIndex(0)
    }
  }, [notes, currentIndex])

  if (isLoading) {
    return <NotesStackSkeleton />
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev + 1) % notes.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev - 1 + notes.length) % notes.length)
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {!hideTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-700">Notes</h3>
          {onCreate && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={onCreate}
            >
              <Pen className="h-3.5 w-3.5" />
              <span className="text-xs">Créer</span>
            </Button>
          )}
        </div>
      )}

      {notes.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Aucune note à afficher
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 gap-4 pr-2 pb-4">
            {sortedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onUpdate={(updates) => onUpdateNote(note.id, updates)}
                onDelete={() => onDeleteNote(note.id)}
              />
            ))}
          </div>
        </ScrollArea>
      )}
      
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

export function NotesStackSkeleton() {
  const noteWidths = [60, 35, 70, 50];
  const noteColors = ['#fef3c7', '#e0f2fe', '#dcfce7', '#f3e8ff'];
  const lineWidths = [20, 45, 65, 55, 35, 25];
  const hasThirdLine = [true, false, true, false];
  
  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-700">Notes</h3>
        <Skeleton className="h-8 w-20" />
      </div>
      
      <div className="grid grid-cols-2 gap-2 max-h-[calc(100%-40px)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className="p-2 rounded-md space-y-1.5"
            style={{ 
              backgroundColor: noteColors[i % 4],
              opacity: 0.8
            }}
          >
            <Skeleton 
              className="h-3"
              style={{ 
                width: `${noteWidths[i % 4]}%`,
                backgroundColor: 'rgba(255,255,255,0.7)'
              }}
            />
            <Skeleton 
              className="h-3"
              style={{ 
                width: `${lineWidths[(i * 2) % 6]}%`,
                backgroundColor: 'rgba(255,255,255,0.7)'
              }}
            />
            {hasThirdLine[i % 4] && (
              <Skeleton 
                className="h-3"
                style={{ 
                  width: `${lineWidths[(i * 2 + 1) % 6]}%`,
                  backgroundColor: 'rgba(255,255,255,0.7)'
                }}
              />
            )}
            <div className="flex items-center space-x-1.5 mt-1.5">
              <Skeleton 
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
              />
              <Skeleton 
                className="h-2.5 w-12"
                style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 