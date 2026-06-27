import { ParentNav } from './ParentNav';

export default function OtaOnaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F4F6]">
      <ParentNav />
      <main className="pt-16 pb-8 px-4 max-w-lg mx-auto">
        {children}
      </main>
    </div>
  );
}
