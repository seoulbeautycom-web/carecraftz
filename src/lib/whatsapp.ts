import { supabase } from './supabase'

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'
const USE_WASENDER = true // Set to true to use WASenderAPI

export async function sendWhatsAppOTP(phone: string): Promise<{ success: boolean; error?: string; testOtp?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    const functionName = USE_WASENDER ? 'whatsapp-otp-wasender' : 'whatsapp-otp'
    
    const response = await fetch(`${FUNCTIONS_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({ action: 'send', phone }),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Send WhatsApp OTP error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send OTP' 
    }
  }
}

export async function verifyWhatsAppOTP(phone: string, code: string): Promise<{ 
  success: boolean; 
  error?: string;
  userId?: string 
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    const functionName = USE_WASENDER ? 'whatsapp-otp-wasender' : 'whatsapp-otp'
    
    const response = await fetch(`${FUNCTIONS_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({ action: 'verify', phone, code }),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Verify WhatsApp OTP error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to verify OTP' 
    }
  }
}

export async function sendWhatsAppMessage(phone: string, body: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    const functionName = USE_WASENDER ? 'whatsapp-wasender' : 'whatsapp'
    
    const response = await fetch(`${FUNCTIONS_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({ to: phone, message: body }),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Send WhatsApp message error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send message' 
    }
  }
}

// Helper to format phone numbers
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let formatted = phone.replace(/[^0-9+]/g, '')
  
  // Ensure it starts with +
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted
  }
  
  return formatted
}

// Validate phone number (basic check)
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = phone.replace(/[^0-9]/g, '')
  return formatted.length >= 10 && formatted.length <= 15
}
