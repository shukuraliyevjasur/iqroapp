'use server';
import { createServerClient } from '@/lib/supabase/server';
import { getTeacherSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

async function isAuthorizedForGroup(db: ReturnType<typeof createServerClient>, teacherId: number, groupId: number, date: string): Promise<boolean> {
  const [{ data: permanent }, { data: coverage }] = await Promise.all([
    db.from('teacher_groups').select('teacher_id')
      .eq('teacher_id', teacherId).eq('group_id', groupId).maybeSingle(),
    db.from('lesson_coverage').select('id')
      .eq('teacher_id', teacherId).eq('group_id', groupId).eq('date', date).maybeSingle(),
  ]);
  return !!(permanent || coverage);
}

export async function submitTeacherAttendance(formData: FormData) {
  const session = await getTeacherSession();
  if (!session) throw new Error('Unauthorized');

  const group_id = Number(formData.get('group_id'));
  const date = formData.get('date') as string;
  const db = createServerClient();

  if (!(await isAuthorizedForGroup(db, session.id, group_id, date))) {
    throw new Error('Not authorized for this group');
  }

  const marked_by = `teacher:${session.id}`;

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith('status_')) continue;
    const student_id = Number(key.replace('status_', ''));
    const { data: existing } = await db.from('attendance').select('id')
      .eq('student_id', student_id).eq('group_id', group_id).eq('date', date).maybeSingle();
    if (existing) {
      await db.from('attendance').update({ status: value as string, marked_by }).eq('id', existing.id);
    } else {
      await db.from('attendance').insert({ student_id, group_id, date, status: value as string, marked_by });
    }
  }

  revalidatePath('/ustoz/davomat');
}

export async function saveTeacherLessonTopic(formData: FormData) {
  const session = await getTeacherSession();
  if (!session) throw new Error('Unauthorized');

  const group_id = Number(formData.get('group_id'));
  const lesson_date = formData.get('date') as string;
  const db = createServerClient();

  if (!(await isAuthorizedForGroup(db, session.id, group_id, lesson_date))) {
    throw new Error('Not authorized for this group');
  }

  const title = (formData.get('topic') as string).trim();
  const material_link = (formData.get('material_link') as string | null)?.trim() || null;

  const { data: existing } = await db.from('lessons').select('id')
    .eq('group_id', group_id).eq('lesson_date', lesson_date).maybeSingle();

  if (existing) {
    await db.from('lessons').update({ title, material_link }).eq('id', existing.id);
  } else {
    await db.from('lessons').insert({ group_id, lesson_date, title, material_link, status: 'completed', marked_by: `teacher:${session.id}` });
  }

  revalidatePath('/ustoz/davomat');
}
