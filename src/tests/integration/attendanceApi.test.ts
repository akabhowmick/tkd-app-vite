import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAttendance,
  getAttendanceByDate,
  updateAttendance,
  deleteAttendance,
} from "../../api/Attendance/attendanceRequests";
import { supabase } from "../../api/supabase";

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

const fakeRecord = {
  id: "ar1",
  student_id: "s1",
  school_id: "sc1",
  date: "2025-08-01",
  status: "present" as const,
};

describe("createAttendance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upserts records and returns data", async () => {
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: [fakeRecord], error: null }),
    });
    const result = await createAttendance([
      { student_id: "s1", school_id: "sc1", date: "2025-08-01", status: "present" },
    ]);
    expect(result.error).toBeNull();
    expect(result.data).toEqual([fakeRecord]);
    expect(mockFrom).toHaveBeenCalledWith("attendance_records");
  });

  it("returns error without throwing", async () => {
    const err = new Error("Upsert failed");
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: null, error: err }),
    });
    const result = await createAttendance([]);
    expect(result.error).toBe(err);
  });
});

describe("getAttendanceByDate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns attendance records for the given school and date", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    });
    const eqMock = vi.fn().mockReturnThis();
    eqMock.mockReturnValueOnce({ eq: vi.fn().mockResolvedValue({ data: [fakeRecord], error: null }) });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: eqMock,
    });
    const result = await getAttendanceByDate("sc1", "2025-08-01");
    expect(result.data).toEqual([fakeRecord]);
    expect(result.error).toBeNull();
  });

  it("returns error without throwing", async () => {
    const err = new Error("DB error");
    const eqMock = vi.fn().mockReturnThis();
    eqMock.mockReturnValueOnce({ eq: vi.fn().mockResolvedValue({ data: null, error: err }) });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: eqMock,
    });
    const result = await getAttendanceByDate("sc1", "2025-08-01");
    expect(result.error).toBe(err);
  });
});

describe("updateAttendance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates status and returns data", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [fakeRecord], error: null }),
    });
    const result = await updateAttendance("ar1", "present");
    expect(result.error).toBeNull();
  });
});

describe("deleteAttendance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes and returns no error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const result = await deleteAttendance("ar1");
    expect(result.error).toBeNull();
  });
});
