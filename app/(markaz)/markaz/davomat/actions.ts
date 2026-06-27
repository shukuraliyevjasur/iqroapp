'use server';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitAttendance(formData: FormData) {
  const db = createServerClient();
  const group_id = Number(formData.get('group_id'));
  const date = formData.get('date') as string;
  const marked_by = 'admin';

  // Collect all student statuses from form
  const entries: { student_id: number; group_id: number; date: string; status: string; marked_by: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('status_')) {
      const student_id = Number(key.replace('status_', ''));
      entries.push({ student_id, group_id, date, status: value as string, marked_by });
    }
  }

  if (entries.length === 0) return;

  // Upsert: one row per student per group per date
  for (const entry of entries) {
    const { data: existing } = await db
      .from('attendance')
      .select('id')
      .eq('student_id', entry.student_id)
      .eq('group_id', entry.group_id)
      .eq('date', entry.date)
      .maybeSingle();

    if (existing) {
      await db.from('attendance').update({ status: entry.status, marked_by }).eq('id', existing.id);
    } else {
      await db.from('attendance').insert(entry);
    }
  }

  revalidatePath('/markaz/davomat');
}

export async function saveLessonTopic(formData: FormData) {
  const db = createServerClient();
  const group_id = Number(formData.get('group_id'));
  const lesson_date = formData.get('date') as string;
  const title = (formData.get('topic') as string).trim();
  const material_link = (formData.get('material_link') as string | null)?.trim() || null;

  if (!title) return;

  const { data: existing } = await db
    .from('lessons')
    .select('id')
    .eq('group_id', group_id)
    .eq('lesson_date', lesson_date)
    .maybeSingle();

  if (existing) {
    await db.from('lessons').update({ title, material_link }).eq('id', existing.id);
  } else {
    await db.from('lessons').insert({ group_id, lesson_date, title, material_link, status: 'completed' });
  }

  revalidatePath('/markaz/davomat');
}
