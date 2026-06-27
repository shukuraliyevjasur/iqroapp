export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getStudentSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase/server';
import { StudentDashboard } from './StudentDashboard';

export default async function TalabaBoshPage() {
  const session = await getStudentSession();
  if (!session) redirect('/kirish?role=student');

  const db = createServerClient();
  const { data: student } = await db
    .from('students')
    .select('id, full_name, group_id, groups(name, schedule_days, schedule_time, teacher_name)')
    .eq('id', session.id)
    .single();

  if (!student) redirect('/kirish?role=student');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const studentAny = student as any;
  const group = studentAny.groups ?? null;

  const [attRes, lessonRes, examRes] = await Promise.all([
    db.from('attendance').select('date, status').eq('student_id', student.id).order('date', { ascending: false }).limit(5),
    group ? db.from('lessons').select('lesson_date, title').eq('group_id', student.group_id).order('lesson_date', { ascending: false }).limit(3) : Promise.resolve({ data: [] }),
    db.from('exam_results').select('score, exams(title, exam_date, max_score)').eq('student_id', student.id).order('entered_at', { ascending: false }).limit(5),
  ]);

  return (
    <StudentDashboard
      studentName={student.full_name}
      group={group}
      recentAttendance={attRes.data ?? []}
      recentLessons={(lessonRes.data ?? []) as { lesson_date: string; title: string }[]}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      examResults={(examRes.data ?? []) as any[]}
    />
  );
}
