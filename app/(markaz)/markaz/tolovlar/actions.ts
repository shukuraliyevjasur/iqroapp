'use server';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createPayment(formData: FormData) {
  const db = createServerClient();
  await db.from('payments').insert({
    student_id: Number(formData.get('student_id')),
    amount_uzs: Number(formData.get('amount_uzs')),
    month_label: formData.get('month_label') as string,
    due_date: formData.get('due_date') as string,
    paid_date: formData.get('paid_date') as string || null,
    status: formData.get('status') as string,
    payment_method: formData.get('payment_method') as string || null,
    notes: formData.get('notes') as string || null,
  });
  revalidatePath('/markaz/tolovlar');
}

export async function updatePaymentStatus(id: number, status: string, paid_date?: string) {
  const db = createServerClient();
  await db.from('payments').update({
    status,
    paid_date: paid_date ?? null,
  }).eq('id', id);
  revalidatePath('/markaz/tolovlar');
}

export async function deletePayment(id: number) {
  const db = createServerClient();
  await db.from('payments').delete().eq('id', id);
  revalidatePath('/markaz/tolovlar');
}
