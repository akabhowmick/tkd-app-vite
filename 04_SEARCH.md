# Dashboard Search

Command-palette style search modal triggered by clicking the search bar
or pressing Cmd+K / Ctrl+K. Searches students, renewals, and sales
using data already loaded in context — no new API calls.

Follow every step in order. Do not skip or combine steps.

---

## Step 1 — Create `src/components/MainDashboard/Search/SearchModal.tsx`

```typescript
import { useEffect, useRef, useState, useMemo } from "react";
import { useSchool } from "../../../context/SchoolContext";
import { useStudentRenewals } from "../../../context/StudentRenewalContext";
import { Search, User, RefreshCw, DollarSign, X } from "lucide-react";

type ResultType = "student" | "renewal" | "sale";

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  view: string; // which dashboard view to navigate to
}

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

const TYPE_ICONS: Record<ResultType, React.ElementType> = {
  student: User,
  renewal: RefreshCw,
  sale: DollarSign,
};

const TYPE_LABELS: Record<ResultType, string> = {
  student: "Student",
  renewal: "Renewal",
  sale: "Sale",
};

const TYPE_COLORS: Record<ResultType, string> = {
  student: "text-purple-600 bg-purple-50",
  renewal: "text-blue-600 bg-blue-50",
  sale: "text-green-600 bg-green-50",
};

export const SearchModal = ({ open, onClose, onNavigate }: Props) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { students } = useSchool();
  const { periods } = useStudentRenewals();

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Student name lookup for renewals
  const studentMap = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s.name])),
    [students],
  );

  const results = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const out: SearchResult[] = [];

    // Students
    students
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((s) =>
        out.push({
          id: `student-${s.id}`,
          type: "student",
          title: s.name,
          subtitle: s.email || "No email",
          view: "students",
        }),
      );

    // Renewals — search by student name
    periods
      .filter((p) => {
        const name = studentMap[p.student_id] ?? "";
        return name.toLowerCase().includes(q);
      })
      .slice(0, 5)
      .forEach((p) =>
        out.push({
          id: `renewal-${p.period_id}`,
          type: "renewal",
          title: studentMap[p.student_id] ?? "Unknown Student",
          subtitle: p.expiration_date
            ? `Expires ${new Date(p.expiration_date + "T12:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}`
            : "Milestone program",
          view: "renewals",
        }),
      );

    return out;
  }, [query, students, periods, studentMap]);

  // Group results by type
  const grouped = useMemo(() => {
    const map: Partial<Record<ResultType, SearchResult[]>> = {};
    results.forEach((r) => {
      if (!map[r.type]) map[r.type] = [];
      map[r.type]!.push(r);
    });
    return map;
  }, [results]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-24 z-50 w-full max-w-xl -translate-x-1/2 px-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
            <Search size={17} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search students, renewals..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={15} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-400 border border-gray-200 rounded">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {query.length < 2 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Type at least 2 characters to search
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No results for "{query}"
              </div>
            ) : (
              <div className="py-2">
                {(Object.entries(grouped) as [ResultType, SearchResult[]][]).map(
                  ([type, items]) => (
                    <div key={type}>
                      <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {TYPE_LABELS[type]}s
                      </p>
                      {items.map((result) => {
                        const Icon = TYPE_ICONS[result.type];
                        return (
                          <button
                            key={result.id}
                            onClick={() => {
                              onNavigate(result.view);
                              onClose();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div
                              className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[result.type]}`}
                            >
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {result.title}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{result.subtitle}</p>
                            </div>
                            <span className="ml-auto text-xs text-gray-300 shrink-0">
                              Go →
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {results.length > 0 ? `${results.length} result${results.length !== 1 ? "s" : ""}` : ""}
            </span>
            <span className="text-xs text-gray-400">Click a result to navigate</span>
          </div>
        </div>
      </div>
    </>
  );
};
```

---

## Step 2 — Edit `src/components/MainDashboard/MainDashboard.tsx`

### 2a — Add import:
```typescript
import { SearchModal } from "./Search/SearchModal";
```

### 2b — Add state inside the `MainDashboard` component alongside the existing state:
```typescript
const [searchOpen, setSearchOpen] = useState(false);
```

### 2c — Add the Cmd+K keyboard shortcut. Add this `useEffect` inside the component (import `useEffect` from react if not already imported):
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, []);
```

### 2d — Replace the existing static search bar div with a clickable button. Find this block:
```typescript
<div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-72">
  <Search size={16} className="text-gray-500" />
  <input
    type="text"
    placeholder="Search..."
    className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-500 w-full"
  />
</div>
```

Replace it with:
```typescript
<button
  onClick={() => setSearchOpen(true)}
  className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-72 hover:bg-gray-200 transition-colors text-left"
>
  <Search size={16} className="text-gray-500 shrink-0" />
  <span className="text-sm text-gray-400 flex-1">Search...</span>
  <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-400 border border-gray-300 rounded bg-white">
    ⌘K
  </kbd>
</button>
```

### 2e — Add the SearchModal just before the closing `</div>` of the return statement:
```typescript
<SearchModal
  open={searchOpen}
  onClose={() => setSearchOpen(false)}
  onNavigate={handleViewChange}
/>
```

---

## Verification checklist

- [ ] `src/components/MainDashboard/Search/SearchModal.tsx` exists
- [ ] `MainDashboard.tsx` imports and renders `SearchModal`
- [ ] The search bar in the header is now a clickable button showing ⌘K hint
- [ ] Clicking the search bar opens the modal
- [ ] Pressing Cmd+K (Mac) or Ctrl+K (Windows) opens the modal
- [ ] Pressing Escape closes the modal
- [ ] Typing a student name returns matching students
- [ ] Typing a student name also returns matching renewals
- [ ] Clicking a result navigates to the correct dashboard view and closes the modal
- [ ] App compiles with no TypeScript errors (`tsc --noEmit`)
