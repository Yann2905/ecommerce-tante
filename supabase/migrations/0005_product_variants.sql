-- Variantes de produits : tailles, couleurs et stock propre à chaque déclinaison.

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text,
  size text,
  color text,
  label text not null,
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_has_attribute check (nullif(btrim(label), '') is not null)
);

create unique index if not exists product_variants_product_label_uidx
  on public.product_variants(product_id, lower(label));
create unique index if not exists product_variants_sku_uidx
  on public.product_variants(sku)
  where sku is not null;
create index if not exists product_variants_product_idx
  on public.product_variants(product_id, is_active);

alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null;

create index if not exists order_items_variant_idx on public.order_items(variant_id);

revoke all on public.product_variants from public, anon, authenticated;

-- Le stock historique reste compatible : lorsqu’un produit possède des variantes,
-- l’API maintient products.stock comme somme des stocks actifs.
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
  v_variant    record;
  v_unit_price numeric;
  v_total      numeric := 0;
  v_order_id   uuid;
  v_order      jsonb;
  v_existing   uuid;
  v_variant_count integer;
  v_key        text := nullif(btrim(p_idempotency_key), '');
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Panier vide';
  end if;
  if p_customer_email is null or btrim(p_customer_email) = '' then
    raise exception 'E-mail client obligatoire';
  end if;

  if v_key is not null then
    select id into v_existing from public.orders where idempotency_key = v_key limit 1;
    if v_existing is not null then
      select to_jsonb(o.*) || jsonb_build_object('_created', false) into v_order from public.orders o where o.id = v_existing;
      return v_order;
    end if;
  end if;

  for v_item in
    select
      (value->>'product_id')::uuid as product_id,
      nullif(value->>'variant_id', '')::uuid as variant_id,
      sum((value->>'quantity')::int)::int as quantity
    from jsonb_array_elements(p_items)
    group by (value->>'product_id'), (value->>'variant_id')
    order by (value->>'product_id'), (value->>'variant_id')
  loop
    if v_item.quantity is null or v_item.quantity <= 0 then raise exception 'Quantité invalide'; end if;

    select id, name, price, discount_price, stock, is_active into v_product
    from public.products where id = v_item.product_id for update;
    if not found then raise exception 'Produit introuvable : %', v_item.product_id; end if;
    if not v_product.is_active then raise exception 'Produit non disponible : %', v_product.name; end if;

    select count(*) into v_variant_count from public.product_variants where product_id = v_item.product_id and is_active;
    if v_variant_count > 0 and v_item.variant_id is null then
      raise exception 'Choisissez une variante pour : %', v_product.name;
    end if;

    if v_item.variant_id is not null then
      select id, product_id, label, stock, is_active into v_variant
      from public.product_variants where id = v_item.variant_id and product_id = v_item.product_id for update;
      if not found or not v_variant.is_active then raise exception 'Variante non disponible pour : %', v_product.name; end if;
      if v_variant.stock < v_item.quantity then raise exception 'Stock insuffisant pour : % — %', v_product.name, v_variant.label; end if;
    elsif v_product.stock < v_item.quantity then
      raise exception 'Stock insuffisant pour : % (reste %)', v_product.name, v_product.stock;
    end if;

    v_unit_price := coalesce(v_product.discount_price, v_product.price);
    v_total := v_total + v_unit_price * v_item.quantity;
  end loop;

  insert into public.orders (customer_name, customer_phone, customer_email, delivery_address, total_price, status, idempotency_key)
  values (btrim(p_customer_name), btrim(p_customer_phone), lower(btrim(p_customer_email)), coalesce(nullif(btrim(p_delivery_address), ''), 'Non précisée'), v_total, 'en_attente', v_key)
  on conflict (idempotency_key) where idempotency_key is not null do nothing
  returning id into v_order_id;

  if v_order_id is null and v_key is not null then
    select id into v_order_id from public.orders where idempotency_key = v_key limit 1;
    select to_jsonb(o.*) || jsonb_build_object('_created', false) into v_order from public.orders o where o.id = v_order_id;
    return v_order;
  end if;

  for v_item in
    select
      (value->>'product_id')::uuid as product_id,
      nullif(value->>'variant_id', '')::uuid as variant_id,
      sum((value->>'quantity')::int)::int as quantity
    from jsonb_array_elements(p_items)
    group by (value->>'product_id'), (value->>'variant_id')
    order by (value->>'product_id'), (value->>'variant_id')
  loop
    select coalesce(discount_price, price) into v_unit_price from public.products where id = v_item.product_id;
    insert into public.order_items (order_id, product_id, variant_id, quantity, unit_price)
    values (v_order_id, v_item.product_id, v_item.variant_id, v_item.quantity, v_unit_price);

    if v_item.variant_id is not null then
      update public.product_variants set stock = stock - v_item.quantity, updated_at = now() where id = v_item.variant_id;
      update public.products p set stock = coalesce((select sum(stock) from public.product_variants where product_id = p.id and is_active), 0) where p.id = v_item.product_id;
    else
      update public.products set stock = stock - v_item.quantity where id = v_item.product_id;
    end if;
  end loop;

  insert into public.order_status_events (order_id, from_status, to_status) values (v_order_id, null, 'en_attente');
  select to_jsonb(o.*) || jsonb_build_object('_created', true) into v_order from public.orders o where o.id = v_order_id;
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
  v_item record;
begin
  if v_status not in ('en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee', 'retournee') then
    raise exception 'Statut de commande invalide';
  end if;

  select status into v_current from public.orders where id = p_order_id for update;
  if not found then raise exception 'Commande introuvable'; end if;
  if v_current = v_status then
    select to_jsonb(o.*) || jsonb_build_object('_changed', false) into v_order from public.orders o where o.id = p_order_id;
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

  if v_status = 'annulee' then
    for v_item in select product_id, variant_id, quantity from public.order_items where order_id = p_order_id loop
      if v_item.variant_id is not null then
        update public.product_variants set stock = stock + v_item.quantity, updated_at = now() where id = v_item.variant_id;
        update public.products p set stock = coalesce((select sum(stock) from public.product_variants where product_id = p.id and is_active), 0) where p.id = v_item.product_id;
      else
        update public.products set stock = stock + v_item.quantity where id = v_item.product_id;
      end if;
    end loop;
  end if;

  update public.orders set status = v_status, updated_at = now() where id = p_order_id;
  insert into public.order_status_events (order_id, from_status, to_status, changed_by, note)
  values (p_order_id, v_current, v_status, p_changed_by, nullif(btrim(p_note), ''));

  select to_jsonb(o.*) || jsonb_build_object('_changed', true, '_previous_status', v_current)
    into v_order from public.orders o where o.id = p_order_id;
  return v_order;
end;
$$;

revoke all on function public.update_order_status(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.update_order_status(uuid, text, uuid, text) to service_role;
