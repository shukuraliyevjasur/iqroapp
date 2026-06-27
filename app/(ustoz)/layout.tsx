import { TeacherSidebar } from '@/components/ustoz/TeacherSidebar';

export default function UstozLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F4F6]">
      <TeacherSidebar />
      <main className="ml-56 min-h-screen">
        {children}
      </main>
    </div>
  );
}
