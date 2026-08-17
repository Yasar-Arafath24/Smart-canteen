import { api } from "./client";

export interface ActivityLog {
  id: number;

  actor_id: number | null;
  actor_name: string | null;

  action: string;

  entity_type: string | null;
  entity_id: number | null;

  description: string;
  created_at: string;
}

export interface ActivityFilters {
  limit?: number;
  offset?: number;
  action?: string;
  entity_type?: string;
  actor_id?: number;
}

export async function getActivity(
  filters: ActivityFilters = {},
): Promise<ActivityLog[]> {
  const response =
    await api.get<ActivityLog[]>(
      "/activity/",
      {
        params: filters,
      },
    );

  return response.data;
}