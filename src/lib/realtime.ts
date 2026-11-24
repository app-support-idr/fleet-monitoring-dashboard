import { supabase } from '@/lib/supabase';

export const MONITORING_REFRESH_EVENT = 'monitoring-refresh';

export function triggerManualRefresh(): void {
  window.dispatchEvent(new Event(MONITORING_REFRESH_EVENT));
}

type ChangeListener = () => void;

const MONITORED_TABLES = ['applications', 'monitoring_checks', 'incidents'] as const;

let refCount = 0;
let channel: ReturnType<typeof supabase.channel> | null = null;
let channelSeq = 0;
const listeners = new Set<ChangeListener>();

function notifyListeners(): void {
  for (const listener of listeners) listener();
}

function ensureChannel(): void {
  if (channel) return;

  const name = `monitoring-dashboard-${++channelSeq}`;
  let builder = supabase.channel(name);
  for (const table of MONITORED_TABLES) {
    builder = builder.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      notifyListeners
    );
  }

  const ch = builder.subscribe((status) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      void supabase.removeChannel(ch);
      if (channel === ch) channel = null;
      if (refCount > 0) {
        window.setTimeout(ensureChannel, 3000);
      }
    }
  });
  channel = ch;
}

export function subscribeToMonitoringChanges(listener: ChangeListener): () => void {
  listeners.add(listener);
  refCount += 1;
  ensureChannel();

  return () => {
    listeners.delete(listener);
    refCount -= 1;
    if (refCount === 0 && channel) {
      const ch = channel;
      channel = null;
      void supabase.removeChannel(ch);
    }
  };
}
