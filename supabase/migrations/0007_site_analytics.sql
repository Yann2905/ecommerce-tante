-- Analytics first-party minimalistes : aucune adresse IP ni donnée client n'est stockée.
create table if not exists public.site_activities (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null check (char_length(visitor_id) between 16 and 80),
  event_type text not null check (event_type in ('page_view', 'product_view', 'add_to_cart', 'checkout_started', 'order_created')),
  path text not null check (char_length(path) between 1 and 500),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists site_activities_created_at_idx on public.site_activities (created_at desc);
create index if not exists site_activities_visitor_id_idx on public.site_activities (visitor_id);
create index if not exists site_activities_country_idx on public.site_activities (country_code);

alter table public.site_activities enable row level security;

create or replace function public.get_site_analytics(p_since timestamptz)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'visits', (select count(*) from public.site_activities where event_type = 'page_view' and created_at >= p_since),
    'unique_visitors', (select count(distinct visitor_id) from public.site_activities where created_at >= p_since),
    'countries', coalesce((
      select jsonb_agg(jsonb_build_object('country', country_code, 'visits', visits, 'visitors', visitors) order by visits desc)
      from (
        select coalesce(country_code, 'XX') as country_code,
          count(*) filter (where event_type = 'page_view') as visits,
          count(distinct visitor_id) as visitors
        from public.site_activities
        where created_at >= p_since
        group by coalesce(country_code, 'XX')
        order by visits desc
        limit 20
      ) country_stats
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(to_jsonb(recent) order by recent.created_at desc)
      from (
        select event_type, path, country_code, created_at
        from public.site_activities
        where created_at >= p_since
        order by created_at desc
        limit 30
      ) recent
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_site_analytics(timestamptz) from public, anon, authenticated;
revoke all on table public.site_activities from public, anon, authenticated;
grant execute on function public.get_site_analytics(timestamptz) to service_role;
grant insert on table public.site_activities to service_role;
