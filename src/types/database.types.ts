export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ai_conversations_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: Database['public']['Enums']['ai_role']
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: Database['public']['Enums']['ai_role']
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: Database['public']['Enums']['ai_role']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ai_messages_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'ai_conversations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ai_messages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      assignments: {
        Row: {
          completion_percentage: number
          course_id: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          priority: Database['public']['Enums']['priority_level']
          status: Database['public']['Enums']['assignment_status']
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_percentage?: number
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          priority?: Database['public']['Enums']['priority_level']
          status?: Database['public']['Enums']['assignment_status']
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_percentage?: number
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          priority?: Database['public']['Enums']['priority_level']
          status?: Database['public']['Enums']['assignment_status']
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'assignments_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'assignments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      courses: {
        Row: {
          color: string
          course_code: string
          course_name: string
          created_at: string
          credit_hours: number
          id: string
          instructor: string | null
          semester: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          course_code: string
          course_name: string
          created_at?: string
          credit_hours?: number
          id?: string
          instructor?: string | null
          semester?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          course_code?: string
          course_name?: string
          created_at?: string
          credit_hours?: number
          id?: string
          instructor?: string | null
          semester?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'courses_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      grades: {
        Row: {
          course_id: string | null
          course_label: string | null
          created_at: string
          credit_hours: number
          grade: string
          grade_points: number
          id: string
          semester: number
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          course_label?: string | null
          created_at?: string
          credit_hours: number
          grade: string
          grade_points: number
          id?: string
          semester: number
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          course_label?: string | null
          created_at?: string
          credit_hours?: number
          grade?: string
          grade_points?: number
          id?: string
          semester?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'grades_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'grades_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      materials: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number
          file_type?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'materials_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'materials_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          title: string
          type: Database['public']['Enums']['notification_type']
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          title: string
          type?: Database['public']['Enums']['notification_type']
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          title?: string
          type?: Database['public']['Enums']['notification_type']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          ai_preferences: NonNullable<Json>
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          notification_preferences: NonNullable<Json>
          profile_image_url: string | null
          semester: number | null
          theme: string
          university: string | null
          updated_at: string
        }
        Insert: {
          ai_preferences?: NonNullable<Json>
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id: string
          notification_preferences?: NonNullable<Json>
          profile_image_url?: string | null
          semester?: number | null
          theme?: string
          university?: string | null
          updated_at?: string
        }
        Update: {
          ai_preferences?: NonNullable<Json>
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          notification_preferences?: NonNullable<Json>
          profile_image_url?: string | null
          semester?: number | null
          theme?: string
          university?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          created_at: string
          difficulty: string
          id: string
          questions: NonNullable<Json>
          score: number | null
          subject: string
          topic: string
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          difficulty: string
          id?: string
          questions: NonNullable<Json>
          score?: number | null
          subject: string
          topic: string
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          created_at?: string
          difficulty?: string
          id?: string
          questions?: NonNullable<Json>
          score?: number | null
          subject?: string
          topic?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'quiz_attempts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      study_plans: {
        Row: {
          created_at: string
          exam_date: string | null
          hours_per_day: number | null
          id: string
          plan: NonNullable<Json>
          subject: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_date?: string | null
          hours_per_day?: number | null
          id?: string
          plan: NonNullable<Json>
          subject?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_date?: string | null
          hours_per_day?: number | null
          id?: string
          plan?: NonNullable<Json>
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'study_plans_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      study_sessions: {
        Row: {
          course_id: string | null
          created_at: string
          duration_minutes: number
          end_time: string
          id: string
          notes: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          duration_minutes: number
          end_time: string
          id?: string
          notes?: string | null
          start_time: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          duration_minutes?: number
          end_time?: string
          id?: string
          notes?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'study_sessions_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'study_sessions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: {
          category: Database['public']['Enums']['task_category']
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database['public']['Enums']['priority_level']
          status: Database['public']['Enums']['task_status']
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database['public']['Enums']['task_category']
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database['public']['Enums']['priority_level']
          status?: Database['public']['Enums']['task_status']
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database['public']['Enums']['task_category']
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database['public']['Enums']['priority_level']
          status?: Database['public']['Enums']['task_status']
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      timetable: {
        Row: {
          course_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          room: string | null
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          room?: string | null
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          room?: string | null
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'timetable_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'timetable_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      sync_notifications: { Args: Record<PropertyKey, never>; Returns: number }
    }
    Enums: {
      ai_role: 'user' | 'assistant'
      assignment_status: 'pending' | 'in_progress' | 'completed'
      notification_type:
        'info' | 'assignment_due' | 'assignment_overdue' | 'task_due' | 'exam' | 'study_reminder'
      priority_level: 'low' | 'medium' | 'high' | 'urgent'
      task_category: 'study' | 'assignment' | 'personal' | 'exam' | 'project' | 'other'
      task_status: 'pending' | 'in_progress' | 'completed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ai_role: ['user', 'assistant'],
      assignment_status: ['pending', 'in_progress', 'completed'],
      notification_type: [
        'info',
        'assignment_due',
        'assignment_overdue',
        'task_due',
        'exam',
        'study_reminder',
      ],
      priority_level: ['low', 'medium', 'high', 'urgent'],
      task_category: ['study', 'assignment', 'personal', 'exam', 'project', 'other'],
      task_status: ['pending', 'in_progress', 'completed'],
    },
  },
} as const
