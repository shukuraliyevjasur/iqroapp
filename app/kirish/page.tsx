'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Role = 'admin' | 'parent' | 'student';

const ROLE_CONFIG = {
  admin: {
    label: 'Xodim',
    hint: 'PIN kiriting',
    inputType: 'password' as const,
    placeholder: '••••••',
    maxLength: 10,
  },
  parent: {
    label: 'Ota-ona',
    hint: 'Kirish kodingizni kiriting',
    inputType: 'text' as const,
    placeholder: 'ABC123',
    maxLength: 6,
  },
  student: {
    label: "O'quvchi",
    hint: 'Kirish kodingizni kiriting',
    inputType: 'text' as const,
    placeholder: 'ABC123',
    maxLength: 6,
  },
};

function KirishForm() {
  const router = useRouter();
  const params = useSearchParams();
  const role = (params.get('role') as Role) ?? 'parent';
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.parent;

  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setError('');

    if (role === 'admin') {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: value }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      router.push('/markaz/boshqaruv');
    } else {
      const res = await fetch('/api/auth/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      router.push(role === 'parent' ? '/ota-ona/asosiy' : '/talaba/asosiy');
    }
  }

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center px-5">
      <h1
        className="text-5xl font-semibold text-white tracking-widest mb-1"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        IQRO
      </h1>
      <p className="text-white/40 text-xs tracking-widest uppercase mb-10">
        O&apos;quv markazi
      </p>

      <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-6">
        {config.label}
      </p>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4"
      >
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            {config.hint}
          </label>
          <input
            type={config.inputType}
            value={value}
            onChange={(e) => setValue(
              role === 'admin' ? e.target.value : e.target.value.toUpperCase()
            )}
            placeholder={config.placeholder}
            maxLength={config.maxLength}
            autoComplete="off"
            autoFocus
            className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-center text-lg font-bold text-[#1C1C2E] tracking-widest outline-none focus:border-[#C0181B] transition-colors"
          />
        </div>

        {error && (
          <p className="text-red-500 text-xs text-center font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="w-full bg-[#C0181B] text-white rounded-2xl py-3.5 font-bold text-sm tracking-wide disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Tekshirilmoqda...' : 'Kirish'}
        </button>
      </form>

      <div className="flex gap-3 mt-6">
        {(['parent', 'student', 'admin'] as Role[]).map((r) => (
          <button
            key={r}
            onClick={() => { router.push(`/kirish?role=${r}`); setValue(''); setError(''); }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              role === r ? 'bg-white text-[#111111]' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {ROLE_CONFIG[r].label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function KirishPage() {
  return (
    <Suspense>
      <KirishForm />
    </Suspense>
  );
}
