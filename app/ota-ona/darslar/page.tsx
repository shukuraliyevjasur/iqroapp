export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getParentSession } from '@/lib/session';
import { validateSession } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { LessonList } from './LessonList';

export default async function OtaOnaDarslarPage() {
  const db = createServerClient();
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const session = await validateSession(await getParentSession(), db, ip, 'parents', 'parent');
  if (!session) redirect('/kirish?role=parent');

  const { data: parent } = await db.from('parents').select('student_id').eq('id', session.id).single();
  if (!parent?.student_id) redirect('/ota-ona/bosh');

  const { data: student } = await db.from('students').select('group_id').eq('id', parent.student_id).single();

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
