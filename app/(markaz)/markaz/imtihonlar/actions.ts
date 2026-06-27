'use server';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createExam(formData: FormData) {
  const db = createServerClient();
  const { data: exam } = await db.from('exams').insert({
    group_id: Number(formData.get('group_id')),
    title: (formData.get('title') as string).trim(),
    exam_date: formData.get('exam_date') as string,
    max_score: Number(formData.get('max_score') ?? 100),
  }).select('id').single();
  revalidatePath('/markaz/imtihonlar');
  return exam?.id;
}

export async function deleteExam(id: number) {
  const db = createServerClient();
  await db.from('exams').delete().eq('id', id);
  revalidatePath('/markaz/imtihonlar');
}

export async function saveExamResults(formData: FormData) {
  const db = createServerClient();
  const exam_id = Number(formData.get('exam_id'));

  const results: { exam_id: number; student_id: number; score: number | null; notes: string | null }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('score_')) {
      const student_id = Number(key.replace('score_', ''));
      const note = formData.get(`note_${student_id}`) as string | null;
      results.push({ exam_id, student_id, score: value ? Number(value) : null, notes: note || null });
    }
  }

  for (const r of results) {
    const { data: existing } = await db.from('exam_results').select('id')
      .eq('exam_id', r.exam_id).eq('student_id', r.student_id).maybeSingle();
    if (existing) {
      await db.from('exam_results').update({ score: r.score, notes: r.notes }).eq('id', existing.id);
    } else {
      await db.from('exam_results').insert(r);
    }
  }
  revalidatePath('/markaz/imtihonlar');
}
