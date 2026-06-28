export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase/server';
import { OqituvchilarClient } from './OqituvchilarClient';

export default async function OqituvchilarPage() {
  const db = createServerClient();
  const today = new Date().toISOString().split('T')[0];

  const [teachersRes, groupsRes, assignmentsRes, coverageRes] = await Promise.all([
    db.from('teachers').select('id, full_name, created_at').order('full_name'),
    db.from('groups').select('id, name').eq('status', 'active').order('name'),
    db.from('teacher_groups').select('teacher_id, group_id'),
    db.from('lesson_coverage')
      .select('id, group_id, teacher_id, date')
      .gte('date', today)
      .order('date'),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">IQRO</p>
        <h1 className="text-2xl font-bold text-[#1C1C2E]">O&apos;qituvchilar</h1>
      </div>
      <OqituvchilarClient
        teachers={(teachersRes.data ?? []) as { id: number; full_name: string; created_at: string }[]}
        groups={(groupsRes.data ?? []) as { id: number; name: string }[]}
        assignments={(assignmentsRes.data ?? []) as { teacher_id: number; group_id: number }[]}
        coverage={(coverageRes.data ?? []) as { id: number; group_id: number; teacher_id: number; date: string }[]}
      />
    </div>
  );
}
