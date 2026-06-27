'use server';
import { createServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createTeacher(formData: FormData): Promise<{ pin: string }> {
  const db = createServerClient();
  const full_name = (formData.get('full_name') as string).trim();
  const pin = generatePin();
  const pin_hash = await bcrypt.hash(pin, 10);
  const { error } = await db.from('teachers').insert({ full_name, pin_hash });
  if (error) throw new Error(error.message);
  revalidatePath('/markaz/oqituvchilar');
  return { pin };
}

export async function updateTeacher(id: number, formData: FormData) {
  const db = createServerClient();
  const full_name = (formData.get('full_name') as string).trim();
  await db.from('teachers').update({ full_name }).eq('id', id);
  const { data: assignments } = await db.from('teacher_groups').select('group_id').eq('teacher_id', id);
  if (assignments && assignments.length > 0) {
    await db.from('groups').update({ teacher_name: full_name }).in('id', assignments.map(a => a.group_id));
  }
  revalidatePath('/markaz/oqituvchilar');
  revalidatePath('/markaz/guruhlar');
}

export async function deleteTeacher(id: number) {
  const db = createServerClient();
  const { data: assignments } = await db.from('teacher_groups').select('group_id').eq('teacher_id', id);
  await db.from('teachers').delete().eq('id', id);
  if (assignments && assignments.length > 0) {
    await db.from('groups').update({ teacher_name: null }).in('id', assignments.map(a => a.group_id));
  }
  revalidatePath('/markaz/oqituvchilar');
  revalidatePath('/markaz/guruhlar');
}

export async function updateTeacherGroups(teacherId: number, groupIds: number[]) {
  const db = createServerClient();
  const { data: teacher } = await db.from('teachers').select('full_name').eq('id', teacherId).single();
  if (!teacher) throw new Error('Teacher not found');
  const { data: existing } = await db.from('teacher_groups').select('group_id').eq('teacher_id', teacherId);
  const prevIds = (existing ?? []).map(r => r.group_id);
  const removedIds = prevIds.filter(id => !groupIds.includes(id));
  await db.from('teacher_groups').delete().eq('teacher_id', teacherId);
  if (groupIds.length > 0) {
    await db.from('teacher_groups').insert(groupIds.map(group_id => ({ teacher_id: teacherId, group_id })));
    await db.from('groups').update({ teacher_name: teacher.full_name }).in('id', groupIds);
  }
  for (const groupId of removedIds) {
    const { data: other } = await db.from('teacher_groups').select('teacher_id').eq('group_id', groupId).maybeSingle();
    if (!other) await db.from('groups').update({ teacher_name: null }).eq('id', groupId);
  }
  revalidatePath('/markaz/oqituvchilar');
  revalidatePath('/markaz/guruhlar');
}
