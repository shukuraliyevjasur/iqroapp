import type { SupabaseClient } from '@supabase/supabase-js';

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

// Returns validated session, or null if invalid or rate-limited.
// Caller must redirect on null.
// db and ip must be provided by the caller (Server Component context).
export async function validateSession(
  session: { id: number; name: string } | null,
  db: SupabaseClient,
  ip: string,
  table: string,
  role: string,
): Promise<{ id: number; name: string } | null> {
  if (!session || typeof session.id !== 'number' || session.id <= 0) return null;

  const entityKey = `${role}:${session.id}`;
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const [{ count: ipCount }, { count: entityCount }] = await Promise.all([
    db.from('login_attempts').select('*', { count: 'exact', head: true })
      .eq('ip', ip).eq('role', role).gte('failed_at', windowStart),
    db.from('login_attempts').select('*', { count: 'exact', head: true })
      .eq('access_code', entityKey).eq('role', role).gte('failed_at', windowStart),
  ]);

  if ((ipCount ?? 0) >= MAX_ATTEMPTS || (entityCount ?? 0) >= MAX_ATTEMPTS) return null;

  const { data, error } = await db.from(table).select('id').eq('id', session.id).single();

  if (error || !data) {
    await db.from('login_attempts').insert({ ip, role, access_code: entityKey });
    return null;
  }

  return session;
}
