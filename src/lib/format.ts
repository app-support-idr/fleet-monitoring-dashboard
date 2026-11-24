function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatTimeLabel(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDuration(startISO: string, resolvedISO: string | null): string {
  if (!resolvedISO) return 'En cours';
  const start = new Date(startISO).getTime();
  const end = new Date(resolvedISO).getTime();
  const diffSec = Math.round((end - start) / 1000);
  if (diffSec < 60) return `${diffSec} sec`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `${h}h ${m}min`;
}
