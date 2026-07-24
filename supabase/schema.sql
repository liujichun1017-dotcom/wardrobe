-- 衣橱应用数据库结构
-- 在 Supabase Dashboard → SQL Editor → New query 里整段粘贴执行

-- 1. 条目表（衣物 / 搭配 / 想买）
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('garment','outfit','wish')),
  name text not null,
  category text not null,
  color text not null default '',
  season text not null default '四季',
  worn_count integer not null default 0,
  last_worn_at date,
  image_key text,
  notes text not null default '',
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists entries_user_idx on public.entries (user_id);
create index if not exists entries_kind_idx on public.entries (kind);
create index if not exists entries_created_at_idx on public.entries (created_at desc);

-- 2. 行级安全：每个用户只能读写自己的条目
alter table public.entries enable row level security;

drop policy if exists "用户读自己的条目" on public.entries;
create policy "用户读自己的条目"
  on public.entries for select
  using (auth.uid() = user_id);

drop policy if exists "用户增自己的条目" on public.entries;
create policy "用户增自己的条目"
  on public.entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "用户改自己的条目" on public.entries;
create policy "用户改自己的条目"
  on public.entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "用户删自己的条目" on public.entries;
create policy "用户删自己的条目"
  on public.entries for delete
  using (auth.uid() = user_id);

-- 3. 存储桶：衣物图片
insert into storage.buckets (id, name, public)
values ('garments', 'garments', true)
on conflict (id) do nothing;

-- 4. 存储策略：用户只能管理自己目录下的图片
drop policy if exists "用户读所有图片" on storage.objects;
create policy "用户读所有图片"
  on storage.objects for select
  using (bucket_id = 'garments');

drop policy if exists "用户上传自己图片" on storage.objects;
create policy "用户上传自己图片"
  on storage.objects for insert
  with check (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "用户改自己图片" on storage.objects;
create policy "用户改自己图片"
  on storage.objects for update
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "用户删自己图片" on storage.objects;
create policy "用户删自己图片"
  on storage.objects for delete
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);
