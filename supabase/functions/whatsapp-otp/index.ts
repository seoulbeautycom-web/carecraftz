import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Store OTPs temporarily (in production, use Redis or DB)
const otpStore = new Map<string, { code: string; expires: number }>()

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { action, phone, code } = await req.json()

    if (action === 'send') {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      
      // Store with 10-minute expiry
      otpStore.set(phone, { code: otp, expires: Date.now() + 10 * 60 * 1000 })

      // Send via WhatsApp
      const message = `*CareCraftz* 🔐\n\nYour verification code is: *${otp}*\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this message.`
      
      const whatsappResult = await sendWhatsAppMessage(phone, message)

      return new Response(
        JSON.stringify({ 
          success: whatsappResult.success,
          message: whatsappResult.success ? 'OTP sent via WhatsApp' : 'Failed to send OTP'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'verify') {
      const stored = otpStore.get(phone)
      
      if (!stored) {
        return new Response(
          JSON.stringify({ success: false, error: 'No OTP found. Please request a new code.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      if (Date.now() > stored.expires) {
        otpStore.delete(phone)
        return new Response(
          JSON.stringify({ success: false, error: 'OTP has expired. Please request a new code.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      if (stored.code !== code) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid OTP. Please try again.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // OTP verified - clean up
      otpStore.delete(phone)

      // Create or update user in Supabase Auth
      // Format phone for Supabase (with +)
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`
      
      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users.find(u => u.phone === formattedPhone)

      let userId
      if (!existingUser) {
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          phone: formattedPhone,
          phone_confirm: true,
          user_metadata: { phone_verified: true }
        })
        
        if (createError) throw createError
        userId = newUser.user.id
      } else {
        userId = existingUser.id
      }

      // Create session
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.createUser({
        phone: formattedPhone,
        phone_confirm: true,
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Phone verified successfully',
          userId: userId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
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

async function sendWhatsAppMessage(phone: string, body: string): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedPhone = phone.replace(/\+/g, '').replace(/\s/g, '')
    
    // Try 360dialog first
    const apiKey = Deno.env.get('D360_API_KEY')
    if (apiKey) {
      const response = await fetch('https://waba.360dialog.io/v1/messages', {
        method: 'POST',
        headers: {
          'D360-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: { body }
        }),
      })

      if (response.ok) return { success: true }
    }

    // Try CallMeBot (free for testing)
    const callmebotKey = Deno.env.get('CALLMEBOT_API_KEY')
    if (callmebotKey) {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=${encodeURIComponent(body)}&apikey=${callmebotKey}`
      const response = await fetch(url)
      
      if (response.ok) {
        const text = await response.text()
        if (text.includes('success') || text.includes('sent')) {
          return { success: true }
        }
      }
    }

    // Log for debugging if no provider configured
    console.log('No WhatsApp provider configured. OTP would be:', body)
    return { success: false, error: 'No WhatsApp provider configured' }

  } catch (error) {
    console.error('Send WhatsApp error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Send failed' }
  }
}
