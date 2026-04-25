# Parent-Student Linking UI

Admin can link parent accounts to students and unlink them from the dashboard.
No new SQL required — uses the existing `parent_students` table.

Follow every step in order. Do not skip or combine steps.

---

## Step 1 — Create `src/api/PortalRequests/parentLinkRequests.ts`

```typescript
import { supabase } from "../supabase";
import { UserProfile } from "../../types/user";

export interface ParentLink {
  id: string;
  parent_id: string;
  student_id: string;
  school_id: string;
  created_at: string;
  parent?: UserProfile;
}

// Get all parent links for a specific student
export async function getParentLinksForStudent(studentId: string): Promise<ParentLink[]> {
  const { data, error } = await supabase
    .from("parent_students")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// Look up a user by email to find a parent account
export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Link a parent to a student
export async function linkParentToStudent(
  parentId: string,
  studentId: string,
  schoolId: string,
): Promise<void> {
  const { error } = await supabase.from("parent_students").insert({
    parent_id: parentId,
    student_id: studentId,
    school_id: schoolId,
  });

  if (error) throw error;
}

// Unlink a parent from a student
export async function unlinkParentFromStudent(linkId: string): Promise<void> {
  const { error } = await supabase
    .from("parent_students")
    .delete()
    .eq("id", linkId);

  if (error) throw error;
}

// Get all students linked to a parent
export async function getStudentsForParent(parentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("parent_students")
    .select("student_id")
    .eq("parent_id", parentId);

  if (error) throw error;
  return (data ?? []).map((r) => r.student_id);
}
```

---

## Step 2 — Create `src/components/AccountDashboards/AdminFeatures/StudentView/ManageParentLinks.tsx`

```typescript
import React, { useEffect, useState } from "react";
import { Student, UserProfile } from "../../../../types/user";
import { useSchool } from "../../../../context/SchoolContext";
import {
  ParentLink,
  getParentLinksForStudent,
  findUserByEmail,
  linkParentToStudent,
  unlinkParentFromStudent,
} from "../../../../api/PortalRequests/parentLinkRequests";
import { AppConfirmModal } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import { Button } from "../../../ui/button";
import { Trash2, UserPlus, Users } from "lucide-react";

interface Props {
  student: Student;
}

export const ManageParentLinks: React.FC<Props> = ({ student }) => {
  const { schoolId } = useSchool();
  const [links, setLinks] = useState<ParentLink[]>([]);
  const [parentDetails, setParentDetails] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add parent form
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  // Unlink confirm
  const [unlinkTarget, setUnlinkTarget] = useState<ParentLink | null>(null);
  const [unlinkLoading, setUnlinkLoading] = useState(false);

  const loadLinks = async () => {
    if (!student.id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getParentLinksForStudent(student.id);
      setLinks(data);

      // Fetch parent details for each link
      if (data.length > 0) {
        const ids = data.map((l) => l.parent_id);
        const { data: users, error: userError } = await (
          await import("../../../../api/supabase")
        ).supabase
          .from("users")
          .select("*")
          .in("id", ids);

        if (!userError && users) {
          const map: Record<string, UserProfile> = {};
          users.forEach((u: UserProfile & { id: string }) => {
            map[u.id!] = u;
          });
          setParentDetails(map);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load parent links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSearchError(null);
    setSearching(true);

    try {
      const user = await findUserByEmail(email.trim());
      if (!user) {
        setSearchError("No account found with that email. The parent needs to sign up first.");
        return;
      }

      // Check not already linked
      const alreadyLinked = links.some((l) => l.parent_id === user.id);
      if (alreadyLinked) {
        setSearchError("This parent is already linked to this student.");
        return;
      }

      setLinking(true);
      await linkParentToStudent(user.id!, student.id!, schoolId);
      setEmail("");
      await loadLinks();
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Failed to link parent.");
    } finally {
      setSearching(false);
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!unlinkTarget) return;
    setUnlinkLoading(true);
    try {
      await unlinkParentFromStudent(unlinkTarget.id);
      setUnlinkTarget(null);
      await loadLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink parent.");
    } finally {
      setUnlinkLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Users size={15} className="text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-800">
          Linked Parents — {student.name}
        </h4>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Current links */}
      {loading ? (
        <div className="flex items-center justify-center h-12">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : links.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No parents linked yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {links.map((link) => {
            const parent = parentDetails[link.parent_id];
            return (
              <div
                key={link.id}
                className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {parent?.name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-gray-400">{parent?.email ?? link.parent_id}</p>
                </div>
                <button
                  onClick={() => setUnlinkTarget(link)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                  title="Unlink parent"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add parent form */}
      <form onSubmit={handleLink} className="flex flex-col gap-2 pt-2 border-t border-gray-100">
        <label className="text-xs font-medium text-gray-600">
          Link a parent by their account email
        </label>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="parent@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSearchError(null);
            }}
            className="flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={searching || linking || !email.trim()}
            className="flex items-center gap-1.5 shrink-0"
          >
            <UserPlus size={13} />
            {searching || linking ? "Linking..." : "Link"}
          </Button>
        </div>
        {searchError && (
          <p className="text-xs text-red-600">{searchError}</p>
        )}
        <p className="text-xs text-gray-400">
          The parent must already have a TaeKwonTrack account before they can be linked.
        </p>
      </form>

      {/* Unlink confirm */}
      <AppConfirmModal
        open={!!unlinkTarget}
        onOpenChange={(open) => { if (!open && !unlinkLoading) setUnlinkTarget(null); }}
        title="Unlink Parent?"
        description={`Remove the link between ${student.name} and ${
          unlinkTarget ? (parentDetails[unlinkTarget.parent_id]?.name ?? "this parent") : ""
        }? The parent account will not be deleted.`}
        onConfirm={handleUnlink}
        loading={unlinkLoading}
        confirmLabel="Unlink"
      />
    </div>
  );
};
```

---

## Step 3 — Edit `src/components/AccountDashboards/AdminFeatures/StudentView/StudentListPage.tsx`

### 3a — Add import near the top:
```typescript
import { ManageParentLinks } from "./ManageParentLinks";
```

### 3b — Add state for the parent management panel after the existing `deleteConfirm` state:
```typescript
const [parentTarget, setParentTarget] = useState<Student | null>(null);
```

### 3c — Add a "Parents" button to the actions column in the table. Find the existing Edit and Delete buttons in the `<td>` for actions and add this button between them:
```typescript
<button
  onClick={() => setParentTarget(student)}
  className="text-purple-600 hover:underline focus:outline-none mr-2"
>
  Parents
</button>
```

### 3d — Add the ManageParentLinks panel below the editingUser block and above the table. Find the closing `</div>` after the editingUser block and insert:
```typescript
{parentTarget && (
  <div className="mb-6 border p-4 rounded bg-white shadow-md">
    <ManageParentLinks student={parentTarget} />
    <button
      className="mt-4 px-4 py-2 text-sm text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
      onClick={() => setParentTarget(null)}
    >
      Close
    </button>
  </div>
)}
```

---

## Verification checklist

- [ ] `src/api/PortalRequests/parentLinkRequests.ts` exists
- [ ] `src/components/AccountDashboards/AdminFeatures/StudentView/ManageParentLinks.tsx` exists
- [ ] `StudentListPage.tsx` has a "Parents" button per student row
- [ ] Clicking "Parents" opens the link panel for that student
- [ ] Admin can search by email and link a parent who has an existing account
- [ ] Linked parents appear in the list with name and email
- [ ] Admin can unlink a parent with confirmation
- [ ] App compiles with no TypeScript errors (`tsc --noEmit`)
