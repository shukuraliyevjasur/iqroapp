'use client';

import { createClient } from '@supabase/supabase-js';

// Browser-side — anon key only, for reading non-sensitive public data
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
