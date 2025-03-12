export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: string
          created_at?: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Autres tables selon les besoins
    }
    Functions: {
      get_organization_name: {
        Args: {
          org_id: string
        }
        Returns: string
      }
      get_users_by_organization: {
        Args: Record<string, never>
        Returns: {
          id: string
          email: string
          name: string
          avatar: string | null
        }[]
      }
    }
  }
} 