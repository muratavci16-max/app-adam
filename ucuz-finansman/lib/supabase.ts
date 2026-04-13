import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

type BrowserClient = ReturnType<typeof createBrowserClient>

// Lazy initialization — createBrowserClient throws at module-load time if env vars
// are undefined (e.g. during Netlify build). Proxy defers creation to first use.
let _client: BrowserClient | null = null

function getBrowserClient(): BrowserClient {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = new Proxy({} as BrowserClient, {
  get(_target, prop: string | symbol) {
    return getBrowserClient()[prop as keyof BrowserClient]
  },
})

// Server-side admin client (API routes, server actions)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
