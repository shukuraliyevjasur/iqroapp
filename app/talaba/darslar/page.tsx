export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getStudentSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase/server';
import { LessonList } from '@/app/ota-ona/darslar/LessonList';

export default async function TalabaDarslarPage() {
  const session = await getStudentSession();
  if (!session) redirect('/kirish?role=student');

  const db = createServerClient();
  const { data: student } = await db.from('students').select('group_id').eq('id', session.id).single();

  let lessons: { lesson_date: string; title: string; material_link: string | null }[] = [];
  if (student?.group_id) {
    const { data } = await db
      .from('lessons')
      .select('lesson_date, title, material_link')
      .eq('group_id', student.group_id)
      .order('lesson_date', { ascending: false })
      .limit(30);
    lessons = data ?? [];
  }

  return <LessonList lessons={lessons} />;
}
