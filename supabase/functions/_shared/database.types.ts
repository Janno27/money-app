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
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      organization_invitations: {
        Row: {
          id: string
          organization_id: string
          email: string
          invited_by: string | null
          status: string
          created_at: string
          updated_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          invited_by?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          invited_by?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          expires_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar: string | null
          organization_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar?: string | null
          organization_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar?: string | null
          organization_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_organization_invitation: {
        Args: {
          p_invitation_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      get_users_in_my_organization: {
        Args: Record<string, never>
        Returns: {
          id: string
          email: string
          name: string
          avatar: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 