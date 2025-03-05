"use client"

import { useState } from "react"
import { Note } from "./types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Palette, MoreVertical, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface NoteCardProps {
  note: Note
  onUpdate: (updates: Partial<Note>) => void
  onDelete: () => void
}

const colors = {
  yellow: "bg-yellow-100 hover:bg-yellow-200 border-yellow-200",
  blue: "bg-blue-100 hover:bg-blue-200 border-blue-200",
  green: "bg-green-100 hover:bg-green-200 border-green-200",
  pink: "bg-pink-100 hover:bg-pink-200 border-pink-200",
  purple: "bg-purple-100 hover:bg-purple-200 border-purple-200",
}

export function NoteCard({ note, onUpdate, onDelete }: NoteCardProps) {
  const [content, setContent] = useState(note.content)

  const handleContentChange = (value: string) => {
    setContent(value)
    onUpdate({ content: value })
  }

  const handleColorChange = (color: Note['color']) => {
    onUpdate({ color })
  }

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true,
      locale: fr 
    })
  }

  return (
    <Card className={cn(
      "w-[300px] transition-colors",
      colors[note.color]
    )}>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={note.user?.avatar || undefined} />
              <AvatarFallback>{note.user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{note.user?.name || "Utilisateur"}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem onClick={() => handleColorChange('yellow')}>
                <Palette className="mr-2 h-4 w-4 text-yellow-500" />
                Jaune
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleColorChange('blue')}>
                <Palette className="mr-2 h-4 w-4 text-blue-500" />
                Bleu
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleColorChange('green')}>
                <Palette className="mr-2 h-4 w-4 text-green-500" />
                Vert
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleColorChange('pink')}>
                <Palette className="mr-2 h-4 w-4 text-pink-500" />
                Rose
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleColorChange('purple')}>
                <Palette className="mr-2 h-4 w-4 text-purple-500" />
                Violet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Écrivez votre note ici..."
          className="min-h-[100px] resize-none bg-transparent border-0 p-0 focus-visible:ring-0"
        />

        <div className="text-[10px] text-muted-foreground">
          <div>Créée {formatDate(note.created_at)}</div>
          {note.updated_at !== note.created_at && (
            <div className="text-muted-foreground/60">
              Modifiée {formatDate(note.updated_at)}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
} 