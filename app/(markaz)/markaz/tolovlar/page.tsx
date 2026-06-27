export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase/server';
import { TolovlarClient } from './TolovlarClient';

export default async function TolovlarPage() {
  const db = createServerClient();
  const [paymentsRes, studentsRes] = await Promise.all([
    db.from('payments')
      .select('id, student_id, amount_uzs, month_label, due_date, paid_date, status, payment_method, notes, students(full_name)')
      .order('due_date', { ascending: false }),
    db.from('students').select('id, full_name').eq('status', 'active').order('full_name'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payments = (paymentsRes.data ?? []) as any[];
  const students = studentsRes.data ?? [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">IQRO</p>
        <h1 className="text-2xl font-bold text-[#1C1C2E]">To&apos;lovlar</h1>
      </div>
      <TolovlarClient payments={payments} students={students} />
    </div>
  );
}
