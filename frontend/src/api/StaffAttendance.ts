import { api } from "./client";

export interface AttendanceRecord {
  id: number;
  staff_id: number;
  clock_in: string;
  clock_out: string | null;
}

export interface AttendanceStatus {
  is_clocked_in: boolean;
  attendance: AttendanceRecord | null;
  worked_seconds: number;
}

export async function clockIn(): Promise<AttendanceRecord> {
  const response = await api.post<AttendanceRecord>(
    "/staff/attendance/clock-in",
  );

  return response.data;
}

export async function clockOut(): Promise<AttendanceRecord> {
  const response = await api.post<AttendanceRecord>(
    "/staff/attendance/clock-out",
  );

  return response.data;
}

export async function getMyAttendanceStatus(): Promise<AttendanceStatus> {
  const response = await api.get<AttendanceStatus>(
    "/staff/attendance/me",
  );

  return response.data;
}

export async function getMyAttendanceHistory(): Promise<AttendanceRecord[]> {
  const response = await api.get<AttendanceRecord[]>(
    "/staff/attendance/history",
  );

  return response.data;
}