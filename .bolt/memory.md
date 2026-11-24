# Project memory

## Product intent & audience

- Uptime/monitoring dashboard application tracking applications, monitoring checks, and incidents.
- Audience: operators/devs needing real-time visibility into service health and incidents.

## Brand personality & voice

- Technical, concise, production-oriented; UI labels in French (e.g. "Actualiser").

## Visual design & UX direction

- Stack: Vite + React (TSX), Tailwind CSS, shadcn/ui, lucide-react icons.
- Topbar layout: action buttons left of theme selector; "Actualiser" uses a circular-arrow icon with spin animation during refresh.
- Theme switching supported (light/dark) via selector in Topbar.
- Dashboard auto-refreshes data without page reload.

## Decisions, constraints & rationale

- Supabase is the configured backend client; reuse the existing `supabase` instance—do not instantiate new clients.
- Realtime: subscribe to `postgres_changes` (`INSERT`/`UPDATE`/`DELETE`) on `applications`, `monitoring_checks`, `incidents`.
- Use a single shared realtime channel/connection across the app to conserve resources; clean up with `supabase.removeChannel` on unmount.
- Supabase Realtime requires table replication enabled server-side; the 3 monitored tables have realtime replication activated.
- Polling every 30s remains as fallback when realtime connection drops; realtime is additive, not a replacement.
- 9 data hooks total: 8 with polling + `useApplications`; all now carry realtime subscriptions following a shared subscription module pattern.
- No extra UI/icon packages beyond shadcn/ui + lucide-react unless explicitly requested.

## Open questions & assumptions

- Assumption: Supabase project has realtime enabled and the 3 tables are in the `publications` replication set.
- Assumption: all data hooks expose a shared refresh function that the Topbar "Actualiser" button can invoke globally.
- Unverified: whether a global refresh coordinator/context exists or each hook is refreshed independently.