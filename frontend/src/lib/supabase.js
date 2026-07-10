import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gajzwhcganofechgnlpm.supabase.co';
// Anon/public key is safe to expose in frontend (row-level security handles permissions)
// Using the publishable key from the backend env
const SUPABASE_ANON_KEY = 'sb_publishable_YwC9nO20pLraRGVUfsKR3Q_-aRnqvFQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
