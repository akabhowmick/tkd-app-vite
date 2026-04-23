# Student, Parent & Instructor Portals Setup

Follow every step in order. Do not skip or combine steps.

---

## Step 1 — Supabase SQL

Open Supabase dashboard → SQL Editor → paste and run the following:

```sql
-- Junction table linking parents to their children
CREATE TABLE IF NOT EXISTS public.parent_students (
  id         UUID NOT NULL DEFAULT gen_random_uuid(),
  parent_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id  UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT parent_students_pkey PRIMARY KEY (id),
  CONSTRAINT parent_students_unique UNIQUE (parent_id, student_id)
);

CREATE INDEX idx_parent_students_parent ON public.parent_students(parent_id);
CREATE INDEX idx_parent_students_student ON public.parent_students(student_id);
CREATE INDEX idx_parent_students_school ON public.parent_students(school_id);

ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

-- Admins can manage all parent-student links for their school
CREATE POLICY "Admins can manage parent_students"
  ON public.parent_students FOR ALL
  USING (
    school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid())
  )
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid())
  );

-- Parents can view their own links
CREATE POLICY "Parents can view their own links"
  ON public.parent_students FOR SELECT
  USING (parent_id = auth.uid());
```

---

## Step 2 — Create `src/types/portal.ts`

```typescript
export interface ParentStudent {
  id: string;
  parent_id: string;
  student_id: string;
  school_id: string;
  created_at: string;
}
```

---

## Step 3 — Create `src/api/PortalRequests/portalRequests.ts`

```typescript
import { supabase } from "../supabase";
import { Student } from "../../types/user";
import { AttendanceRecord } from "../../types/attendance";
import { RenewalPeriod } from "../../types/student_renewal";
import { PromotionWithRanks } from "../../types/belts";

// ── Parent: fetch linked student IDs
export async function getLinkedStudentIds(parentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("parent_students")
    .select("student_id")
    .eq("parent_id", parentId);

  if (error) throw error;
  return (data ?? []).map((r) => r.student_id);
}

// ── Student / Parent: attendance history for a student
export async function getStudentAttendance(
  studentId: string,
  limit = 60,
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AttendanceRecord[];
}

// ── Student / Parent: active renewal for a student
export async function getStudentRenewal(studentId: string): Promise<RenewalPeriod | null> {
  const { data, error } = await supabase
    .from("renewal_periods")
    .select("*, payments:renewal_payments(*)")
    .eq("student_id", studentId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const payments = (data.payments ?? []).sort(
    (a: { installment_number: number }, b: { installment_number: number }) =>
      a.installment_number - b.installment_number,
  );
  const total_due = payments.reduce((s: number, p: { amount_due: number }) => s + p.amount_due, 0);
  const total_paid = payments.reduce(
    (s: number, p: { amount_paid: number }) => s + p.amount_paid,
    0,
  );
  return { ...data, payments, total_due, total_paid, balance: total_due - total_paid };
}

// ── Student / Parent: belt promotion history
export async function getStudentBeltHistory(studentId: string): Promise<PromotionWithRanks[]> {
  const { data, error } = await supabase
    .from("belt_promotions")
    .select(
      `
      *,
      from_rank:belt_ranks!belt_promotions_from_rank_id_fkey(*),
      to_rank:belt_ranks!belt_promotions_to_rank_id_fkey(*)
    `,
    )
    .eq("student_id", studentId)
    .order("promotion_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ── Instructor: fetch students for their school
export async function getInstructorStudents(schoolId: string): Promise<Student[]> {
  const { data, error } = await supabase.from("students").select("*").eq("school_id", schoolId);

  if (error) throw error;
  return (data ?? []).sort((a, b) => {
    const last = (n: string) => n.trim().split(" ").pop() ?? "";
    return last(a.name).localeCompare(last(b.name));
  });
}
```

---

## Step 4 — Create shared portal components

### 4a — Create `src/components/Portal/AttendanceHistory.tsx`

```typescript
import { useEffect, useState } from "react";
import { getStudentAttendance } from "../../api/PortalRequests/portalRequests";
import { AttendanceRecord } from "../../types/attendance";
import { CalendarCheck, CalendarX } from "lucide-react";

interface Props {
  studentId: string;
  studentName?: string;
}

export const AttendanceHistory = ({ studentId, studentName }: Props) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    getStudentAttendance(studentId)
      .then(setRecords)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const rate = records.length > 0 ? Math.round((present / records.length) * 100) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {studentName && (
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {studentName}
        </p>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{present}</p>
          <p className="text-xs text-green-600 mt-0.5">Present</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{absent}</p>
          <p className="text-xs text-red-500 mt-0.5">Absent</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{rate !== null ? `${rate}%` : "—"}</p>
          <p className="text-xs text-blue-600 mt-0.5">Rate</p>
        </div>
      </div>

      {/* Record list */}
      {records.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No attendance records yet.</p>
      ) : (
        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
          {records.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-gray-100"
            >
              <span className="text-sm text-gray-700">
                {new Date(r.date + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {r.status === "present" ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-700">
                  <CalendarCheck size={13} /> Present
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                  <CalendarX size={13} /> Absent
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 4b — Create `src/components/Portal/RenewalStatus.tsx`

```typescript
import { useEffect, useState } from "react";
import { getStudentRenewal } from "../../api/PortalRequests/portalRequests";
import { RenewalPeriod } from "../../types/student_renewal";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface Props {
  studentId: string;
  studentName?: string;
}

export const RenewalStatus = ({ studentId, studentName }: Props) => {
  const [renewal, setRenewal] = useState<RenewalPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    getStudentRenewal(studentId)
      .then(setRenewal)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {error}
      </p>
    );
  }

  if (!renewal) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertCircle size={28} className="text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No active membership found.</p>
        {studentName && (
          <p className="text-xs text-gray-400 mt-0.5">Contact your school for details.</p>
        )}
      </div>
    );
  }

  const daysLeft = renewal.expiration_date
    ? Math.ceil(
        (new Date(renewal.expiration_date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
          86_400_000,
      )
    : null;

  const isPaid = renewal.balance <= 0 && renewal.total_due > 0;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 15 && daysLeft >= 0;
  const isOverdue = daysLeft !== null && daysLeft < 0;

  return (
    <div className="flex flex-col gap-4">
      {studentName && (
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {studentName}
        </p>
      )}

      {/* Expiration */}
      <div
        className={`rounded-xl border p-4 flex items-center gap-3 ${
          isOverdue
            ? "bg-red-50 border-red-200"
            : isExpiringSoon
            ? "bg-yellow-50 border-yellow-200"
            : "bg-green-50 border-green-200"
        }`}
      >
        <Clock
          size={20}
          className={
            isOverdue ? "text-red-500" : isExpiringSoon ? "text-yellow-600" : "text-green-600"
          }
        />
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {renewal.expiration_date
              ? new Date(renewal.expiration_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "No expiration (milestone program)"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isOverdue
              ? `Expired ${Math.abs(daysLeft!)} day${Math.abs(daysLeft!) !== 1 ? "s" : ""} ago`
              : isExpiringSoon
              ? `Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
              : daysLeft !== null
              ? `${daysLeft} days remaining`
              : "Active membership"}
          </p>
        </div>
      </div>

      {/* Payment summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Due</span>
          <span className="text-sm font-semibold text-gray-900">
            ${renewal.total_due.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Paid</span>
          <span className="text-sm font-semibold text-green-700">
            ${renewal.total_paid.toFixed(2)}
          </span>
        </div>
        {renewal.balance > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm font-medium text-red-600">Balance Owed</span>
            <span className="text-sm font-bold text-red-600">
              ${renewal.balance.toFixed(2)}
            </span>
          </div>
        )}
        {isPaid && (
          <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
            <CheckCircle2 size={15} /> Fully paid
          </div>
        )}
      </div>

      {/* Classes per week */}
      <p className="text-xs text-gray-400 text-center">
        {renewal.number_of_classes} class{renewal.number_of_classes !== 1 ? "es" : ""} per week ·{" "}
        {renewal.duration_months ? `${renewal.duration_months}-month program` : "Milestone program"}
      </p>
    </div>
  );
};
```

### 4c — Create `src/components/Portal/BeltHistory.tsx`

```typescript
import { useEffect, useState } from "react";
import { getStudentBeltHistory } from "../../api/PortalRequests/portalRequests";
import { PromotionWithRanks } from "../../types/belts";
import { Award } from "lucide-react";

interface Props {
  studentId: string;
  studentName?: string;
}

const BeltSwatch = ({ color, stripe }: { color: string; stripe?: string | null }) => (
  <div className="h-5 w-5 rounded border border-gray-200 overflow-hidden flex flex-col shrink-0">
    {stripe ? (
      <>
        <div className="flex-1" style={{ backgroundColor: color }} />
        <div className="flex-1" style={{ backgroundColor: stripe }} />
        <div className="flex-1" style={{ backgroundColor: color }} />
      </>
    ) : (
      <div className="h-full w-full" style={{ backgroundColor: color }} />
    )}
  </div>
);

export const BeltHistory = ({ studentId, studentName }: Props) => {
  const [history, setHistory] = useState<PromotionWithRanks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    getStudentBeltHistory(studentId)
      .then(setHistory)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {studentName && (
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {studentName}
        </p>
      )}

      {/* Current belt */}
      {history.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <BeltSwatch
            color={history[0].to_rank.color_code}
            stripe={history[0].to_rank.stripe_color}
          />
          <div>
            <p className="text-xs text-gray-400">Current Belt</p>
            <p className="text-sm font-semibold text-gray-900">{history[0].to_rank.rank_name}</p>
          </div>
        </div>
      )}

      {/* Full history */}
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Award size={28} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No promotions recorded yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((p) => (
            <div
              key={p.promotion_id}
              className="bg-white border border-gray-100 rounded-lg px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <BeltSwatch
                  color={p.to_rank.color_code}
                  stripe={p.to_rank.stripe_color}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.to_rank.rank_name}</p>
                  <p className="text-xs text-gray-400">
                    {p.from_rank ? `from ${p.from_rank.rank_name}` : "First rank"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {new Date(p.promotion_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-400 capitalize">{p.promotion_type}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Step 5 — Create the Student Portal

### 5a — Create `src/components/Portal/StudentPortal.tsx`

```typescript
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AttendanceHistory } from "./AttendanceHistory";
import { RenewalStatus } from "./RenewalStatus";
import { BeltHistory } from "./BeltHistory";
import { AnnouncementsPage } from "../../pages/AnnouncementsPage";
import { CalendarCheck, DollarSign, Award, Megaphone } from "lucide-react";

type Tab = "announcements" | "attendance" | "renewal" | "belts";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "renewal", label: "Membership", icon: DollarSign },
  { id: "belts", label: "Belt History", icon: Award },
];

export const StudentPortal = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("announcements");

  if (!user?.id) return null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Welcome back, {user.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your student dashboard</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === "announcements" && <AnnouncementsPage />}
        {activeTab === "attendance" && (
          <AttendanceHistory studentId={user.id} />
        )}
        {activeTab === "renewal" && (
          <RenewalStatus studentId={user.id} />
        )}
        {activeTab === "belts" && (
          <BeltHistory studentId={user.id} />
        )}
      </div>
    </div>
  );
};
```

---

## Step 6 — Create the Parent Portal

### 6a — Create `src/components/Portal/ParentPortal.tsx`

```typescript
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getLinkedStudentIds } from "../../api/PortalRequests/portalRequests";
import { supabase } from "../../api/supabase";
import { Student } from "../../types/user";
import { AttendanceHistory } from "./AttendanceHistory";
import { RenewalStatus } from "./RenewalStatus";
import { BeltHistory } from "./BeltHistory";
import { AnnouncementsPage } from "../../pages/AnnouncementsPage";
import { CalendarCheck, DollarSign, Award, Megaphone, Users } from "lucide-react";

type Tab = "announcements" | "attendance" | "renewal" | "belts";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "renewal", label: "Membership", icon: DollarSign },
  { id: "belts", label: "Belt History", icon: Award },
];

export const ParentPortal = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("announcements");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      try {
        setLoading(true);
        const ids = await getLinkedStudentIds(user.id!);
        if (ids.length === 0) {
          setChildren([]);
          return;
        }
        const { data, error: err } = await supabase
          .from("students")
          .select("*")
          .in("id", ids);

        if (err) throw err;
        const sorted = (data ?? []).sort((a: Student, b: Student) =>
          a.name.localeCompare(b.name),
        );
        setChildren(sorted);
        setSelectedChild(sorted[0] ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load children");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 max-w-md">
        {error}
      </p>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Welcome, {user?.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Parent dashboard</p>
      </div>

      {children.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Users size={22} className="text-primary" />
          </div>
          <p className="text-sm font-medium text-gray-700">No students linked yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Contact your school admin to link your child's account.
          </p>
        </div>
      ) : (
        <>
          {/* Child selector — only shown if more than one child */}
          {children.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedChild?.id === child.id
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          )}

          {/* Tab bar */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          {selectedChild && (
            <div>
              {activeTab === "announcements" && <AnnouncementsPage />}
              {activeTab === "attendance" && (
                <AttendanceHistory
                  studentId={selectedChild.id!}
                  studentName={children.length > 1 ? selectedChild.name : undefined}
                />
              )}
              {activeTab === "renewal" && (
                <RenewalStatus
                  studentId={selectedChild.id!}
                  studentName={children.length > 1 ? selectedChild.name : undefined}
                />
              )}
              {activeTab === "belts" && (
                <BeltHistory
                  studentId={selectedChild.id!}
                  studentName={children.length > 1 ? selectedChild.name : undefined}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
```

---

## Step 7 — Create the Instructor Portal

### 7a — Create `src/components/MainDashboard/InstructorDashboard/InstructorSidebar.tsx`

```typescript
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Megaphone,
  Award,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

export type InstructorView =
  | "home"
  | "attendance"
  | "students"
  | "announcements"
  | "belts"
  | "renewals";

const NAV_ITEMS: { icon: React.ElementType; label: string; view: InstructorView }[] = [
  { icon: LayoutDashboard, label: "Dashboard", view: "home" },
  { icon: CalendarCheck, label: "Take Attendance", view: "attendance" },
  { icon: Users, label: "Students", view: "students" },
  { icon: Megaphone, label: "Announcements", view: "announcements" },
  { icon: Award, label: "Belt Tracking", view: "belts" },
  { icon: DollarSign, label: "Renewals", view: "renewals" },
];

interface Props {
  activeView: InstructorView;
  setActive: (view: InstructorView) => void;
}

export const InstructorSidebar = ({ activeView, setActive }: Props) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative flex flex-col h-screen bg-gray-900 text-gray-200 border-r border-gray-800 transition-[width] duration-300 ease-in-out flex-shrink-0 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
        {!collapsed && (
          <span className="text-white font-bold font-heading text-lg tracking-wide">
            TaeKwonTrack
          </span>
        )}
        {collapsed && (
          <span className="text-primary font-bold text-xl mx-auto">T</span>
        )}
      </div>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600 shadow"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.view;
          return (
            <div key={item.view} className="relative group">
              <button
                onClick={() => setActive(item.view)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-200 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
              {collapsed && (
                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow group-hover:opacity-100 whitespace-nowrap z-50">
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};
```

### 7b — Create `src/components/MainDashboard/InstructorDashboard/InstructorHome.tsx`

```typescript
import { useAuth } from "../../../context/AuthContext";
import { useSchool } from "../../../context/SchoolContext";
import { CalendarCheck, Users, Megaphone, Award } from "lucide-react";

interface Props {
  onViewChange: (view: string) => void;
}

export const InstructorHome = ({ onViewChange }: Props) => {
  const { user } = useAuth();
  const { students } = useSchool();

  const quickActions = [
    { label: "Take Attendance", color: "bg-blue-600 hover:bg-blue-700", view: "attendance", icon: CalendarCheck },
    { label: "View Students", color: "bg-green-600 hover:bg-green-700", view: "students", icon: Users },
    { label: "Announcements", color: "bg-purple-600 hover:bg-purple-700", view: "announcements", icon: Megaphone },
    { label: "Belt Tracking", color: "bg-yellow-600 hover:bg-yellow-700", view: "belts", icon: Award },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Welcome, {user?.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Instructor dashboard</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Students</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => onViewChange(action.view)}
              className={`${action.color} text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2`}
            >
              <action.icon size={15} />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### 7c — Create `src/components/MainDashboard/InstructorDashboard/InstructorDashboard.tsx`

```typescript
import { useState } from "react";
import { Search, Bell, ChevronDown, LogOut, User } from "lucide-react";
import { InstructorSidebar, InstructorView } from "./InstructorSidebar";
import { InstructorHome } from "./InstructorHome";
import { TakeAttendance } from "../../AccountDashboards/AdminFeatures/AttendanceRecords/TakeAttendance";
import { StudentListPage } from "../../AccountDashboards/AdminFeatures/StudentView/StudentListPage";
import { AnnouncementsPage } from "../../../pages/AnnouncementsPage";
import { BeltTrackingPage } from "../../../pages/BeltTrackingPage";
import { StudentRenewalsPage } from "../../AccountDashboards/AdminFeatures/StudentRenewals/StudentRenewalsPage";
import { ViewErrorBoundary } from "../../ui/ViewErrorBoundary";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const VIEW_TITLES: Record<InstructorView, string> = {
  home: "Dashboard",
  attendance: "Take Attendance",
  students: "Students",
  announcements: "Announcements",
  belts: "Belt Tracking",
  renewals: "Renewal Management",
};

export const InstructorDashboard = () => {
  const [activeView, setActiveView] = useState<InstructorView>("home");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const renderContent = () => {
    if (activeView === "home") {
      return <InstructorHome onViewChange={(v) => setActiveView(v as InstructorView)} />;
    }
    const views: Partial<Record<InstructorView, React.ReactNode>> = {
      attendance: <TakeAttendance />,
      students: <StudentListPage />,
      announcements: <AnnouncementsPage />,
      belts: <BeltTrackingPage />,
      renewals: <StudentRenewalsPage />,
    };
    return (
      <ViewErrorBoundary viewName={VIEW_TITLES[activeView]}>
        {views[activeView] ?? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Coming soon.
          </div>
        )}
      </ViewErrorBoundary>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <InstructorSidebar setActive={setActiveView} activeView={activeView} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shrink-0 z-20">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-72">
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-500 w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <Bell size={18} />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                  {user?.name?.charAt(0) || "I"}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.name || "Instructor"}
                </span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={14} /> Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <span>Dashboard</span>
            {activeView !== "home" && (
              <>
                <span>/</span>
                <span>{VIEW_TITLES[activeView]}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">
            {VIEW_TITLES[activeView]}
          </h1>
        </div>

        <main className="flex-1 overflow-y-auto p-6">{renderContent()}</main>
      </div>
    </div>
  );
};
```

---

## Step 8 — Create simple shell for Student and Parent portals

### 8a — Create `src/components/Portal/PortalShell.tsx`

```typescript
import { useState } from "react";
import { Search, Bell, ChevronDown, LogOut, Megaphone, CalendarCheck, DollarSign, Award, LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ViewErrorBoundary } from "../ui/ViewErrorBoundary";

export type PortalView = "home" | "announcements" | "attendance" | "renewal" | "belts";

const NAV_ITEMS: { icon: React.ElementType; label: string; view: PortalView }[] = [
  { icon: LayoutDashboard, label: "Home", view: "home" },
  { icon: Megaphone, label: "Announcements", view: "announcements" },
  { icon: CalendarCheck, label: "Attendance", view: "attendance" },
  { icon: DollarSign, label: "Membership", view: "renewal" },
  { icon: Award, label: "Belt History", view: "belts" },
];

const VIEW_TITLES: Record<PortalView, string> = {
  home: "Home",
  announcements: "Announcements",
  attendance: "Attendance",
  renewal: "Membership",
  belts: "Belt History",
};

interface Props {
  children: (activeView: PortalView, setActiveView: (v: PortalView) => void) => React.ReactNode;
  portalLabel: string;
}

export const PortalShell = ({ children, portalLabel }: Props) => {
  const [activeView, setActiveView] = useState<PortalView>("home");
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`relative flex flex-col h-screen bg-gray-900 text-gray-200 border-r border-gray-800 transition-[width] duration-300 ease-in-out flex-shrink-0 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          {!collapsed && (
            <span className="text-white font-bold font-heading text-lg tracking-wide">
              TaeKwonTrack
            </span>
          )}
          {collapsed && <span className="text-primary font-bold text-xl mx-auto">T</span>}
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600 shadow"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {!collapsed && (
          <div className="px-4 py-2 border-b border-gray-800">
            <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
              {portalLabel}
            </span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.view;
            return (
              <div key={item.view} className="relative group">
                <button
                  onClick={() => setActiveView(item.view)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gray-800 text-white"
                      : "text-gray-200 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <item.icon size={18} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
                {collapsed && (
                  <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow group-hover:opacity-100 whitespace-nowrap z-50">
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shrink-0 z-20">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-72">
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-500 w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <Bell size={18} />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                  {user?.name?.charAt(0) || "?"}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.name}
                </span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={14} /> Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <span>Dashboard</span>
            {activeView !== "home" && (
              <>
                <span>/</span>
                <span>{VIEW_TITLES[activeView]}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">
            {VIEW_TITLES[activeView]}
          </h1>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <ViewErrorBoundary viewName={VIEW_TITLES[activeView]}>
            {children(activeView, setActiveView)}
          </ViewErrorBoundary>
        </main>
      </div>
    </div>
  );
};
```

---

## Step 9 — Update `src/pages/Dashboard.tsx`

Replace the entire file with the following:

```typescript
import { MainDashboard } from "../components/MainDashboard/MainDashboard";
import { useAuth } from "../context/AuthContext";
import { SchoolProvider } from "../context/SchoolContext";
import { StudentRenewalsProvider } from "../context/StudentRenewalContext";
import { AttendanceProvider } from "../context/AttendanceContext";
import { ClassProvider } from "../context/ClassContext";
import { BeltProvider } from "../context/BeltContext";
import { InventoryProvider } from "../context/InventoryContext";
import { ProgramProvider } from "../context/ProgramContext";
import { AnnouncementProvider } from "../context/AnnouncementContext";
import { UserRole } from "../types/user";
import { Profile } from "../components/AccountDashboards/AdminFeatures/Profile/Profile";
import { InstructorDashboard } from "../components/MainDashboard/InstructorDashboard/InstructorDashboard";
import { PortalShell, PortalView } from "../components/Portal/PortalShell";
import { StudentPortal } from "../components/Portal/StudentPortal";
import { ParentPortal } from "../components/Portal/ParentPortal";
import { AttendanceHistory } from "../components/Portal/AttendanceHistory";
import { RenewalStatus } from "../components/Portal/RenewalStatus";
import { BeltHistory } from "../components/Portal/BeltHistory";
import { AnnouncementsPage } from "./AnnouncementsPage";

// Shared provider stack for all roles that need school + announcements data
const SchoolAnnouncementWrapper = ({ children }: { children: React.ReactNode }) => (
  <SchoolProvider>
    <AnnouncementProvider>{children}</AnnouncementProvider>
  </SchoolProvider>
);

// Full provider stack for instructors (needs renewals, attendance, belts)
const InstructorWrapper = ({ children }: { children: React.ReactNode }) => (
  <SchoolProvider>
    <ProgramProvider>
      <StudentRenewalsProvider>
        <AttendanceProvider>
          <BeltProvider>
            <AnnouncementProvider>{children}</AnnouncementProvider>
          </BeltProvider>
        </AttendanceProvider>
      </StudentRenewalsProvider>
    </ProgramProvider>
  </SchoolProvider>
);

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case UserRole.Admin:
      return (
        <SchoolProvider>
          <ProgramProvider>
            <StudentRenewalsProvider>
              <AttendanceProvider>
                <ClassProvider>
                  <BeltProvider>
                    <InventoryProvider>
                      <AnnouncementProvider>
                        <MainDashboard />
                      </AnnouncementProvider>
                    </InventoryProvider>
                  </BeltProvider>
                </ClassProvider>
              </AttendanceProvider>
            </StudentRenewalsProvider>
          </ProgramProvider>
        </SchoolProvider>
      );

    case UserRole.Instructor:
      return (
        <InstructorWrapper>
          <InstructorDashboard />
        </InstructorWrapper>
      );

    case UserRole.Student:
      return (
        <SchoolAnnouncementWrapper>
          <PortalShell portalLabel="Student Portal">
            {(activeView: PortalView, setActiveView) => {
              if (activeView === "home" || activeView === "attendance") {
                return <StudentPortal />;
              }
              if (activeView === "announcements") return <AnnouncementsPage />;
              if (activeView === "attendance") return <AttendanceHistory studentId={user.id ?? ""} />;
              if (activeView === "renewal") return <RenewalStatus studentId={user.id ?? ""} />;
              if (activeView === "belts") return <BeltHistory studentId={user.id ?? ""} />;
              return null;
            }}
          </PortalShell>
        </SchoolAnnouncementWrapper>
      );

    case UserRole.Parent:
      return (
        <SchoolAnnouncementWrapper>
          <PortalShell portalLabel="Parent Portal">
            {(activeView: PortalView) => {
              if (activeView === "home" || activeView === "announcements") {
                return <ParentPortal />;
              }
              return <ParentPortal />;
            }}
          </PortalShell>
        </SchoolAnnouncementWrapper>
      );

    default:
      return <Profile />;
  }
};

export default Dashboard;
```

---

## Step 10 — Verify `src/types/user.ts` has all required roles

Open `src/types/user.ts` and confirm the `UserRole` enum includes all of these values. If any are missing, add them:

```typescript
export enum UserRole {
  Parent = "parent",
  Student = "student",
  Instructor = "instructor",
  Admin = "admin",
  Other = "other",
}
```

---

## Verification checklist

After completing all steps, confirm:

- [ ] SQL ran without errors in Supabase — `parent_students` table exists
- [ ] `src/types/portal.ts` exists
- [ ] `src/api/PortalRequests/portalRequests.ts` exists
- [ ] `src/components/Portal/AttendanceHistory.tsx` exists
- [ ] `src/components/Portal/RenewalStatus.tsx` exists
- [ ] `src/components/Portal/BeltHistory.tsx` exists
- [ ] `src/components/Portal/StudentPortal.tsx` exists
- [ ] `src/components/Portal/ParentPortal.tsx` exists
- [ ] `src/components/Portal/PortalShell.tsx` exists
- [ ] `src/components/MainDashboard/InstructorDashboard/InstructorSidebar.tsx` exists
- [ ] `src/components/MainDashboard/InstructorDashboard/InstructorHome.tsx` exists
- [ ] `src/components/MainDashboard/InstructorDashboard/InstructorDashboard.tsx` exists
- [ ] `src/pages/Dashboard.tsx` has been replaced with the new version
- [ ] App compiles with no TypeScript errors (`tsc --noEmit`)
- [ ] Logging in as admin shows the full admin dashboard unchanged
- [ ] Logging in as instructor shows the instructor dashboard with attendance, announcements, belts, and renewals
- [ ] Logging in as student shows the student portal with their own data
- [ ] Logging in as parent shows the parent portal — if no children are linked, a "contact your school" message appears
- [ ] Admin can link a parent to a student by inserting a row into `parent_students` in Supabase (manual for now)
