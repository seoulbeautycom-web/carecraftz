// WhatsApp OTP via WASenderAPI — persists codes in DB and returns a real Supabase session token.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const MAX_ATTEMPTS = 5
const OTP_EXPIRY_MINUTES = 10

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function digitsOnly(phone: string) {
  return phone.replace(/[^\d]/g, '')
}

function formatE164(phone: string) {
  const digits = digitsOnly(phone)
  return digits ? `+${digits}` : ''
}

function syntheticEmail(phone: string) {
  return `wa_${digitsOnly(phone)}@phone.carecraftz.auth`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase service credentials are not configured')
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { action, phone, code } = await req.json()
    if (!phone) {
      return new Response(JSON.stringify({ success: false, error: 'Phone number is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const formattedPhone = formatE164(phone)
    if (digitsOnly(formattedPhone).length < 10) {
      return new Response(JSON.stringify({ success: false, error: 'Enter a valid phone number with country code' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (action === 'send') {
      const { data: existing } = await admin
        .from('whatsapp_otp_codes')
        .select('attempts, expires_at')
        .eq('phone', formattedPhone)
        .maybeSingle()

      if (existing && Number(existing.attempts) >= MAX_ATTEMPTS && new Date(existing.expires_at).getTime() > Date.now()) {
        return new Response(
          JSON.stringify({ success: false, error: 'Too many attempts. Please try again later.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 },
        )
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()
      const nextAttempts = existing && new Date(existing.expires_at).getTime() > Date.now()
        ? Number(existing.attempts) + 1
        : 1

      const { error: upsertError } = await admin.from('whatsapp_otp_codes').upsert({
        phone: formattedPhone,
        code: otp,
        attempts: nextAttempts,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      })
      if (upsertError) throw upsertError

      const apiKey = Deno.env.get('WASENDER_API_KEY')
      const apiUrl = Deno.env.get('WASENDER_API_URL') || 'https://api.wasenderapi.com'
      const payload: Record<string, unknown> = {
        success: true,
        message: 'OTP sent via WhatsApp',
      }

      if (!apiKey) {
        console.log('WASENDER_API_KEY not set. OTP for', formattedPhone, ':', otp)
        payload.message = 'OTP generated (WASender not configured)'
        if (Deno.env.get('ALLOW_TEST_OTP') === 'true') {
          payload.testOtp = otp
        }
      } else {
        const message =
          `CareCraftz verification code: ${otp}\n\nExpires in ${OTP_EXPIRY_MINUTES} minutes. If you did not request this, ignore this message.`
        const response = await fetch(`${apiUrl}/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            api_key: apiKey,
            to: digitsOnly(formattedPhone),
            message,
          }),
        })
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`WASenderAPI error: ${errorText}`)
        }
        const result = await response.json()
        payload.messageId = result.message_id
      }

      return new Response(JSON.stringify(payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'verify') {
      if (!code) {
        return new Response(JSON.stringify({ success: false, error: 'Verification code is required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      const { data: stored, error: readError } = await admin
        .from('whatsapp_otp_codes')
        .select('*')
        .eq('phone', formattedPhone)
        .maybeSingle()
      if (readError) throw readError

      if (!stored) {
        return new Response(
          JSON.stringify({ success: false, error: 'No OTP found. Please request a new code.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        )
      }

      if (new Date(stored.expires_at).getTime() < Date.now()) {
        await admin.from('whatsapp_otp_codes').delete().eq('phone', formattedPhone)
        return new Response(
          JSON.stringify({ success: false, error: 'OTP has expired. Please request a new code.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        )
      }

      if (String(stored.code) !== String(code).trim()) {
        const attempts = Number(stored.attempts || 0) + 1
        if (attempts >= MAX_ATTEMPTS) {
          await admin.from('whatsapp_otp_codes').delete().eq('phone', formattedPhone)
          return new Response(
            JSON.stringify({ success: false, error: 'Too many failed attempts. Please request a new code.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
          )
        }
        await admin.from('whatsapp_otp_codes').update({ attempts }).eq('phone', formattedPhone)
        return new Response(
          JSON.stringify({
            success: false,
            error: `Invalid OTP. ${MAX_ATTEMPTS - attempts} attempts remaining.`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        )
      }

      await admin.from('whatsapp_otp_codes').delete().eq('phone', formattedPhone)

      const email = syntheticEmail(formattedPhone)

      // Ensure auth user exists for this WhatsApp number.
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        phone: formattedPhone,
        phone_confirm: true,
        user_metadata: {
          phone: formattedPhone,
          auth_via: 'whatsapp',
          full_name: '',
        },
      })

      let userId = created.user?.id
      if (createError) {
        const msg = (createError.message || '').toLowerCase()
        if (!msg.includes('already') && !msg.includes('registered') && !msg.includes('exists')) {
          throw createError
        }
        const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
        if (listError) throw listError
        const found = listed.users.find(
          (u) =>
            u.email === email ||
            u.phone === formattedPhone ||
            u.user_metadata?.phone === formattedPhone,
        )
        if (!found) throw createError
        userId = found.id
        await admin.auth.admin.updateUserById(found.id, {
          phone: formattedPhone,
          phone_confirm: true,
          user_metadata: {
            ...(found.user_metadata || {}),
            phone: formattedPhone,
            auth_via: 'whatsapp',
          },
        })
      }

      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })
      if (linkError) throw linkError

      const tokenHash = linkData.properties?.hashed_token
      if (!tokenHash) {
        throw new Error('Could not create a login session for this phone number')
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Phone verified successfully',
          userId,
          phone: formattedPhone,
          email,
          token_hash: tokenHash,
          type: 'email',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action. Use "send" or "verify".' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  } catch (error) {
    console.error('WhatsApp OTP error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
