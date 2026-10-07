import { createClient } from '@supabase/supabase-js';

// Public browser-only Supabase credentials for the LINK CONTROL CENTRAL project.
// Access to LINK WORLD tables is restricted by Supabase Auth + Row Level Security.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zgbnjlrxzvzpigmwidsp.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_RE_eqhBaLeaUMHuBjLUY2Q_OZNBm9_A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
