'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n/context';

export function StudentNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLang();

  async function handleLogout() {
    await fetch('/api/auth/access', { method: 'DELETE', body: JSON.stringify({ role: 'student' }), headers: { 'Content-Type': 'application/json' } });
    router.push('/');
  }

  const links = [
    { href: '/talaba/bosh', label: t('navDashboard') },
    { href: '/talaba/davomat', label: t('portalAttendance') },
    { href: '/talaba/darslar', label: t('portalLessons') },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-30 bg-[#1C1C2E] h-16 flex items-center px-4">
      <span className="text-white font-semibold tracking-widest text-lg font-[family-name:var(--font-cinzel)] mr-6">IQRO</span>
      <div className="flex gap-1 flex-1 overflow-x-auto">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              pathname.startsWith(l.href) ? 'bg-white text-[#1C1C2E]' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}>
            {l.label}
          </Link>
        ))}
      </div>
      <button onClick={handleLogout} className="text-white/40 text-xs hover:text-white transition-colors ml-2">{t('logout')}</button>
    </nav>
  );
}
