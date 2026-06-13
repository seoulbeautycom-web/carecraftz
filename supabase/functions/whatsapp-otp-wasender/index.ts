// WhatsApp OTP using WASenderAPI
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// In-memory OTP store (use Redis in production)
const otpStore = new Map<string, { code: string; expires: number; attempts: number }>()

// Max attempts and expiry
const MAX_ATTEMPTS = 3
const OTP_EXPIRY_MINUTES = 10

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, phone, code } = await req.json()

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Format phone
    const formattedPhone = phone.replace(/\s/g, '')

    if (action === 'send') {
      // Check if too many attempts
      const existing = otpStore.get(formattedPhone)
      if (existing && existing.attempts >= MAX_ATTEMPTS) {
        return new Response(
          JSON.stringify({ success: false, error: 'Too many attempts. Please try again later.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        )
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      
      // Store OTP
      otpStore.set(formattedPhone, {
        code: otp,
        expires: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
        attempts: existing ? existing.attempts + 1 : 0
      })

      // Send via WASenderAPI
      const apiKey = Deno.env.get('WASENDER_API_KEY')
      const apiUrl = Deno.env.get('WASENDER_API_URL') || 'https://api.wasenderapi.com'

      if (!apiKey) {
        // For testing - return success without sending
        console.log('WASENDER_API_KEY not set. OTP for', formattedPhone, ':', otp)
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'OTP generated (WASender not configured)',
            testOtp: otp // Remove in production
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const message = `🔐 *CareCraftz Verification*\n\nYour verification code is: *${otp}*\n\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes.\n\nIf you didn't request this, please ignore.`

      const response = await fetch(`${apiUrl}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          api_key: apiKey,
          to: formattedPhone.replace(/\+/g, ''), // Remove + for WASender
          message: message,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`WASenderAPI error: ${errorText}`)
      }

      const result = await response.json()

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent via WhatsApp',
          messageId: result.message_id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'verify') {
      const stored = otpStore.get(formattedPhone)

      if (!stored) {
        return new Response(
          JSON.stringify({ success: false, error: 'No OTP found. Please request a new code.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      if (Date.now() > stored.expires) {
        otpStore.delete(formattedPhone)
        return new Response(
          JSON.stringify({ success: false, error: 'OTP has expired. Please request a new code.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      if (stored.code !== code) {
        // Increment attempts on failure
        stored.attempts++
        otpStore.set(formattedPhone, stored)

        const remainingAttempts = MAX_ATTEMPTS - stored.attempts
        if (remainingAttempts <= 0) {
          otpStore.delete(formattedPhone)
          return new Response(
            JSON.stringify({ success: false, error: 'Too many failed attempts. Please request a new code.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Invalid OTP. ${remainingAttempts} attempts remaining.` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // OTP verified - clean up
      otpStore.delete(formattedPhone)

      // Generate a user ID (in production, create actual user in DB)
      const userId = `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Phone verified successfully',
          userId: userId,
          phone: formattedPhone
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action. Use "send" or "verify".' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('WhatsApp OTP error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
