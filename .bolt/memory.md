# Project memory

## Product intent & audience

- Uptime/monitoring dashboard tracking applications, monitoring checks, and incidents.
- Audience: operators/devs needing real-time visibility into service health and incidents.

## Brand personality & voice

- Technical, concise, production-oriented; UI labels in French (e.g. "Actualiser").

## Visual design & UX direction

- Stack: Vite + React (TSX), Tailwind CSS, shadcn/ui, lucide-react icons.
- Topbar: action buttons left of theme selector; "Actualiser" uses a circular-arrow icon with spin animation during refresh.
- Theme switching (light/dark) via Topbar selector.
- Dashboard auto-refreshes without page reload; realtime updates should persist across tab/page navigation.

## Decisions, constraints & rationale

- Supabase is the configured backend client; reuse existing `supabase` instance—do not instantiate new clients.
- Realtime: subscribe to `postgres_changes` (`INSERT`/`UPDATE`/`DELETE`) on `applications`, `monitoring_checks`, `incidents`.
- DB side verified: 3 tables have realtime replication active and read RLS policies open.
- Channel naming: each channel must have a **unique** name per mount (not a fixed shared name). A fixed name caused the server to reject recreation during React remounts, leaving realtime silently dead after a few seconds.
- Auto-reconnect: on channel error/close, reconnect automatically (~3s) instead of staying broken; cleanup via `supabase.removeChannel` on unmount remains in place.
- Polling every 30s stays as fallback when realtime drops; realtime is additive, not a replacement.
- 9 data hooks total: 8 with polling + `useApplications`; all carry realtime subscriptions via a shared subscription module pattern.
- No extra UI/icon packages beyond shadcn/ui + lucide-react unless explicitly requested.

## Open questions & assumptions

- Assumption: Supabase project has realtime enabled and the 3 tables are in the `publications` replication set (confirmed correct at last check).
- Assumption: all data hooks expose a shared refresh function the Topbar "Actualiser" button can invoke globally.
- Unverified: whether a global refresh coordinator/context exists or each hook is refreshed independently.
- Watch: WebSocket connection stability itself — if silent realtime recurs despite unique channels + reconnect, investigate WS-level drops.