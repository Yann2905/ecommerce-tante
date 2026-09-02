-- Journal minimal des erreurs applicatives. Les logs détaillés restent aussi dans Vercel.
create table if not exists public.app_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('warn', 'error')),
  event text not null,
  message text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_logs_created_at_idx on public.app_logs(created_at desc);
create index if not exists app_logs_event_idx on public.app_logs(event, created_at desc);
revoke all on public.app_logs from public, anon, authenticated;
