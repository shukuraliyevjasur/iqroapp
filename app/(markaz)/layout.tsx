import { Sidebar } from '@/components/markaz/Sidebar';

export default function MarkazLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F4F6]">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
