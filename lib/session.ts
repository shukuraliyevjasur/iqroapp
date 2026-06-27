import { cookies } from 'next/headers';

export async function getTeacherSession(): Promise<{ id: number; name: string } | null> {
  const store = await cookies();
  const raw = store.get('teacher_session')?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function getParentSession(): Promise<{ id: number; name: string } | null> {
  const store = await cookies();
  const raw = store.get('parent_session')?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function getStudentSession(): Promise<{ id: number; name: string } | null> {
  const store = await cookies();
  const raw = store.get('student_session')?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
