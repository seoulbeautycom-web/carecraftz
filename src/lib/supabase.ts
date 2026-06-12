import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dhrtrycpdoraurdmauhd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRocnRyeWNwZG9yYXVyZG1hdWhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTc4OTksImV4cCI6MjA5NjIzMzg5OX0.LriOKcdbe1f2Jvd8Z9JJDIX82LndBl6nymjFJXvuVzE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for admin operations (bypasses RLS)
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRocnRyeWNwZG9yYXVyZG1hdWhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY1Nzg5OSwiZXhwIjoyMDk2MjMzODk5fQ.TKXv1ZM7g3Kh6v_ISqV99PQNuJcBlUXfrrzOk-C-yVc'

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
