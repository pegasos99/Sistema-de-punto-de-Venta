-- StoreManager Pro: esquema base. Aplicar en un proyecto Supabase de desarrollo.
-- No migra db.json ni crea usuarios o negocios automáticamente.
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_memberships (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'vendedor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);
create index business_memberships_user_idx on public.business_memberships (user_id, business_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  name text not null check (length(btrim(name)) > 0),
  legacy_id text,
  created_at timestamptz not null default now(),
  unique (id, business_id),
  unique (business_id, name),
  unique (business_id, legacy_id)
);
create index categories_business_idx on public.categories (business_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  category_id uuid,
  legacy_id text,
  name text not null check (length(btrim(name)) > 0),
  description text not null default '',
  price_amount numeric(14,2) not null check (price_amount >= 0),
  cost_total_amount numeric(14,2) not null default 0 check (cost_total_amount >= 0),
  min_stock numeric(14,3) not null default 0 check (min_stock >= 0),
  has_variants boolean not null default false,
  has_variable_price boolean not null default false,
  is_weight_based boolean not null default false,
  price_per_gram numeric(14,4) check (price_per_gram > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id),
  unique (business_id, legacy_id),
  foreign key (category_id, business_id) references public.categories (id, business_id)
);
create index products_business_idx on public.products (business_id, is_active, name);

create table public.product_barcodes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  product_id uuid not null,
  barcode text not null check (length(btrim(barcode)) > 0),
  unique (business_id, barcode),
  foreign key (product_id, business_id) references public.products (id, business_id)
);
create index product_barcodes_product_idx on public.product_barcodes (business_id, product_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  product_id uuid not null,
  legacy_id text,
  color text not null,
  unique (id, business_id, product_id),
  unique (business_id, product_id, legacy_id),
  foreign key (product_id, business_id) references public.products (id, business_id)
);

-- NULLS NOT DISTINCT evita saldos duplicados para productos sin variante (PostgreSQL 15+).
create table public.inventory_balances (
  business_id uuid not null,
  product_id uuid not null,
  variant_id uuid,
  location text not null check (location in ('store', 'warehouse')),
  quantity numeric(14,3) not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (business_id, product_id, variant_id, location),
  foreign key (product_id, business_id) references public.products (id, business_id),
  foreign key (variant_id, business_id, product_id) references public.product_variants (id, business_id, product_id)
);
create index inventory_balances_business_idx on public.inventory_balances (business_id, product_id);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  sold_by uuid not null references auth.users(id),
  idempotency_key uuid not null,
  request_hash text not null,
  total_amount numeric(14,2) not null check (total_amount >= 0),
  created_at timestamptz not null default now(),
  unique (id, business_id),
  unique (business_id, idempotency_key)
);
create index sales_business_date_idx on public.sales (business_id, created_at desc);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  sale_id uuid not null,
  product_id uuid not null,
  variant_id uuid,
  product_name text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  unit_cost numeric(14,2) not null check (unit_cost >= 0),
  total_price numeric(14,2) not null check (total_price >= 0),
  barcode text,
  payment_method text not null check (payment_method in ('efectivo', 'tarjeta')),
  foreign key (sale_id, business_id) references public.sales (id, business_id),
  foreign key (product_id, business_id) references public.products (id, business_id),
  foreign key (variant_id, business_id, product_id) references public.product_variants (id, business_id, product_id)
);
create index sale_items_sale_idx on public.sale_items (business_id, sale_id);

create table public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  sale_id uuid not null,
  method text not null check (method in ('efectivo', 'tarjeta')),
  amount numeric(14,2) not null check (amount >= 0),
  unique (business_id, sale_id, method),
  foreign key (sale_id, business_id) references public.sales (id, business_id)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  product_id uuid not null,
  variant_id uuid,
  location text not null check (location in ('store', 'warehouse')),
  quantity_delta numeric(14,3) not null check (quantity_delta <> 0),
  reason text not null check (reason in ('sale', 'purchase', 'transfer', 'adjustment', 'import')),
  reference_id uuid,
  performed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (product_id, business_id) references public.products (id, business_id),
  foreign key (variant_id, business_id, product_id) references public.product_variants (id, business_id, product_id)
);
create index stock_movements_history_idx on public.stock_movements (business_id, product_id, created_at desc);

create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  legacy_id text,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  category text not null check (category in ('personal', 'local', 'otros')),
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  start_date date not null,
  next_due_date date not null,
  day_of_week integer check (day_of_week between 0 and 6),
  day_of_month integer check (day_of_month between 1 and 31),
  created_at timestamptz not null default now(),
  unique (id, business_id),
  unique (business_id, legacy_id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  legacy_id text,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  category text not null check (category in ('personal', 'local', 'otros')),
  expense_date timestamptz not null,
  created_by uuid references auth.users(id),
  recurring_expense_id uuid,
  created_at timestamptz not null default now(),
  unique (business_id, legacy_id),
  foreign key (recurring_expense_id, business_id) references public.recurring_expenses (id, business_id)
);
create index expenses_business_date_idx on public.expenses (business_id, expense_date desc);

-- API propia es la única que escribe: denegar operaciones directas desde browser.
-- Los roles con bypassrls/conexión privilegiada deben comprobar permisos en el backend.
do $$
declare t text;
begin
  foreach t in array array[
    'businesses', 'business_memberships', 'categories', 'products',
    'product_barcodes', 'product_variants', 'inventory_balances',
    'sales', 'sale_items', 'sale_payments', 'stock_movements',
    'recurring_expenses', 'expenses'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
  end loop;
end $$;

-- Solo una lectura de sesión acotada es accesible por la Data API.
grant select on public.business_memberships, public.businesses to authenticated;
create policy memberships_read_self on public.business_memberships
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy businesses_read_member on public.businesses
  for select to authenticated
  using (exists (
    select 1 from public.business_memberships m
    where m.business_id = id
      and m.user_id = (select auth.uid())
      and m.is_active = true
  ));
