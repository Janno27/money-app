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
      if (!dragState.isDragging || !dragState.noteId || !canvasRef.current) return

      // Capturer la position du scroll
      const canvas = canvasRef.current
      const scrollLeft = canvas.scrollLeft
      const scrollTop = canvas.scrollTop

      const dx = (e.clientX + scrollLeft) - dragState.startX
      const dy = (e.clientY + scrollTop) - dragState.startY

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

    // Capturer la position du scroll
    const canvasElement = canvasRef.current
    const scrollLeft = canvasElement?.scrollLeft || 0
    const scrollTop = canvasElement?.scrollTop || 0

    setDragState({
      isDragging: true,
      noteId: note.id,
      startX: e.clientX + scrollLeft,  // Ajouter la position du scroll horizontalement
      startY: e.clientY + scrollTop,   // Ajouter la position du scroll verticalement
      originalX: note.position.x,
      originalY: note.position.y
    })
  }

  // Ajouter une fonction pour gérer le défilement automatique pendant le drag
  useEffect(() => {
    if (!dragState.isDragging || !dragState.noteId || !canvasRef.current) return

    const canvas = canvasRef.current
    const handleAutoScroll = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const scrollSpeed = 15
      
      // Zone sensible pour le défilement automatique (en pixels depuis le bord)
      const scrollTriggerArea = 50
      
      // Défilement horizontal
      if (e.clientX < rect.left + scrollTriggerArea) {
        // Défiler vers la gauche
        canvas.scrollLeft -= scrollSpeed
      } else if (e.clientX > rect.right - scrollTriggerArea) {
        // Défiler vers la droite
        canvas.scrollLeft += scrollSpeed
      }
      
      // Défilement vertical
      if (e.clientY < rect.top + scrollTriggerArea) {
        // Défiler vers le haut
        canvas.scrollTop -= scrollSpeed
      } else if (e.clientY > rect.bottom - scrollTriggerArea) {
        // Défiler vers le bas
        canvas.scrollTop += scrollSpeed
      }
    }
    
    // Gérer le défilement automatique lors du mousemove
    const captureMouseMove = (e: MouseEvent) => {
      if (dragState.isDragging) {
        handleAutoScroll(e);
      }
    }
    
    document.addEventListener('mousemove', captureMouseMove)
    
    return () => {
      document.removeEventListener('mousemove', captureMouseMove)
    }
  }, [dragState.isDragging, dragState.noteId])

  return (
    <div 
      ref={canvasRef}
      className="notes-canvas relative h-full w-full overflow-auto p-6"
      style={{ 
        minWidth: "100%", 
        minHeight: "100%", 
        width: Math.max(
          ...notes.map(note => note.position.x + 350), // 350px pour la largeur de la note + marge
          1200 // Largeur minimale pour permettre le défilement même avec peu de notes
        ), 
        height: Math.max(
          ...notes.map(note => note.position.y + 250), // 250px pour la hauteur approximative de la note + marge
          800 // Hauteur minimale pour permettre le défilement même avec peu de notes
        )
      }}
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ minWidth: '100%', minHeight: '100%' }}>
        {/* Zone invisible pour garantir que l'espace est disponible pour le défilement */}
      </div>
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