export interface Note {
  id: string
  content: string
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple'
  position: {
    x: number
    y: number
  }
  created_at: string
  updated_at: string
  user_id: string
  user?: {
    name: string | null
    avatar: string | null
  }
}

export type NotePosition = {
  id: string
  position: {
    x: number
    y: number
  }
}

export type NoteCreate = Omit<Note, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'user'>
export type NoteUpdate = Partial<NoteCreate> 