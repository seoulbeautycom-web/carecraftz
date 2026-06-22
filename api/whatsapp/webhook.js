const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim()

function setSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('X-Content-Type-Options', 'nosniff')
}

function sendJson(res, statusCode, payload) {
  setSecurityHeaders(res)
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function sendText(res, statusCode, text) {
  setSecurityHeaders(res)
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end(text)
}

function getRequestUrl(req) {
  return new URL(req.url || '/', 'http://localhost')
}

function readRequestBody(req) {
  if (req.body !== undefined) {
    return Promise.resolve(req.body)
  }

  return new Promise((resolve, reject) => {
    const chunks = []

    req.on('data', (chunk) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    })

    req.on('end', () => {
      if (chunks.length === 0) {
        resolve('')
        return
      }

      resolve(Buffer.concat(chunks).toString('utf8'))
    })

    req.on('error', reject)
  })
}

function normalizeBody(rawBody) {
  if (rawBody === null || rawBody === undefined) {
    return null
  }

  if (typeof rawBody === 'string') {
    const trimmed = rawBody.trim()
    if (!trimmed) {
      return ''
    }

    try {
      return JSON.parse(trimmed)
    } catch {
      return rawBody
    }
  }

  if (Buffer.isBuffer(rawBody)) {
    const text = rawBody.toString('utf8')
    const trimmed = text.trim()

    if (!trimmed) {
      return ''
    }

    try {
      return JSON.parse(trimmed)
    } catch {
      return text
    }
  }

  return rawBody
}

function getQueryValue(url, key) {
  const value = url.searchParams.get(key)
  return value === null ? undefined : value
}

export default async function handler(req, res) {
  const method = (req.method || 'GET').toUpperCase()
  const url = getRequestUrl(req)

  if (method === 'GET') {
    const challenge = getQueryValue(url, 'hub.challenge') ?? getQueryValue(url, 'challenge')
    const verifyToken = getQueryValue(url, 'hub.verify_token') ?? getQueryValue(url, 'verify_token')

    if (challenge !== undefined) {
      if (VERIFY_TOKEN && verifyToken !== VERIFY_TOKEN) {
        return sendText(res, 403, 'Invalid webhook verification token.')
      }

      return sendText(res, 200, challenge)
    }

    return sendJson(res, 200, {
      ok: true,
      message: 'WhatsApp webhook is live.',
    })
  }

  if (method === 'POST') {
    const rawBody = await readRequestBody(req)
    const payload = normalizeBody(rawBody)

    console.log('[whatsapp-webhook]', {
      path: url.pathname,
      method,
      receivedAt: new Date().toISOString(),
      payload,
    })

    return sendJson(res, 200, {
      ok: true,
    })
  }

  res.setHeader('Allow', 'GET, POST')
  return sendJson(res, 405, {
    ok: false,
    message: 'Method not allowed.',
  })
}
