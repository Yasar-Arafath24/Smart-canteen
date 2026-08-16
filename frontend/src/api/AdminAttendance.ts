import { api } from "./client";

export interface AdminAttendance {
  id: number;
  staff_id: number;
  staff_name: string;
  staff_email: string | null;
  clock_in: string;
  clock_out: string | null;
  worked_seconds: number;
  is_current: boolean;
}

export async function getAllStaffAttendance(): Promise<
  AdminAttendance[]
> {
  const response =
    await api.get<AdminAttendance[]>(
      "/staff/attendance/",
    );

  return response.data;
}