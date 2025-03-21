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
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface NoteCardProps {
  note: Note
  onUpdate: (updates: Partial<Note>) => void
  onDelete: () => void
}

const colors = {
  yellow: "bg-yellow-100 hover:bg-yellow-200 border-yellow-200 dark:bg-yellow-900/80 dark:hover:bg-yellow-800 dark:border-yellow-700 dark:text-yellow-50",
  blue: "bg-blue-100 hover:bg-blue-200 border-blue-200 dark:bg-blue-900/80 dark:hover:bg-blue-800 dark:border-blue-700 dark:text-blue-50",
  green: "bg-green-100 hover:bg-green-200 border-green-200 dark:bg-green-900/80 dark:hover:bg-green-800 dark:border-green-700 dark:text-green-50",
  pink: "bg-pink-100 hover:bg-pink-200 border-pink-200 dark:bg-pink-900/80 dark:hover:bg-pink-800 dark:border-pink-700 dark:text-pink-50",
  purple: "bg-purple-100 hover:bg-purple-200 border-purple-200 dark:bg-purple-900/80 dark:hover:bg-purple-800 dark:border-purple-700 dark:text-purple-50",
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
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{note.user?.name || "Utilisateur"}</span>
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
          className="min-h-[100px] resize-none bg-transparent border-0 p-0 focus-visible:ring-0 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />

        <div className="text-[10px] text-slate-600 dark:text-slate-300">
          <div>Créée {formatDate(note.created_at)}</div>
          {note.updated_at !== note.created_at && (
            <div className="text-slate-500 dark:text-slate-400">
              Modifiée {formatDate(note.updated_at)}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
} 