import type { MonitoringUser, MonitoringStatus, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

async function makeRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token ?? '';

    const response = await fetch(`${EDGE_FUNCTION_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return { data: null, error: errorBody.error ?? `Request failed (${response.status})` };
    }

    const data = await response.json();
    return { data: data as T, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function fetchAllUsers(): Promise<{ data: MonitoringUser[] | null; error: string | null }> {
  return makeRequest<MonitoringUser[]>('GET', '/users');
}

export async function updateUserStatus(
  userId: string,
  status: MonitoringStatus
): Promise<{ data: MonitoringUser | null; error: string | null }> {
  return makeRequest<MonitoringUser>('PUT', `/users/${userId}`, { status });
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ data: MonitoringUser | null; error: string | null }> {
  return makeRequest<MonitoringUser>('PUT', `/users/${userId}`, { role });
}
