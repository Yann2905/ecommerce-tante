import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Utiliser createBrowserClient permet de synchroniser automatiquement les cookies
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)