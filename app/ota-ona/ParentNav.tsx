'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n/context';

export function ParentNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLang();

  async function handleLogout() {
    await fetch('/api/auth/access', { method: 'DELETE', body: JSON.stringify({ role: 'parent' }), headers: { 'Content-Type': 'application/json' } });
    router.push('/');
  }

  const links = [
    { href: '/ota-ona/bosh', label: t('navDashboard') },
    { href: '/ota-ona/davomat', label: t('portalAttendance') },
    { href: '/ota-ona/tolovlar', label: t('portalPayments') },
    { href: '/ota-ona/darslar', label: t('portalLessons') },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-30 bg-[#C0181B] h-16 flex items-center px-4">
      <span className="text-white font-semibold tracking-widest text-lg font-[family-name:var(--font-cinzel)] mr-6">IQRO</span>
      <div className="flex gap-1 flex-1 overflow-x-auto">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              pathname.startsWith(l.href) ? 'bg-white text-[#C0181B]' : 'text-white/70 hover:text-white hover:bg-white/15'
            }`}>
            {l.label}
          </Link>
        ))}
      </div>
      <button onClick={handleLogout} className="text-white/50 text-xs hover:text-white transition-colors ml-2">{t('logout')}</button>
    </nav>
  );
}
