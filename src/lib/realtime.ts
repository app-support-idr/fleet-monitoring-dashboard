import { supabase } from '@/lib/supabase';

export const MONITORING_REFRESH_EVENT = 'monitoring-refresh';

export function triggerManualRefresh(): void {
  window.dispatchEvent(new Event(MONITORING_REFRESH_EVENT));
}

type ChangeListener = () => void;

const MONITORED_TABLES = ['applications', 'monitoring_checks', 'incidents'] as const;

let refCount = 0;
let channel: ReturnType<typeof supabase.channel> | null = null;
const listeners = new Set<ChangeListener>();

function notifyListeners(): void {
  for (const listener of listeners) listener();
}

function ensureChannel(): void {
  if (channel) return;

  let builder = supabase.channel('monitoring-dashboard');
  for (const table of MONITORED_TABLES) {
    builder = builder.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      notifyListeners
    );
  }
  channel = builder.subscribe();
}

export function subscribeToMonitoringChanges(listener: ChangeListener): () => void {
  listeners.add(listener);
  refCount += 1;
  ensureChannel();

  return () => {
    listeners.delete(listener);
    refCount -= 1;
    if (refCount === 0 && channel) {
      void supabase.removeChannel(channel);
      channel = null;
    }
  };
}
