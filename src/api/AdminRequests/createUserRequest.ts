import { supabase } from "../supabase";

export type CreateUserRole = "student" | "parent" | "instructor";

export interface CreateUserPayload {
  action: "create" | "invite";
  email: string;
  name: string;
  role: CreateUserRole;
  school_id: string;
  password?: string; // only required for action=create
}

export interface CreateUserResult {
  success: boolean;
  user_id?: string;
  error?: string;
}

export async function createOrInviteUser(
  payload: CreateUserPayload,
): Promise<CreateUserResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) throw new Error("Not authenticated");

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_API_URL}/functions/v1/create-user`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to create user");
  return json;
}
