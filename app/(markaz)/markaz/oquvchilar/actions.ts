'use server';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function uniqueCode(db: ReturnType<typeof createServerClient>, table: 'students' | 'parents'): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = generateCode();
    const { data } = await db.from(table).select('id').eq('access_code', code).maybeSingle();
    if (!data) return code;
  }
  return generateCode();
}

export async function createStudent(formData: FormData) {
  const db = createServerClient();
  const full_name = (formData.get('full_name') as string).trim();
  const parent_phone = (formData.get('parent_phone') as string).trim();
  const group_id = formData.get('group_id') ? Number(formData.get('group_id')) : null;

  const studentCode = await uniqueCode(db, 'students');

  const { data: student, error } = await db
    .from('students')
    .insert({ full_name, group_id, access_code: studentCode, branch_id: 1 })
    .select('id')
    .single();

  if (error || !student) throw new Error(error?.message ?? 'Failed to create student');

  if (parent_phone) {
    const parentCode = await uniqueCode(db, 'parents');
    await db.from('parents').insert({
      full_name: `${full_name} (ota-ona)`,
      phone: parent_phone,
      student_id: student.id,
      access_code: parentCode,
    });
  }

  revalidatePath('/markaz/oquvchilar');
}

export async function updateStudent(id: number, formData: FormData) {
  const db = createServerClient();
  const full_name = (formData.get('full_name') as string).trim();
  const group_id = formData.get('group_id') ? Number(formData.get('group_id')) : null;
  const status = formData.get('status') as string;
  await db.from('students').update({ full_name, group_id, status }).eq('id', id);
  revalidatePath('/markaz/oquvchilar');
}

export async function deleteStudent(id: number) {
  const db = createServerClient();
  await db.from('students').delete().eq('id', id);
  revalidatePath('/markaz/oquvchilar');
}

export async function regenerateStudentCode(id: number): Promise<{ code: string }> {
  const db = createServerClient();
  const code = await uniqueCode(db, 'students');
  await db.from('students').update({ access_code: code }).eq('id', id);
  revalidatePath('/markaz/oquvchilar');
  return { code };
}

export async function regenerateParentCode(studentId: number): Promise<{ code: string } | null> {
  const db = createServerClient();
  const { data: parent } = await db.from('parents').select('id').eq('student_id', studentId).maybeSingle();
  if (!parent) return null;
  const code = await uniqueCode(db, 'parents');
  await db.from('parents').update({ access_code: code }).eq('id', parent.id);
  revalidatePath('/markaz/oquvchilar');
  return { code };
}
