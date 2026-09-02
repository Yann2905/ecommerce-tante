-- Durcissement du parcours de commande.
-- À appliquer après 0001, 0002 et 0003 dans Supabase SQL Editor.

-- Nettoyage défensif des stocks déjà incohérents avant d’ajouter la contrainte.
update public.products
set stock = greatest(coalesce(stock, 0), 0)
where stock is null or stock < 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_stock_non_negative'
  ) then
    alter table public.products
      add constraint products_stock_non_negative check (stock >= 0);
  end if;
end $$;

alter table public.orders
  add column if not exists idempotency_key text,
  add column if not exists public_token uuid default gen_random_uuid(),
  add column if not exists status text not null default 'en_attente',
  add column if not exists updated_at timestamptz not null default now();

-- Compatibilité avec les anciennes valeurs accentuées.
update public.orders
set status = case lower(coalesce(status, 'en_attente'))
  when 'livré' then 'livree'
  when 'livrée' then 'livree'
  when 'annulé' then 'annulee'
  when 'annulée' then 'annulee'
  else lower(coalesce(status, 'en_attente'))
end;

-- Les contraintes historiques éventuelles ne doivent pas empêcher les nouveaux statuts.
do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.orders'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%'
  loop
    execute format('alter table public.orders drop constraint if exists %I', constraint_row.conname);
  end loop;
end $$;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check check (
    status in ('en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee', 'retournee')
  );

update public.orders
set public_token = gen_random_uuid()
where public_token is null;

alter table public.orders
  alter column public_token set not null;

create unique index if not exists orders_idempotency_key_uidx
  on public.orders (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists orders_public_token_uidx
  on public.orders (public_token);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_events_order_idx
  on public.order_status_events (order_id, created_at desc);

-- Les RLS restent contournées uniquement par le service_role des route handlers.
revoke all on public.order_status_events from public, anon, authenticated;

drop function if exists public.create_order(text, text, text, text, jsonb);

drop function if exists public.create_order(text, text, text, text, jsonb, text);

create or replace function public.create_order(
  p_customer_name    text,
  p_customer_phone   text,
  p_customer_email   text,
  p_delivery_address text,
  p_items            jsonb,
  p_idempotency_key  text default null
)
returns jsonb
language plpgsql
as $$
declare
  v_item       record;
  v_product    record;
  v_unit_price numeric;
  v_total      numeric := 0;
  v_order_id   uuid;
  v_order      jsonb;
  v_existing   uuid;
  v_key        text := nullif(btrim(p_idempotency_key), '');
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Panier vide';
  end if;

  if p_customer_email is null or btrim(p_customer_email) = '' then
    raise exception 'E-mail client obligatoire';
  end if;

  -- Un même panier ne peut pas décrémenter deux fois si le navigateur réessaie.
  if v_key is not null then
    select id into v_existing
    from public.orders
    where idempotency_key = v_key
    limit 1;

    if v_existing is not null then
      select to_jsonb(o.*) || jsonb_build_object('_created', false)
        into v_order from public.orders o where o.id = v_existing;
      return v_order;
    end if;
  end if;

  -- Agrégation + ordre déterministe : protège contre les doublons de lignes et
  -- réduit les risques de deadlock lorsque deux paniers se recouvrent.
  for v_item in
    select
      (value->>'product_id')::uuid as product_id,
      sum((value->>'quantity')::int)::int as quantity
    from jsonb_array_elements(p_items)
    group by (value->>'product_id')::uuid
    order by (value->>'product_id')::uuid
  loop
    if v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Quantité invalide';
    end if;

    select id, name, price, discount_price, stock, is_active
      into v_product
      from public.products
      where id = v_item.product_id
      for update;

    if not found then
      raise exception 'Produit introuvable : %', v_item.product_id;
    end if;
    if not v_product.is_active then
      raise exception 'Produit non disponible : %', v_product.name;
    end if;
    if coalesce(v_product.stock, 0) < v_item.quantity then
      raise exception 'Stock insuffisant pour : % (reste %)', v_product.name, v_product.stock;
    end if;

    v_unit_price := coalesce(v_product.discount_price, v_product.price);
    v_total := v_total + v_unit_price * v_item.quantity;
  end loop;

  insert into public.orders (
    customer_name, customer_phone, customer_email, delivery_address,
    total_price, status, idempotency_key
  )
  values (
    btrim(p_customer_name), btrim(p_customer_phone), lower(btrim(p_customer_email)),
    coalesce(nullif(btrim(p_delivery_address), ''), 'Non précisée'),
    v_total, 'en_attente', v_key
  )
  on conflict (idempotency_key) where idempotency_key is not null do nothing
  returning id into v_order_id;

  if v_order_id is null and v_key is not null then
    select id into v_order_id
    from public.orders
    where idempotency_key = v_key
    limit 1;

    select to_jsonb(o.*) || jsonb_build_object('_created', false)
      into v_order from public.orders o where o.id = v_order_id;
    return v_order;
  end if;

  for v_item in
    select
      (value->>'product_id')::uuid as product_id,
      sum((value->>'quantity')::int)::int as quantity
    from jsonb_array_elements(p_items)
    group by (value->>'product_id')::uuid
    order by (value->>'product_id')::uuid
  loop
    select coalesce(discount_price, price)
      into v_unit_price
      from public.products
      where id = v_item.product_id;

    insert into public.order_items (order_id, product_id, quantity, unit_price)
    values (v_order_id, v_item.product_id, v_item.quantity, v_unit_price);

    update public.products
      set stock = stock - v_item.quantity
      where id = v_item.product_id;
  end loop;

  insert into public.order_status_events (order_id, from_status, to_status)
  values (v_order_id, null, 'en_attente');

  select to_jsonb(o.*) || jsonb_build_object('_created', true)
    into v_order from public.orders o where o.id = v_order_id;
  return v_order;
end;
$$;

revoke all on function public.create_order(text, text, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.create_order(text, text, text, text, jsonb, text) to service_role;

create or replace function public.update_order_status(
  p_order_id uuid,
  p_status text,
  p_changed_by uuid default null,
  p_note text default null
)
returns jsonb
language plpgsql
as $$
declare
  v_current text;
  v_order jsonb;
  v_status text := lower(btrim(p_status));
begin
  if v_status not in ('en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee', 'retournee') then
    raise exception 'Statut de commande invalide';
  end if;

  select status into v_current
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Commande introuvable';
  end if;

  if v_current = v_status then
    select to_jsonb(o.*) || jsonb_build_object('_changed', false)
      into v_order from public.orders o where o.id = p_order_id;
    return v_order;
  end if;

  if not (
    (v_current = 'en_attente' and v_status in ('confirmee', 'annulee')) or
    (v_current = 'confirmee' and v_status in ('en_preparation', 'annulee')) or
    (v_current = 'en_preparation' and v_status in ('expediee', 'annulee')) or
    (v_current = 'expediee' and v_status = 'livree') or
    (v_current = 'livree' and v_status = 'retournee')
  ) then
    raise exception 'Transition impossible : % → %', v_current, v_status;
  end if;

  -- Une annulation libère une seule fois les quantités réservées.
  if v_status = 'annulee' then
    update public.products p
    set stock = p.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id
      and p.id = oi.product_id;
  end if;

  update public.orders
  set status = v_status, updated_at = now()
  where id = p_order_id;

  insert into public.order_status_events (order_id, from_status, to_status, changed_by, note)
  values (p_order_id, v_current, v_status, p_changed_by, nullif(btrim(p_note), ''));

  select to_jsonb(o.*) || jsonb_build_object('_changed', true, '_previous_status', v_current)
    into v_order from public.orders o where o.id = p_order_id;
  return v_order;
end;
$$;

revoke all on function public.update_order_status(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.update_order_status(uuid, text, uuid, text) to service_role;
