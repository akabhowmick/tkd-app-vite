import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { useStudentRenewals } from "../../../../context/StudentRenewalContext";
import { useSchool } from "../../../../context/SchoolContext";
import { usePrograms } from "../../../../context/ProgramContext";
import { useNavigate } from "react-router-dom";
import { RenewalPeriodWithUiStatus } from "../../../../types/student_renewal";
import { RenewalCard } from "./RenewalCard";

type CalendarEvent = {
  type: "expiration" | "installment";
  studentId: string;   // for navigation only, never displayed
  periodId: string;    // for navigation only, never displayed
  studentName: string;
  programName?: string; // expirations only
  amountDue?: number;   // installments only
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MAX_VISIBLE = 3;

function buildCalendarGrid(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (string | null)[] = Array(firstDay.getDay()).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(month + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    grid.push(`${year}-${m}-${day}`);
  }
  return grid;
}

function getTodayKey(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

export const RenewalsCalendar: React.FC = () => {
  const {
    grouped,
    deletePeriod,
    quitRenewal,
    markInstallmentPaid,
    addPayment,
    updatePeriod,
  } = useStudentRenewals();
  const { students } = useSchool();
  const { programs } = usePrograms();
  const navigate = useNavigate();

  const todayKey = getTodayKey();
  const todayDate = new Date();

  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  const studentMap = useMemo(() => {
    const m = new Map<string, string>();
    students.forEach((s) => { if (s.id) m.set(s.id, s.name); });
    return m;
  }, [students]);

  const programMap = useMemo(() => {
    const m = new Map<string, string>();
    programs.forEach((p) => m.set(p.program_id, p.name));
    return m;
  }, [programs]);

  const allPeriods = useMemo(
    () => Object.values(grouped).flat() as RenewalPeriodWithUiStatus[],
    [grouped],
  );

  // Build a map: YYYY-MM-DD → CalendarEvent[] (expirations first, then installments)
  const eventMap = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();

    const add = (key: string, event: CalendarEvent) => {
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(event);
    };

    allPeriods.forEach((period) => {
      if (!period) return;
      const studentName = studentMap.get(period.student_id) ?? "Unknown";
      const programName = period.program_id ? programMap.get(period.program_id) : undefined;

      // Renewal expiration event
      if (period.expiration_date) {
        const key = String(period.expiration_date).split("T")[0];
        add(key, {
          type: "expiration",
          studentId: period.student_id,
          periodId: period.period_id,
          studentName,
          programName,
        });
      }

      // Unpaid installment events — use !! to catch both null and undefined
      (period.payments ?? [])
        .filter((p) => !p.payment_date && !!p.due_date)
        .forEach((payment) => {
          const key = String(payment.due_date).split("T")[0];
          add(key, {
            type: "installment",
            studentId: period.student_id,
            periodId: period.period_id,
            studentName,
            amountDue: payment.amount_due,
          });
        });
    });

    return m;
  }, [allPeriods, studentMap, programMap]);

  const grid = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function shiftMonth(dir: -1 | 1) {
    const d = new Date(year, month + dir, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelectedKey(null);
    setSelectedPeriodId(null);
  }

  function closePanel() {
    setSelectedKey(null);
    setSelectedPeriodId(null);
  }

  const selectedEvents = selectedKey ? (eventMap.get(selectedKey) ?? []) : [];
  const selectedExpirations = selectedEvents.filter((e) => e.type === "expiration");
  const selectedInstallments = selectedEvents.filter((e) => e.type === "installment");

  // Derived — not state — so it stays in sync with grouped updates
  const managingPeriod = selectedPeriodId
    ? (allPeriods.find((p) => p.period_id === selectedPeriodId) ?? null)
    : null;

  return (
    <div className="space-y-4">
      {/* Hidden card mount — portals the Manage modal to document.body */}
      {managingPeriod && (
        <div className="hidden" aria-hidden="true">
          <RenewalCard
            period={managingPeriod}
            initialManageOpen={true}
            onAllModalsClosed={() => setSelectedPeriodId(null)}
            onMarkInstallmentPaid={markInstallmentPaid}
            onDelete={(id) => { deletePeriod(id); setSelectedPeriodId(null); }}
            onResolveAsQuit={(id) => { quitRenewal(id); setSelectedPeriodId(null); }}
            onRenew={(p) => navigate(`new?studentId=${p.student_id}&renewingPeriodId=${p.period_id}`)}
            onAddPayment={addPayment}
            onUpdatePeriod={updatePeriod}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header: legend + month navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          {/* Legend */}
          <div className="flex items-center gap-5 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-red-400 flex-shrink-0" />
              <span>Renewal End Date</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-green-500 flex-shrink-0" />
              <span>Payment Due</span>
            </div>
          </div>

          {/* Month nav */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => shiftMonth(-1)}
              className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={14} />
            </button>
            <h3 className="text-sm font-semibold text-gray-900 min-w-[120px] text-center">
              {monthLabel}
            </h3>
            <button
              onClick={() => shiftMonth(1)}
              className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Weekday header row */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wide"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border-l border-gray-200">
          {grid.map((dateKey, i) => {
            if (!dateKey) {
              return (
                <div
                  key={`pad-${i}`}
                  className="border-r border-b border-gray-200 min-h-[90px] bg-gray-50/50"
                />
              );
            }

            const events = eventMap.get(dateKey) ?? [];
            const visibleEvents = events.slice(0, MAX_VISIBLE);
            const overflow = events.length - MAX_VISIBLE;
            const isToday = dateKey === todayKey;
            const isSelected = selectedKey === dateKey;
            const hasEvents = events.length > 0;
            const dayNum = parseInt(dateKey.split("-")[2]);

            return (
              <div
                key={dateKey}
                onClick={() => {
                  if (hasEvents) {
                    if (isSelected) {
                      closePanel();
                    } else {
                      setSelectedKey(dateKey);
                      setSelectedPeriodId(null);
                    }
                  }
                }}
                className={cn(
                  "border-r border-b border-gray-200 min-h-[90px] p-1 flex flex-col transition-colors",
                  hasEvents ? "cursor-pointer hover:bg-gray-50" : "cursor-default",
                  isSelected && "bg-red-50/60 ring-inset ring-2 ring-primary",
                )}
                aria-label={`${dateKey}${events.length > 0 ? `, ${events.length} event${events.length !== 1 ? "s" : ""}` : ""}`}
              >
                {/* Day number */}
                <div className="flex justify-end mb-1 pr-0.5">
                  <span
                    className={cn(
                      "text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full",
                      isToday
                        ? "bg-primary text-white font-bold"
                        : "text-gray-600",
                    )}
                  >
                    {dayNum}
                  </span>
                </div>

                {/* Event chips */}
                <div className="flex flex-col gap-0.5 flex-1">
                  {visibleEvents.map((event, idx) => (
                    <div
                      key={`${event.periodId}-${event.type}-${idx}`}
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded truncate font-medium leading-tight",
                        event.type === "expiration"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800",
                      )}
                      title={event.studentName}
                    >
                      {event.studentName}
                    </div>
                  ))}
                  {overflow > 0 && (
                    <span className="text-xs text-gray-400 px-1.5">
                      +{overflow} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selectedKey && selectedEvents.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-900">
              {new Date(selectedKey + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h3>
            <button
              onClick={closePanel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close panel"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-5">
            {/* Renewals expiring */}
            {selectedExpirations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
                  Renewals Expiring — {selectedExpirations.length}
                </p>
                <div className="space-y-2">
                  {selectedExpirations.map((event, idx) => (
                    <button
                      key={`exp-${event.periodId}-${idx}`}
                      onClick={() => setSelectedPeriodId(event.periodId)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 border border-red-100 hover:border-red-300 hover:bg-red-100 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {event.studentName}
                        </p>
                        {event.programName && (
                          <p className="text-xs text-gray-500 truncate">{event.programName}</p>
                        )}
                      </div>
                      <span className="ml-3 flex-shrink-0 text-xs font-semibold text-red-600">
                        Manage →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Payments due */}
            {selectedInstallments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                  Payments Due — {selectedInstallments.length}
                </p>
                <div className="space-y-2">
                  {selectedInstallments.map((event, idx) => (
                    <button
                      key={`inst-${event.periodId}-${idx}`}
                      onClick={() => setSelectedPeriodId(event.periodId)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-green-50 border border-green-100 hover:border-green-300 hover:bg-green-100 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {event.studentName}
                        </p>
                        {event.amountDue !== undefined && (
                          <p className="text-xs text-gray-500">
                            ${event.amountDue.toLocaleString()} due
                          </p>
                        )}
                      </div>
                      <span className="ml-3 flex-shrink-0 text-xs font-semibold text-green-700">
                        Manage →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
