# Iqro Academy Full Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the full Iqro Academy admin/teacher/parent/student portal from the placeholder stubs up to demo-ready state.

**Architecture:** Next.js App Router with server components + server actions for all mutations. Supabase service-role client server-side only. Four auth roles (admin, teacher, parent, student) each with their own httpOnly session cookie and middleware-protected route tree.

**Tech Stack:** Next.js 16, TypeScript, Tailwind v4, Supabase (postgres + RLS), server actions, no client-side Supabase calls.

## Global Constraints
- Brand: `#C0181B` primary, Cinzel for IQRO wordmark only, Inter for body, no emoji, clean minimal cards
- Every user-facing string in `lib/i18n/translations.ts` for EN/UZ/RU before merging
- All mutations: server actions in `app/(markaz)/actions/` or co-located `actions.ts`
- Teacher data access scoped to their assigned groups on every request
- Route names: obfuscated Uzbek (`/markaz`, `/ustoz`, `/ota-ona`, `/talaba`)
- Working directory: `C:\Project JndA\iqroapp\web`

---

### Task 0: Database Schema + RLS

**Files:**
- Create: `supabase/migrations/001_schema.sql`

- [ ] Write and apply migration SQL (see below)
- [ ] Verify tables exist in Supabase dashboard

```sql
-- login_attempts (already used by /api/auth/login)
create table if not exists login_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text,
  role text,
  access_code text,
  failed_at timestamptz default now()
);

-- admins (for future multi-admin; single admin uses env PIN for now)
create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  pin_hash text not null,
  created_at timestamptz default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text,
  day_of_week text,
  time_slot text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists teacher_groups (
  teacher_id uuid references teachers(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  primary key (teacher_id, group_id)
);

create table if not exists parents (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  access_code text unique not null,
  created_at timestamptz default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  parent_id uuid references parents(id) on delete set null,
  parent_phone text,
  group_id uuid references groups(id) on delete set null,
  access_code text unique not null,
  status text default 'active',
  enrolled_at date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present','absent','late')),
  marked_by text not null,
  created_at timestamptz default now()
);

create table if not exists lesson_topics (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  date date not null,
  topic text not null,
  material_link text,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(group_id, date)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  amount_uzs bigint not null,
  month date not null,
  method text,
  status text default 'pending' check (status in ('paid','pending','overdue')),
  note text,
  recorded_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  subject text not null,
  exam_date date not null,
  max_score int default 100,
  created_at timestamptz default now()
);

create table if not exists exam_results (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  score int,
  note text,
  created_at timestamptz default now(),
  unique(exam_id, student_id)
);

-- RLS: enable on all tables (service role bypasses, this protects against future client calls)
alter table login_attempts enable row level security;
alter table teachers enable row level security;
alter table groups enable row level security;
alter table teacher_groups enable row level security;
alter table parents enable row level security;
alter table students enable row level security;
alter table attendance enable row level security;
alter table lesson_topics enable row level security;
alter table payments enable row level security;
alter table exams enable row level security;
alter table exam_results enable row level security;

-- No public access policies — service role only
```

- [ ] Commit: `git add supabase/ && git commit -m "feat: add database schema migration"`

---

### Task 1: Tier 0 Security — Rate-limit /api/auth/access

**Files:**
- Modify: `app/api/auth/access/route.ts`

- [ ] Replace current route with rate-limited version:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { code, role } = await req.json() as { code: string; role: 'parent' | 'student' };

  if (!code || !['parent', 'student'].includes(role)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const db = createServerClient();
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const normalizedCode = code.toUpperCase().trim();

  // Check rate limit by IP
  const { count: ipCount } = await db
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .eq('role', role)
    .gte('failed_at', windowStart);

  // Check rate limit by access code
  const { count: codeCount } = await db
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('access_code', normalizedCode)
    .eq('role', role)
    .gte('failed_at', windowStart);

  if ((ipCount ?? 0) >= MAX_ATTEMPTS || (codeCount ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${WINDOW_MINUTES} minutes.` },
      { status: 429 },
    );
  }

  const table = role === 'parent' ? 'parents' : 'students';
  const { data, error } = await db
    .from(table)
    .select('id, full_name')
    .eq('access_code', normalizedCode)
    .single();

  if (error || !data) {
    await db.from('login_attempts').insert({ ip, role, access_code: normalizedCode });
    return NextResponse.json({ error: 'Access code not found.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, name: data.full_name });
  res.cookies.set(`${role}_session`, JSON.stringify({ id: data.id, name: data.full_name }), {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

export async function DELETE(req: NextRequest) {
  const { role } = await req.json() as { role: 'parent' | 'student' };
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(`${role}_session`);
  return res;
}
```

- [ ] Commit: `git commit -m "fix: rate-limit access code auth by IP and code"`

---

### Task 2: Teacher Auth

**Files:**
- Create: `app/api/auth/teacher/route.ts`
- Modify: `middleware.ts`
- Modify: `app/kirish/page.tsx` (add teacher role tab)
- Create: `app/(ustoz)/layout.tsx`
- Create: `app/(ustoz)/ustoz/sahifa/page.tsx` (teacher dashboard)

**Note:** Teacher PIN stored as bcrypt hash in `teachers` table. For the demo, add a teacher via Supabase dashboard or a seed script. Use `bcryptjs` package.

- [ ] Install bcryptjs: `npm install bcryptjs && npm install -D @types/bcryptjs`

- [ ] Create `app/api/auth/teacher/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { pin } = await req.json() as { pin: string };

  if (!pin) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const db = createServerClient();
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count } = await db
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .eq('role', 'teacher')
    .gte('failed_at', windowStart);

  if ((count ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: `Too many attempts. Try again in ${WINDOW_MINUTES} minutes.` }, { status: 429 });
  }

  // Teachers must enter: PIN (their personal PIN)
  // We also need them to identify themselves — use teacher id passed from login form
  const { teacherId } = await req.json().catch(() => ({})) as { teacherId?: string };

  // Re-read body (already consumed above) — restructure:
  // The login form sends { pin, teacherId }
  const body = await req.clone().json().catch(() => null);
  // Note: body already parsed above, use destructuring from first parse

  return NextResponse.json({ error: 'Use the restructured route below' }, { status: 500 });
}
```

Actually restructure this cleanly:

- [ ] Create `app/api/auth/teacher/route.ts` (final version):

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { pin, teacherId } = await req.json() as { pin: string; teacherId: string };

  if (!pin || !teacherId) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const db = createServerClient();
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count } = await db
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .eq('role', 'teacher')
    .gte('failed_at', windowStart);

  if ((count ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${WINDOW_MINUTES} minutes.` },
      { status: 429 },
    );
  }

  const { data: teacher, error } = await db
    .from('teachers')
    .select('id, full_name, pin_hash')
    .eq('id', teacherId)
    .single();

  if (error || !teacher) {
    await db.from('login_attempts').insert({ ip, role: 'teacher' });
    return NextResponse.json({ error: 'Teacher not found.' }, { status: 401 });
  }

  const valid = await bcrypt.compare(pin, teacher.pin_hash);
  if (!valid) {
    await db.from('login_attempts').insert({ ip, role: 'teacher' });
    const remaining = MAX_ATTEMPTS - ((count ?? 0) + 1);
    return NextResponse.json(
      { error: `Wrong PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} left.` },
      { status: 401 },
    );
  }

  await db.from('login_attempts').delete().eq('ip', ip).eq('role', 'teacher');

  const res = NextResponse.json({ ok: true, name: teacher.full_name });
  res.cookies.set('teacher_session', JSON.stringify({ id: teacher.id, name: teacher.full_name }), {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 12,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('teacher_session');
  return res;
}
```

- [ ] Update `middleware.ts` to add teacher route:

```ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/markaz')) {
    const session = req.cookies.get('admin_session');
    if (session?.value !== process.env.AUTH_COOKIE_SECRET) {
      return NextResponse.redirect(new URL('/kirish?role=admin', req.url));
    }
  }

  if (pathname.startsWith('/ustoz')) {
    const session = req.cookies.get('teacher_session');
    if (!session?.value) {
      return NextResponse.redirect(new URL('/kirish?role=teacher', req.url));
    }
  }

  if (pathname.startsWith('/ota-ona')) {
    const session = req.cookies.get('parent_session');
    if (!session?.value) {
      return NextResponse.redirect(new URL('/kirish?role=parent', req.url));
    }
  }

  if (pathname.startsWith('/talaba')) {
    const session = req.cookies.get('student_session');
    if (!session?.value) {
      return NextResponse.redirect(new URL('/kirish?role=student', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/markaz/:path*', '/ustoz/:path*', '/ota-ona/:path*', '/talaba/:path*'],
};
```

- [ ] Commit: `git commit -m "feat: teacher auth route and middleware"`

---

### Task 3: Students CRUD

**Files:**
- Modify: `app/(markaz)/oquvchilar/page.tsx`
- Create: `app/(markaz)/oquvchilar/actions.ts`

- [ ] Create `app/(markaz)/oquvchilar/actions.ts`:

```ts
'use server';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createStudent(formData: FormData) {
  const db = createServerClient();
  const full_name = formData.get('full_name') as string;
  const parent_phone = formData.get('parent_phone') as string;
  const group_id = formData.get('group_id') as string || null;
  let access_code = generateCode();

  // Ensure unique
  let attempts = 0;
  while (attempts < 10) {
    const { data } = await db.from('students').select('id').eq('access_code', access_code).single();
    if (!data) break;
    access_code = generateCode();
    attempts++;
  }

  await db.from('students').insert({ full_name, parent_phone, group_id, access_code });
  revalidatePath('/markaz/oquvchilar');
}

export async function updateStudent(id: string, formData: FormData) {
  const db = createServerClient();
  const full_name = formData.get('full_name') as string;
  const parent_phone = formData.get('parent_phone') as string;
  const group_id = formData.get('group_id') as string || null;
  const status = formData.get('status') as string;
  await db.from('students').update({ full_name, parent_phone, group_id, status, updated_at: new Date().toISOString() }).eq('id', id);
  revalidatePath('/markaz/oquvchilar');
}

export async function deleteStudent(id: string) {
  const db = createServerClient();
  await db.from('students').delete().eq('id', id);
  revalidatePath('/markaz/oquvchilar');
}
```

- [ ] Replace `app/(markaz)/oquvchilar/page.tsx` with full CRUD UI (server component + client modal pattern — see Task 3 implementation notes)

- [ ] Commit: `git commit -m "feat: students CRUD"`

---

### Task 4: Groups CRUD

**Files:**
- Modify: `app/(markaz)/guruhlar/page.tsx`
- Create: `app/(markaz)/guruhlar/actions.ts`

Actions pattern same as students. Groups fields: name, subject, day_of_week, time_slot, status.

- [ ] Commit: `git commit -m "feat: groups CRUD"`

---

### Task 5: Attendance (event log) + Lesson Topics

**Files:**
- Modify: `app/(markaz)/davomat/page.tsx`
- Create: `app/(markaz)/davomat/actions.ts`

Attendance: select group + date → list students → mark present/absent/late per student → submit inserts rows into `attendance` table (upsert by student_id + group_id + date).

Lesson topic: one text field per group+date, upsert into `lesson_topics`.

- [ ] Commit: `git commit -m "feat: attendance event log and lesson topics"`

---

### Task 6: Payments CRUD

**Files:**
- Modify: `app/(markaz)/tolovlar/page.tsx`
- Create: `app/(markaz)/tolovlar/actions.ts`

Admin records: student, amount_uzs, month (date picker), method (cash/card/transfer), status (paid/pending/overdue), note.

- [ ] Commit: `git commit -m "feat: payments CRUD"`

---

### Task 7: Teacher Portal (/ustoz)

**Files:**
- Create: `app/(ustoz)/layout.tsx`
- Create: `app/(ustoz)/ustoz/sahifa/page.tsx` (dashboard — assigned groups)
- Create: `app/(ustoz)/ustoz/davomat/page.tsx` (mark attendance for assigned groups)
- Create: `app/(ustoz)/ustoz/davomat/actions.ts`
- Create: `components/ustoz/TeacherSidebar.tsx`
- Create: `lib/teacher.ts` (helper: getTeacherSession, getTeacherGroups)

Teacher session from cookie → `JSON.parse(cookie)` → `{ id, name }`. All DB queries must join `teacher_groups` to scope to teacher's groups.

- [ ] Commit: `git commit -m "feat: teacher portal with scoped attendance"`

---

### Task 8: Parent Portal (/ota-ona)

**Files:**
- Create: `app/ota-ona/page.tsx` (redirect to /ota-ona/bosh)
- Create: `app/ota-ona/bosh/page.tsx` (dashboard)
- Create: `app/ota-ona/davomat/page.tsx`
- Create: `app/ota-ona/tolovlar/page.tsx`
- Create: `app/ota-ona/darslar/page.tsx`
- Create: `components/ota-ona/ParentNav.tsx`
- Create: `lib/parent.ts` (getParentSession → student lookup)

Parent session cookie → `{ id, name }`. Look up student where `parent_id = parentId` OR `parent_phone` matches parent's phone. Show that student's attendance, payments, lesson topics.

Fully translated EN/UZ/RU.

- [ ] Commit: `git commit -m "feat: parent portal"`

---

### Task 9: Student Portal (/talaba)

**Files:**
- Create: `app/talaba/page.tsx`
- Create: `app/talaba/bosh/page.tsx`
- Create: `app/talaba/davomat/page.tsx`
- Create: `app/talaba/darslar/page.tsx`
- Create: `components/talaba/StudentNav.tsx`
- Create: `lib/student.ts` (getStudentSession)

Student session → their own attendance, lesson topics for their group, group schedule (day_of_week + time_slot from groups table).

Fully translated EN/UZ/RU.

- [ ] Commit: `git commit -m "feat: student portal"`

---

### Task 10: Exams (Tier 5 — admin grade entry)

**Files:**
- Modify: `app/(markaz)/imtihonlar/page.tsx`
- Create: `app/(markaz)/imtihonlar/actions.ts`

Admin creates exam (group, subject, date, max_score). Enters scores per student. Shown read-only in parent + student portals.

- [ ] Add exam results to parent/student portal pages
- [ ] Commit: `git commit -m "feat: exam grade entry"`

---

### Task 11: i18n Completeness + Final Push

- [ ] Audit `lib/i18n/translations.ts` — add any missing keys added in Tasks 3–10
- [ ] `git push origin main`
