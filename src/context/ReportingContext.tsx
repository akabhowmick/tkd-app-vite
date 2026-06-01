import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAsyncState } from "../hooks/useAsyncState";
import {
  getWeeklyAttendance,
  getRevenueByCategory,
  getRevenueByPaymentType,
  getStudentGrowth,
  getExpiringRenewals,
  WeeklyAttendance,
  CategoryRevenue,
  PaymentTypeRevenue,
  StudentGrowth,
  ExpiringRenewal,
} from "../api/ReportingRequests/reportingRequests";
import { useSchool } from "./SchoolContext";

interface ReportingContextType {
  attendance: WeeklyAttendance[];
  attendanceLoading: boolean;
  attendanceError: string | null;

  categoryRevenue: CategoryRevenue[];
  paymentRevenue: PaymentTypeRevenue[];
  revenueLoading: boolean;
  revenueError: string | null;

  growth: StudentGrowth[];
  growthLoading: boolean;
  growthError: string | null;

  expiring: ExpiringRenewal[];
  expiringLoading: boolean;
  expiringError: string | null;
}

const ReportingContext = createContext<ReportingContextType | undefined>(undefined);

export const ReportingProvider = ({ children }: { children: ReactNode }) => {
  const { schoolId } = useSchool();

  const [attendance, setAttendance] = useState<WeeklyAttendance[]>([]);
  const attendanceAsync = useAsyncState();

  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([]);
  const [paymentRevenue, setPaymentRevenue] = useState<PaymentTypeRevenue[]>([]);
  const revenueAsync = useAsyncState();

  const [growth, setGrowth] = useState<StudentGrowth[]>([]);
  const growthAsync = useAsyncState();

  const [expiring, setExpiring] = useState<ExpiringRenewal[]>([]);
  const expiringAsync = useAsyncState();

  useEffect(() => {
    if (!schoolId) return;

    attendanceAsync.load(async () => {
      const data = await getWeeklyAttendance(schoolId);
      setAttendance(data);
    }, "Failed to load attendance data");

    revenueAsync.load(async () => {
      const [cat, pay] = await Promise.all([
        getRevenueByCategory(schoolId),
        getRevenueByPaymentType(schoolId),
      ]);
      setCategoryRevenue(cat);
      setPaymentRevenue(pay);
    }, "Failed to load revenue data");

    growthAsync.load(async () => {
      const data = await getStudentGrowth(schoolId);
      setGrowth(data);
    }, "Failed to load student growth data");

    expiringAsync.load(async () => {
      const data = await getExpiringRenewals(schoolId, 30);
      setExpiring(data);
    }, "Failed to load expiring renewals");
  }, [schoolId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ReportingContext.Provider
      value={{
        attendance,
        attendanceLoading: attendanceAsync.loading,
        attendanceError: attendanceAsync.error,
        categoryRevenue,
        paymentRevenue,
        revenueLoading: revenueAsync.loading,
        revenueError: revenueAsync.error,
        growth,
        growthLoading: growthAsync.loading,
        growthError: growthAsync.error,
        expiring,
        expiringLoading: expiringAsync.loading,
        expiringError: expiringAsync.error,
      }}
    >
      {children}
    </ReportingContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useReporting = (): ReportingContextType => {
  const ctx = useContext(ReportingContext);
  if (!ctx) throw new Error("useReporting must be used within ReportingProvider");
  return ctx;
};
