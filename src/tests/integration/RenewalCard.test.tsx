import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RenewalCard } from "../../components/AccountDashboards/AdminFeatures/StudentRenewals/RenewalCard";
import { RenewalPeriodWithUiStatus } from "../../types/student_renewal";

// Mock SchoolContext so the component can find students
vi.mock("../../context/SchoolContext", () => ({
  useSchool: () => ({
    students: [{ id: "s1", name: "Alice Kim" }],
    schoolId: "sc1",
  }),
}));


const makePeriod = (
  overrides: Partial<RenewalPeriodWithUiStatus> = {},
): RenewalPeriodWithUiStatus => ({
  period_id: "p1",
  student_id: "s1",
  school_id: "sc1",
  duration_months: 3,
  expiration_date: "2025-12-01",
  number_of_classes: 2,
  status: "active",
  program_id: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  payments: [],
  total_due: 100,
  total_paid: 0,
  balance: 100,
  ui_status: "active",
  days_until_expiration: 103,
  status_message: "Active",
  next_unpaid_installment: null,
  is_milestone: false,
  ...overrides,
});

const noop = vi.fn();

// Badge span contains an icon + space + label split across text nodes.
// Use getAllByText with exact:false to match the label portion.
const getBadge = (label: string) =>
  screen.getAllByText((_content, element) => {
    return element?.tagName === "SPAN" && (element.textContent ?? "").includes(label);
  })[0];

describe("RenewalCard — badge states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Active badge for active period", () => {
    render(
      <RenewalCard
        period={makePeriod({ ui_status: "active", status_message: "Active" })}
        onMarkInstallmentPaid={noop}
        onDelete={noop}
      />,
    );
    expect(getBadge("Active")).toBeInTheDocument();
  });

  it("renders Paid badge for paid period", () => {
    render(
      <RenewalCard
        period={makePeriod({
          ui_status: "paid",
          status_message: "Fully paid",
          balance: 0,
          total_paid: 100,
        })}
        onMarkInstallmentPaid={noop}
        onDelete={noop}
      />,
    );
    expect(getBadge("Paid")).toBeInTheDocument();
  });

  it("renders Expiring Soon badge", () => {
    render(
      <RenewalCard
        period={makePeriod({ ui_status: "expiring_soon", status_message: "Expires in 5 days" })}
        onMarkInstallmentPaid={noop}
        onDelete={noop}
      />,
    );
    expect(getBadge("Expiring Soon")).toBeInTheDocument();
  });

  it("renders Grace Period badge", () => {
    render(
      <RenewalCard
        period={makePeriod({
          ui_status: "grace_period",
          status_message: "3 days overdue — grace period",
        })}
        onMarkInstallmentPaid={noop}
        onDelete={noop}
      />,
    );
    expect(getBadge("Grace Period")).toBeInTheDocument();
  });

  it("renders Expired badge", () => {
    render(
      <RenewalCard
        period={makePeriod({ ui_status: "expired", status_message: "Expired 10 days ago" })}
        onMarkInstallmentPaid={noop}
        onDelete={noop}
      />,
    );
    expect(getBadge("Expired")).toBeInTheDocument();
  });
});

describe("RenewalCard — balance display", () => {
  it("shows balance owed when balance > 0", () => {
    render(<RenewalCard period={makePeriod({ balance: 50 })} onMarkInstallmentPaid={noop} onDelete={noop} />);
    expect(screen.getByText(/Balance Owed/)).toBeInTheDocument();
  });

  it("hides balance section when balance is zero", () => {
    render(
      <RenewalCard
        period={makePeriod({ balance: 0, total_paid: 100, ui_status: "paid" })}
        onMarkInstallmentPaid={noop}
        onDelete={noop}
      />,
    );
    expect(screen.queryByText(/Balance Owed/)).not.toBeInTheDocument();
  });
});

describe("RenewalCard — student name", () => {
  it("shows student name when student is found", () => {
    render(<RenewalCard period={makePeriod()} onMarkInstallmentPaid={noop} onDelete={noop} />);
    expect(screen.getByText(/Alice Kim/)).toBeInTheDocument();
  });

  it('shows "Unknown Student" fallback when student is not in list', () => {
    render(
      <RenewalCard
        period={makePeriod({ student_id: "unknown-id" })}
        onMarkInstallmentPaid={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByText(/Unknown Student/)).toBeInTheDocument();
  });
});

describe("RenewalCard — payment history toggle", () => {
  it("toggles payment history on click", () => {
    const period = makePeriod({
      payments: [
        {
          payment_id: "pay1",
          period_id: "p1",
          student_id: "s1",
          due_date: null,
          payment_date: "2025-08-01",
          amount_due: 100,
          amount_paid: 50,
          installment_number: 1,
          paid_to: "Admin",
          created_at: "2025-08-01T00:00:00Z",
        },
      ],
    });
    render(<RenewalCard period={period} onMarkInstallmentPaid={noop} onDelete={noop} />);

    const toggleBtn = screen.getByText(/1 payment/);
    expect(screen.queryByText(/Installment 1/)).not.toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Installment 1/)).toBeInTheDocument();
  });
});

describe("RenewalCard — status message", () => {
  it("renders the status_message in the subtitle", () => {
    render(
      <RenewalCard
        period={makePeriod({ status_message: "Expires in 5 days" })}
        onMarkInstallmentPaid={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByText("Expires in 5 days")).toBeInTheDocument();
  });
});
