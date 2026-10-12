import { supabase } from './supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rbxiureeqjywsabxrckv.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJieGl1cmVlcWp5d3NhYnhyY2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyOTI2NDQsImV4cCI6MjA5Njg2ODY0NH0.A5r7LGaW4hRC8tehBXftD27exfSlv2MZR_Ls7gbWqcI'
const FUNCTIONS_URL = `${supabaseUrl}/functions/v1`
const USE_WASENDER = true

async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${session?.access_token || supabaseAnonKey}`,
  }
}

export async function sendWhatsAppOTP(
  phone: string,
): Promise<{ success: boolean; error?: string; testOtp?: string }> {
  try {
    const functionName = USE_WASENDER ? 'whatsapp-otp-wasender' : 'whatsapp-otp'
    const response = await fetch(`${FUNCTIONS_URL}/${functionName}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ action: 'send', phone: formatPhoneNumber(phone) }),
    })
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Send WhatsApp OTP error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send OTP',
    }
  }
}

export async function verifyWhatsAppOTP(
  phone: string,
  code: string,
): Promise<{
  success: boolean
  error?: string
  userId?: string
  email?: string
  token_hash?: string
  type?: string
  phone?: string
}> {
  try {
    const functionName = USE_WASENDER ? 'whatsapp-otp-wasender' : 'whatsapp-otp'
    const response = await fetch(`${FUNCTIONS_URL}/${functionName}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        action: 'verify',
        phone: formatPhoneNumber(phone),
        code: code.trim(),
      }),
    })
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Verify WhatsApp OTP error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify OTP',
    }
  }
}

export async function sendWhatsAppMessage(
  phone: string,
  body: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const functionName = USE_WASENDER ? 'whatsapp-wasender' : 'whatsapp'
    const response = await fetch(`${FUNCTIONS_URL}/${functionName}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ to: formatPhoneNumber(phone), message: body }),
    })
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Send WhatsApp message error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    }
  }
}

export function formatPhoneNumber(phone: string): string {
  let formatted = phone.replace(/[^0-9+]/g, '')
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted
  }
  return formatted
}

export function isValidPhoneNumber(phone: string): boolean {
  const formatted = phone.replace(/[^0-9]/g, '')
  return formatted.length >= 10 && formatted.length <= 15
}
