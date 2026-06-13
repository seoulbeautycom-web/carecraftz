import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// WhatsApp Business API via Meta (official)
// Alternative: Can use 360dialog, MessageBird, or other providers

interface WhatsAppMessage {
  to: string
  body: string
  type?: 'text' | 'template'
  templateName?: string
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, body, type = 'text', templateName }: WhatsAppMessage = await req.json()

    // Get credentials from environment
    const whatsappApiKey = Deno.env.get('WHATSAPP_API_KEY') // or WHATSAPP_BUSINESS_TOKEN
    const whatsappPhoneId = Deno.env.get('WHATSAPP_PHONE_ID')
    const whatsappBusinessId = Deno.env.get('WHATSAPP_BUSINESS_ID')

    // Format phone number (remove + and spaces)
    const formattedPhone = to.replace(/\+/g, '').replace(/\s/g, '')

    let response

    // Option 1: Using Meta WhatsApp Business API (official)
    if (whatsappPhoneId && whatsappApiKey) {
      const url = `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`
      
      const messagePayload = type === 'template' && templateName
        ? {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'en' }
            }
          }
        : {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'text',
            text: { body }
          }

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      })
    }
    // Option 2: Using 360dialog (simpler alternative)
    else if (whatsappApiKey && !whatsappPhoneId) {
      const url = 'https://waba.360dialog.io/v1/messages'
      
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'D360-API-KEY': whatsappApiKey,
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
    }
    // Option 3: Using CallMeBot (free, simple - for testing only)
    else {
      const apiKey = Deno.env.get('CALLMEBOT_API_KEY')
      if (!apiKey) {
        throw new Error('No WhatsApp provider configured')
      }
      
      // CallMeBot - simple free API for testing
      const url = `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=${encodeURIComponent(body)}&apikey=${apiKey}`
      
      response = await fetch(url)
    }

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`WhatsApp API error: ${error}`)
    }

    const result = await response.json().catch(() => ({ success: true }))

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('WhatsApp send error:', error)
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

// Usage examples:
// Send OTP: { "to": "+971501234567", "body": "Your CareCraftz verification code is: 123456" }
// Send Order Update: { "to": "+971501234567", "body": "Your order #12345 has been shipped! Track: https://..." }
