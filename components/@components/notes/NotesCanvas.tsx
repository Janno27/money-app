"use client"

import { useState, useRef, useEffect } from "react"
import { Note } from "./types"
import { NoteCard } from "./NoteCard"

interface NotesCanvasProps {
  notes: Note[]
  onUpdateNote: (id: string, updates: Partial<Note>) => void
  onDeleteNote: (id: string) => void
}

interface DragState {
  isDragging: boolean
  noteId: string | null
  startX: number
  startY: number
  originalX: number
  originalY: number
}

export function NotesCanvas({ notes, onUpdateNote, onDeleteNote }: NotesCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    noteId: null,
    startX: 0,
    startY: 0,
    originalX: 0,
    originalY: 0
  })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.noteId) return

      const dx = e.clientX - dragState.startX
      const dy = e.clientY - dragState.startY

      const newX = Math.max(0, dragState.originalX + dx)
      const newY = Math.max(0, dragState.originalY + dy)

      // Mettre à jour la position de la note en temps réel
      const noteElement = document.querySelector(`[data-note-id="${dragState.noteId}"]`)
      if (noteElement) {
        noteElement.setAttribute('style', `transform: translate(${newX}px, ${newY}px)`)
      }
    }

    const handleMouseUp = () => {
      if (!dragState.isDragging || !dragState.noteId) return

      const noteElement = document.querySelector(`[data-note-id="${dragState.noteId}"]`)
      if (noteElement) {
        const transform = noteElement.getAttribute('style')?.match(/translate\((\d+)px,\s*(\d+)px\)/)
        if (transform) {
          const [, x, y] = transform
          onUpdateNote(dragState.noteId, {
            position: {
              x: parseInt(x),
              y: parseInt(y)
            }
          })
        }
      }

      setDragState({
        isDragging: false,
        noteId: null,
        startX: 0,
        startY: 0,
        originalX: 0,
        originalY: 0
      })
    }

    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, onUpdateNote])

  const handleMouseDown = (e: React.MouseEvent, note: Note) => {
    // Ignorer si on clique sur un élément interactif
    if ((e.target as HTMLElement).closest('button, textarea')) return

    const noteElement = (e.target as HTMLElement).closest('[data-note-id]')
    if (!noteElement) return

    setDragState({
      isDragging: true,
      noteId: note.id,
      startX: e.clientX,
      startY: e.clientY,
      originalX: note.position.x,
      originalY: note.position.y
    })
  }

  return (
    <div 
      ref={canvasRef}
      className="notes-canvas relative h-full w-full overflow-hidden bg-background p-6"
    >
      {notes.map((note) => (
        <div
          key={note.id}
          data-note-id={note.id}
          onMouseDown={(e) => handleMouseDown(e, note)}
          className="absolute touch-none select-none"
          style={{
            transform: `translate(${note.position.x}px, ${note.position.y}px)`,
            transition: dragState.isDragging && dragState.noteId === note.id ? 'none' : 'transform 0.1s ease-out',
            cursor: dragState.isDragging && dragState.noteId === note.id ? 'grabbing' : 'grab',
            zIndex: dragState.noteId === note.id ? 10 : 1
          }}
        >
          <NoteCard
            note={note}
            onUpdate={(updates) => onUpdateNote(note.id, updates)}
            onDelete={() => onDeleteNote(note.id)}
          />
        </div>
      ))}
    </div>
  )
} 