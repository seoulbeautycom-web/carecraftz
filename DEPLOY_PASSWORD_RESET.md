# Deploy Password Reset Edge Function

To deploy the password reset functionality, you need to deploy the Supabase Edge Function.

## Prerequisites
- Install Supabase CLI: `npm install -g supabase`
- Login to Supabase: `supabase login`

## Deploy the Function

1. Navigate to the functions directory:
```bash
cd supabase/functions/reset-password
```

2. Deploy the function:
```bash
supabase functions deploy reset-password
```

3. Set the required environment variables in Supabase Dashboard:
   - Go to Edge Functions > reset-password
   - Add environment variables:
     - `SUPABASE_URL`: https://dhrtrycpdoraurdmauhd.supabase.co
     - `SUPABASE_SERVICE_ROLE_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRocnRyeWNwZG9yYXVyZG1hdWhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY1Nzg5OSwiZXhwIjoyMDk2MjMzODk5fQ.TKXv1ZM7g3Kh6v_ISqV99PQNuJcBlUXfrrzOk-C-yVc

## Alternative: Deploy via Supabase Dashboard

1. Go to Supabase Dashboard > Edge Functions
2. Click "New Function"
3. Name it: `reset-password`
4. Paste the code from `supabase/functions/reset-password/index.ts`
5. Add the environment variables mentioned above
6. Click "Deploy"

After deployment, the password reset will work directly from the UI.
