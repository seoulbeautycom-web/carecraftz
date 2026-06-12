import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oudozsbnimsbgxkevvux.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91ZG96c2JuaW1zYmd4a2V2dnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzMwMjgsImV4cCI6MjA5Njg0OTAyOH0.bymcuMzMJESaqG4Imam-ZUT_rbUi4a5M4_0WGA4Jh6I'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
