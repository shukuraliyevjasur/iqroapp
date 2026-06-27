export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase/server';
import { ImtihonlarClient } from './ImtihonlarClient';

export default async function ImtihonlarPage({ searchParams }: { searchParams: Promise<{ exam?: string }> }) {
  const params = await searchParams;
  const db = createServerClient();

  const [examsRes, groupsRes] = await Promise.all([
    db.from('exams').select('id, title, exam_date, max_score, group_id, groups(name)').order('exam_date', { ascending: false }),
    db.from('groups').select('id, name').eq('status', 'active').order('name'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exams = (examsRes.data ?? []) as any[];
  const groups = groupsRes.data ?? [];

  const selectedExamId = params.exam ? Number(params.exam) : null;
  let examStudents: { id: number; full_name: string }[] = [];
  let examResults: Record<number, { score: number | null; notes: string | null }> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let selectedExam: any = null;

  if (selectedExamId) {
    selectedExam = exams.find((e: any) => e.id === selectedExamId) ?? null;
    if (selectedExam) {
      const [{ data: students }, { data: results }] = await Promise.all([
        db.from('students').select('id, full_name').eq('group_id', selectedExam.group_id).eq('status', 'active').order('full_name'),
        db.from('exam_results').select('student_id, score, notes').eq('exam_id', selectedExamId),
      ]);
      examStudents = students ?? [];
      for (const r of results ?? []) examResults[r.student_id] = { score: r.score, notes: r.notes };
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">IQRO</p>
        <h1 className="text-2xl font-bold text-[#1C1C2E]">Imtihonlar</h1>
      </div>
      <ImtihonlarClient
        exams={exams} groups={groups}
        selectedExamId={selectedExamId} selectedExam={selectedExam}
        examStudents={examStudents} examResults={examResults}
      />
    </div>
  );
}
