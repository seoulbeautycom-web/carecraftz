// WASenderAPI Integration for WhatsApp
// Documentation: https://wasenderapi.com/docs

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface WASenderConfig {
  apiKey: string
  apiUrl: string // e.g., https://api.wasenderapi.com
}

interface SendMessageRequest {
  to: string
  message: string
  type?: 'text' | 'image' | 'document'
  mediaUrl?: string
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
    const { to, message, type = 'text', mediaUrl }: SendMessageRequest = await req.json()

    // Get WASenderAPI credentials from environment
    const apiKey = Deno.env.get('WASENDER_API_KEY')
    const apiUrl = Deno.env.get('WASENDER_API_URL') || 'https://api.wasenderapi.com'

    if (!apiKey) {
      throw new Error('WASENDER_API_KEY not configured')
    }

    // Format phone number (remove + and spaces)
    const formattedPhone = to.replace(/\+/g, '').replace(/\s/g, '')

    // Build request based on WASenderAPI format
    // Note: Adjust these fields based on actual WASenderAPI documentation
    const payload: Record<string, any> = {
      api_key: apiKey,
      to: formattedPhone,
      message: message,
    }

    if (type === 'image' && mediaUrl) {
      payload.type = 'image'
      payload.image_url = mediaUrl
    } else if (type === 'document' && mediaUrl) {
      payload.type = 'document'
      payload.document_url = mediaUrl
    }

    // Send request to WASenderAPI
    const response = await fetch(`${apiUrl}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`WASenderAPI error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.message_id || result.id,
        result 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('WASenderAPI error:', error)
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
