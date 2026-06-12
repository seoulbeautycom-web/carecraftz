import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rbxiureeqjywsabxrckv.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJieGl1cmVlcWp5d3NhYnhyY2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyOTI2NDQsImV4cCI6MjA5Njg2ODY0NH0.A5r7LGaW4hRC8tehBXftD27exfSlv2MZR_Ls7gbWqcI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
