import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client for browser-side authentication (with proper cookie handling)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Separate client for admin operations (server-side only)
export const getServiceSupabase = () => {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')
    }
    return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
}
