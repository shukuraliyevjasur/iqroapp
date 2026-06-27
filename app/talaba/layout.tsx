import { StudentNav } from './StudentNav';

export default function TalabaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F4F6]">
      <StudentNav />
      <main className="pt-16 pb-8 px-4 max-w-lg mx-auto">
        {children}
      </main>
    </div>
  );
}
