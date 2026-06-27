'use server';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createGroup(formData: FormData) {
  const db = createServerClient();
  const name = (formData.get('name') as string).trim();
  const schedule_days = (formData.get('schedule_days') as string)
    .split(',').map(d => d.trim()).filter(Boolean);
  const schedule_time = (formData.get('schedule_time') as string).trim();
  const max_students = formData.get('max_students') ? Number(formData.get('max_students')) : 15;

  await db.from('groups').insert({
    name, schedule_days, schedule_time, max_students, branch_id: 1,
  });
  revalidatePath('/markaz/guruhlar');
}

export async function updateGroup(id: number, formData: FormData) {
  const db = createServerClient();
  const name = (formData.get('name') as string).trim();
  const schedule_days = (formData.get('schedule_days') as string)
    .split(',').map(d => d.trim()).filter(Boolean);
  const schedule_time = (formData.get('schedule_time') as string).trim();
  const max_students = formData.get('max_students') ? Number(formData.get('max_students')) : 15;
  const status = formData.get('status') as string;

  await db.from('groups').update({ name, schedule_days, schedule_time, max_students, status }).eq('id', id);
  revalidatePath('/markaz/guruhlar');
}

export async function deleteGroup(id: number) {
  const db = createServerClient();
  await db.from('groups').delete().eq('id', id);
  revalidatePath('/markaz/guruhlar');
}

export async function moveStudentToGroup(studentId: number, groupId: number | null) {
  const db = createServerClient();
  await db.from('students').update({ group_id: groupId }).eq('id', studentId);
  revalidatePath('/markaz/guruhlar');
  revalidatePath('/markaz/oquvchilar');
}
