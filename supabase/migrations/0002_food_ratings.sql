-- 新增校園餐廳與評論 schema
-- 可以直接貼到 Supabase SQL Editor 或 `supabase db push`

-- 先刪掉舊的 reviews 表（若已存在），避免錯誤的舊 schema 造成失敗
-- 注意：這會移除 reviews 表裡的資料，如果你要保留歷史評論請先備份。
drop table if exists public.reviews cascade;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  content text not null check (char_length(content) between 1 and 800),
  created_at timestamptz not null default now()
);

create index if not exists reviews_restaurant_id_idx
  on public.reviews (restaurant_id);

alter table public.restaurants enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "anyone can read restaurants" on public.restaurants;
create policy "anyone can read restaurants"
  on public.restaurants for select
  using (true);

drop policy if exists "anyone can read reviews" on public.reviews;
create policy "anyone can read reviews"
  on public.reviews for select
  using (true);

drop policy if exists "anyone can insert reviews" on public.reviews;
create policy "anyone can insert reviews"
  on public.reviews for insert
  with check (
    restaurant_id is not null
    and rating between 1 and 5
    and char_length(content) between 1 and 800
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'restaurants'
  ) then
    execute 'alter publication supabase_realtime add table public.restaurants';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reviews'
  ) then
    execute 'alter publication supabase_realtime add table public.reviews';
  end if;
end $$;

insert into public.restaurants (id, name, description)
values
  ('f3e45c2e-44e8-4a2f-8637-57b7a6724d01', '異國快餐', '敬業樓'),
  ('a5d9b8d3-3f81-4fd6-8d0d-3f1d24b7d56e', '玖點茶飲', '敬業樓'),
  ('0c8f4d9f-9b55-4b8d-b4d0-8d4e4eb7f2f5', '嚐見麵', '敬業樓'),
  ('2a0017fc-8c3b-4bc6-a8f6-6ff50e902439', '早拾光', '樂群樓'),
  ('d0b85e75-8f32-4af7-b958-3f3dc57783e8', '麵之屋', '樂群樓'),
  ('5c28a0bf-70e8-4920-99a5-28c95598089b', '菇蒂早安吧', '學生活動中心'),
  ('c6e8b7f2-12a5-4c1b-8c6a-2f8a9b3c7d42', '自助餐', '學生活動中心'),
  ('f7a8d6e9-74c2-4c1d-a5e8-93fcb7bd8a1f', '賀琳坊', '學生活動中心'),
  ('b4d6f29c-3e87-4c1e-9b5d-abc123ef4567', '海苔飯捲', '學生活動中心')
on conflict (name) do nothing;
