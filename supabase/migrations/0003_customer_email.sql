-- Ajout de l'e-mail client pour envoyer une confirmation de commande.
alter table public.orders
  add column if not exists customer_email text;

-- La signature évolue : on remplace l'ancienne fonction par celle qui reçoit l'e-mail.
drop function if exists public.create_order(text, text, text, jsonb);

create or replace function public.create_order(
  p_customer_name    text,
  p_customer_phone   text,
  p_customer_email   text,
  p_delivery_address text,
  p_items            jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_item       jsonb;
  v_product_id uuid;
  v_quantity   int;
  v_product    record;
  v_unit_price numeric;
  v_total      numeric := 0;
  v_order_id   uuid;
  v_order      jsonb;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Panier vide';
  end if;

  if p_customer_email is null or btrim(p_customer_email) = '' then
    raise exception 'E-mail client obligatoire';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::int;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Quantité invalide';
    end if;

    select id, name, price, discount_price, stock, is_active
      into v_product
      from public.products
      where id = v_product_id
      for update;

    if not found then
      raise exception 'Produit introuvable : %', v_product_id;
    end if;
    if not v_product.is_active then
      raise exception 'Produit non disponible : %', v_product.name;
    end if;
    if v_product.stock < v_quantity then
      raise exception 'Stock insuffisant pour : % (reste %)', v_product.name, v_product.stock;
    end if;

    v_unit_price := coalesce(v_product.discount_price, v_product.price);
    v_total := v_total + v_unit_price * v_quantity;
  end loop;

  insert into public.orders (customer_name, customer_phone, customer_email, delivery_address, total_price)
  values (
    p_customer_name,
    p_customer_phone,
    lower(btrim(p_customer_email)),
    coalesce(nullif(btrim(p_delivery_address), ''), 'Non précisée'),
    v_total
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::int;

    select coalesce(discount_price, price)
      into v_unit_price
      from public.products
      where id = v_product_id;

    insert into public.order_items (order_id, product_id, quantity, unit_price)
    values (v_order_id, v_product_id, v_quantity, v_unit_price);

    update public.products
      set stock = stock - v_quantity
      where id = v_product_id;
  end loop;

  select to_jsonb(o.*) into v_order from public.orders o where o.id = v_order_id;
  return v_order;
end;
$$;

revoke all on function public.create_order(text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(text, text, text, text, jsonb) to service_role;
