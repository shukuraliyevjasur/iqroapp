export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getParentSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase/server';
import { PaymentList } from './PaymentList';

export default async function OtaOnaTolovlarPage() {
  const session = await getParentSession();
  if (!session) redirect('/kirish?role=parent');

  const db = createServerClient();
  const { data: parent } = await db.from('parents').select('student_id').eq('id', session.id).single();
  if (!parent?.student_id) redirect('/ota-ona/bosh');

  const { data: payments } = await db
    .from('payments')
    .select('month_label, amount_uzs, status, due_date, paid_date, payment_method')
    .eq('student_id', parent.student_id)
    .order('due_date', { ascending: false });

  return <PaymentList payments={payments ?? []} />;
}
