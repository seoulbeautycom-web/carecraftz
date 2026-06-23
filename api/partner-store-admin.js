import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env.SUPABASE_URL?.trim() ||
  process.env.VITE_SUPABASE_URL?.trim() ||
  'https://rbxiureeqjywsabxrckv.supabase.co'

const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY?.trim() ||
  process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJieGl1cmVlcWp5d3NhYnhyY2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyOTI2NDQsImV4cCI6MjA5Njg2ODY0NH0.A5r7LGaW4hRC8tehBXftD27exfSlv2MZR_Ls7gbWqcI'

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

function setSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS')
}

function sendJson(res, statusCode, payload) {
  setSecurityHeaders(res)
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
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

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeText(value) {
  return String(value ?? '').trim()
}

function createAuthedClient(authorizationHeader) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: authorizationHeader,
      },
    },
  })
}

function createServiceClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.')
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

function isNotFoundError(error) {
  const message = normalizeText(error?.message).toLowerCase()
  return message.includes('user not found') || message.includes('not found') || message.includes('404')
}

async function authorizeRequest(req) {
  const authorizationHeader = normalizeText(req.headers.authorization)
  if (!authorizationHeader) {
    return { error: { statusCode: 401, message: 'Authorization header is required.' } }
  }

  const userClient = createAuthedClient(authorizationHeader)
  const [{ data: userData, error: userError }, { data: accessSnapshot, error: accessError }] = await Promise.all([
    userClient.auth.getUser(),
    userClient.rpc('current_admin_access_snapshot'),
  ])

  if (userError || !userData?.user) {
    return { error: { statusCode: 401, message: 'Unable to verify the current session.' } }
  }

  if (accessError || !accessSnapshot?.is_authorized) {
    return {
      error: {
        statusCode: 403,
        message: 'You need partners.provision, partners.manage, or roles.manage access to manage partner store master admins.',
      },
    }
  }

  const permissions = Array.isArray(accessSnapshot?.permissions) ? accessSnapshot.permissions : []
  const hasPermission = permissions.some((permission) =>
    ['partners.provision', 'partners.manage', 'roles.manage'].includes(String(permission)),
  )

  if (!hasPermission) {
    return {
      error: {
        statusCode: 403,
        message: 'You need partners.provision, partners.manage, or roles.manage access to manage partner store master admins.',
      },
    }
  }

  return {
    user: userData.user,
    accessSnapshot,
    userClient,
  }
}

async function syncMasterAdmin(body, req) {
  const authorization = await authorizeRequest(req)
  if (authorization.error) {
    return authorization.error
  }

  const adminClient = createServiceClient()
  const storeId = normalizeText(body?.storeId)
  const requestedEmail = normalizeEmail(body?.masterAdminEmail)
  const requestedPassword = normalizeText(body?.masterAdminPassword)

  if (!storeId) {
    return { statusCode: 400, message: 'storeId is required.' }
  }

  const { data: storeRow, error: storeError } = await adminClient
    .from('partner_stores')
    .select('id, slug, display_name, master_admin_email, master_admin_user_id')
    .eq('id', storeId)
    .maybeSingle()

  if (storeError) {
    return { statusCode: 500, message: storeError.message || 'Failed to load the partner store.' }
  }

  if (!storeRow?.id) {
    return { statusCode: 404, message: 'Partner store not found.' }
  }

  const currentEmail = normalizeEmail(storeRow.master_admin_email)
  const resolvedEmail = requestedEmail || currentEmail
  const currentUserId = normalizeText(storeRow.master_admin_user_id)

  if (!resolvedEmail) {
    return { statusCode: 400, message: 'A master admin email is required.' }
  }

  let resolvedUserId = currentUserId || ''
  let previousUserId = currentUserId || ''
  let userCreatedThisRequest = false

  if (resolvedUserId) {
    const { data: existingUserData, error: existingUserError } = await adminClient.auth.admin.getUserById(resolvedUserId)

    if (existingUserError || !existingUserData?.user) {
      resolvedUserId = ''
    }
  }

  if (resolvedUserId) {
    const updatePayload = {
      email: resolvedEmail,
      email_confirm: true,
      ...(requestedPassword ? { password: requestedPassword } : {}),
    }

    const { data: updatedUserData, error: updateUserError } = await adminClient.auth.admin.updateUserById(resolvedUserId, updatePayload)

    if (updateUserError || !updatedUserData?.user) {
      return {
        statusCode: 500,
        message: updateUserError?.message || 'Failed to update the master admin account.',
      }
    }

    resolvedUserId = updatedUserData.user.id
  } else {
    if (!requestedPassword) {
      return { statusCode: 400, message: 'A master admin password is required when creating a new account.' }
    }

    const { data: createdUserData, error: createUserError } = await adminClient.auth.admin.createUser({
      email: resolvedEmail,
      password: requestedPassword,
      email_confirm: true,
    })

    if (createUserError || !createdUserData?.user) {
      return {
        statusCode: 500,
        message: createUserError?.message || 'Failed to create the master admin account.',
      }
    }

    resolvedUserId = createdUserData.user.id
    userCreatedThisRequest = true
  }

  const { data: storeOwnerRole, error: roleError } = await adminClient
    .from('partner_roles')
    .select('id')
    .eq('code', 'store_owner')
    .maybeSingle()

  if (roleError || !storeOwnerRole?.id) {
    if (userCreatedThisRequest && resolvedUserId) {
      await adminClient.auth.admin.deleteUser(resolvedUserId).catch(() => undefined)
    }

    return {
      statusCode: 500,
      message: roleError?.message || 'Unable to resolve the store owner role.',
    }
  }

  const { data: existingConflict, error: conflictError } = await adminClient
    .from('partner_members')
    .select('id, user_id, email')
    .eq('partner_store_id', storeId)
    .eq('email', resolvedEmail)

  if (conflictError) {
    if (userCreatedThisRequest && resolvedUserId) {
      await adminClient.auth.admin.deleteUser(resolvedUserId).catch(() => undefined)
    }

    return {
      statusCode: 500,
      message: conflictError.message || 'Unable to check for an existing master admin membership.',
    }
  }

  const conflictingMembership = (existingConflict ?? []).find((memberRow) => normalizeText(memberRow.user_id) !== resolvedUserId)
  if (conflictingMembership) {
    if (userCreatedThisRequest && resolvedUserId) {
      await adminClient.auth.admin.deleteUser(resolvedUserId).catch(() => undefined)
    }

    return {
      statusCode: 409,
      message: 'Another partner member already uses that email for this store.',
    }
  }

  const { data: memberData, error: memberError } = await adminClient
    .from('partner_members')
    .upsert(
      {
        partner_store_id: storeId,
        user_id: resolvedUserId,
        email: resolvedEmail,
        full_name: '',
        status: 'active',
        invited_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'partner_store_id,user_id',
      },
    )
    .select('id, partner_store_id, user_id, email')
    .maybeSingle()

  if (memberError || !memberData?.id) {
    if (userCreatedThisRequest && resolvedUserId) {
      await adminClient.auth.admin.deleteUser(resolvedUserId).catch(() => undefined)
    }

    return {
      statusCode: 500,
      message: memberError?.message || 'Failed to create the partner store membership.',
    }
  }

  const { error: roleLinkError } = await adminClient.from('partner_member_roles').upsert(
    {
      partner_member_id: memberData.id,
      partner_role_id: storeOwnerRole.id,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'partner_member_id,partner_role_id',
    },
  )

  if (roleLinkError) {
    if (userCreatedThisRequest && resolvedUserId) {
      await adminClient.auth.admin.deleteUser(resolvedUserId).catch(() => undefined)
    }

    return {
      statusCode: 500,
      message: roleLinkError.message || 'Failed to assign the store owner role.',
    }
  }

  const { error: storeUpdateError } = await adminClient
    .from('partner_stores')
    .update({
      master_admin_email: resolvedEmail,
      master_admin_user_id: resolvedUserId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', storeId)

  if (storeUpdateError) {
    if (userCreatedThisRequest && resolvedUserId) {
      await adminClient.auth.admin.deleteUser(resolvedUserId).catch(() => undefined)
    }

    return {
      statusCode: 500,
      message: storeUpdateError.message || 'Failed to save the master admin metadata.',
    }
  }

  if (previousUserId && previousUserId !== resolvedUserId) {
    await adminClient.auth.admin.deleteUser(previousUserId).catch((error) => {
      if (!isNotFoundError(error)) {
        console.warn('[partner-store-admin] Failed to delete previous master admin user:', error)
      }
    })
  }

  return {
    statusCode: 200,
    payload: {
      ok: true,
      storeId,
      master_admin_email: resolvedEmail,
      master_admin_user_id: resolvedUserId,
      partner_member_id: memberData.id,
      partner_store_slug: storeRow.slug,
    },
  }
}

async function deleteMasterAdmin(body, req) {
  const authorization = await authorizeRequest(req)
  if (authorization.error) {
    return authorization.error
  }

  const adminClient = createServiceClient()
  const storeId = normalizeText(body?.storeId)

  if (!storeId) {
    return { statusCode: 400, message: 'storeId is required.' }
  }

  const { data: storeRow, error: storeError } = await adminClient
    .from('partner_stores')
    .select('id, slug, master_admin_user_id')
    .eq('id', storeId)
    .maybeSingle()

  if (storeError) {
    return { statusCode: 500, message: storeError.message || 'Failed to load the partner store.' }
  }

  if (!storeRow?.id) {
    return { statusCode: 404, message: 'Partner store not found.' }
  }

  const masterAdminUserId = normalizeText(storeRow.master_admin_user_id)
  if (masterAdminUserId) {
    await adminClient.auth.admin.deleteUser(masterAdminUserId).catch((error) => {
      if (!isNotFoundError(error)) {
        console.warn('[partner-store-admin] Failed to delete master admin user:', error)
        throw error
      }
    })
  }

  return {
    statusCode: 200,
    payload: {
      ok: true,
      storeId,
      partner_store_slug: storeRow.slug,
    },
  }
}

export default async function handler(req, res) {
  setSecurityHeaders(res)

  if ((req.method || 'GET').toUpperCase() === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return sendJson(res, 500, {
      ok: false,
      error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.',
    })
  }

  const method = (req.method || 'GET').toUpperCase()
  const url = getRequestUrl(req)
  const rawBody = await readRequestBody(req)
  const body = normalizeBody(rawBody)

  try {
    if (method === 'POST') {
      const action = normalizeText(body?.action || url.searchParams.get('action') || 'sync').toLowerCase()

      if (action !== 'sync') {
        return sendJson(res, 400, {
          ok: false,
          error: `Unsupported action: ${action}`,
        })
      }

      const result = await syncMasterAdmin(body, req)
      if (result.statusCode !== 200) {
        return sendJson(res, result.statusCode, {
          ok: false,
          error: result.message,
        })
      }

      return sendJson(res, result.statusCode, result.payload)
    }

    if (method === 'DELETE') {
      const result = await deleteMasterAdmin(body, req)
      if (result.statusCode !== 200) {
        return sendJson(res, result.statusCode, {
          ok: false,
          error: result.message,
        })
      }

      return sendJson(res, result.statusCode, result.payload)
    }

    res.setHeader('Allow', 'POST, DELETE, OPTIONS')
    return sendJson(res, 405, {
      ok: false,
      error: 'Method not allowed.',
    })
  } catch (error) {
    console.error('[partner-store-admin]', error)
    return sendJson(res, 500, {
      ok: false,
      error: error instanceof Error && error.message ? error.message : 'Unexpected partner store admin error.',
    })
  }
}
