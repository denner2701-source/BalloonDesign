-- Snapshot reprodutível do schema validado em 17/08/2026.
-- Use em um projeto Supabase vazio. O ambiente existente já possui este schema.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  shape text not null default 'panel' check (shape in ('panel','arch','column','cylinder','garland','creative_panel','panel_duplet','panel_alternating','duplet_alternating','disc','organic')),
  cols smallint not null default 12 check (cols between 1 and 100),
  rows smallint not null default 8 check (rows between 1 and 100),
  palette jsonb not null default '[]'::jsonb check (jsonb_typeof(palette)='array'),
  cells jsonb not null default '[]'::jsonb check (jsonb_typeof(cells)='array'),
  balloon_sizes jsonb not null default '[]'::jsonb check (jsonb_typeof(balloon_sizes)='array'),
  budget jsonb not null default '{}'::jsonb check (jsonb_typeof(budget)='object'),
  checklist jsonb not null default '[]'::jsonb check (jsonb_typeof(checklist)='array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text check (username is null or username ~ '^[a-z0-9_]{3,20}$'),
  display_name text check (display_name is null or char_length(display_name) between 1 and 60),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.published_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  title text not null check (char_length(title) between 1 and 80),
  shape text not null check (shape in ('panel_duplet','panel_alternating','duplet_alternating','column','arch','disc','organic')),
  tags text[] not null default '{}'::text[] check (cardinality(tags) <= 8),
  project_data jsonb not null check (jsonb_typeof(project_data)='object'),
  like_count integer not null default 0 check (like_count >= 0),
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery_likes (
  project_id uuid not null references public.published_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id,user_id)
);

create table public.gallery_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.published_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'pending' check (status in ('pending','reviewed','dismissed')),
  created_at timestamptz not null default now(),
  unique (project_id,user_id)
);

create table public.profile_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id,followed_id),
  constraint profile_follows_not_self check (follower_id <> followed_id)
);

create unique index profiles_username_unique on public.profiles(username) where username is not null;
create unique index profiles_username_lower_unique on public.profiles(lower(username)) where username is not null;
create index projects_user_updated_idx on public.projects(user_id,updated_at desc);
create index published_projects_owner_id_idx on public.published_projects(owner_id);
create index published_projects_published_at_idx on public.published_projects(published_at desc);
create index published_projects_shape_idx on public.published_projects(shape);
create index published_projects_tags_idx on public.published_projects using gin(tags);
create index gallery_likes_user_id_idx on public.gallery_likes(user_id);
create index gallery_reports_project_id_idx on public.gallery_reports(project_id);
create index gallery_reports_user_id_idx on public.gallery_reports(user_id);
create index profile_follows_followed_idx on public.profile_follows(followed_id);

alter table public.projects enable row level security;
alter table public.profiles enable row level security;
alter table public.published_projects enable row level security;
alter table public.gallery_likes enable row level security;
alter table public.gallery_reports enable row level security;
alter table public.profile_follows enable row level security;

create policy "Users can view own projects" on public.projects for select to authenticated using ((select auth.uid())=user_id);
create policy "Users can create own projects" on public.projects for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Users can update own projects" on public.projects for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Users can delete own projects" on public.projects for delete to authenticated using ((select auth.uid())=user_id);

create policy profiles_public_read on public.profiles for select to anon,authenticated using (true);
create policy profiles_self_insert on public.profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy profiles_self_update on public.profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy profiles_self_delete on public.profiles for delete to authenticated using ((select auth.uid())=user_id);

create policy published_projects_public_read on public.published_projects for select to anon,authenticated using (true);
create policy published_projects_owner_insert on public.published_projects for insert to authenticated with check ((select auth.uid())=owner_id);
create policy published_projects_owner_update on public.published_projects for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy published_projects_owner_delete on public.published_projects for delete to authenticated using ((select auth.uid())=owner_id);

create policy gallery_likes_self_read on public.gallery_likes for select to authenticated using ((select auth.uid())=user_id);
create policy gallery_likes_self_insert on public.gallery_likes for insert to authenticated with check ((select auth.uid())=user_id);
create policy gallery_likes_self_delete on public.gallery_likes for delete to authenticated using ((select auth.uid())=user_id);
create policy gallery_reports_self_read on public.gallery_reports for select to authenticated using ((select auth.uid())=user_id);
create policy gallery_reports_self_insert on public.gallery_reports for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Users can read own follows" on public.profile_follows for select to authenticated using ((select auth.uid())=follower_id);
create policy "Users can follow profiles" on public.profile_follows for insert to authenticated with check ((select auth.uid())=follower_id);
create policy "Users can unfollow profiles" on public.profile_follows for delete to authenticated using ((select auth.uid())=follower_id);

create or replace function public.sync_published_like_count() returns trigger
language plpgsql security definer set search_path to 'public','pg_temp' as $$
begin
  if tg_op='INSERT' then
    update public.published_projects set like_count=like_count+1,updated_at=now() where id=new.project_id;
    return new;
  elsif tg_op='DELETE' then
    update public.published_projects set like_count=greatest(0,like_count-1),updated_at=now() where id=old.project_id;
    return old;
  end if;
  return null;
end;
$$;
revoke all on function public.sync_published_like_count() from public,anon,authenticated;
create trigger gallery_likes_count_trigger after insert or delete on public.gallery_likes for each row execute function public.sync_published_like_count();

revoke all privileges on all tables in schema public from anon,authenticated;
grant select on table public.profiles,public.published_projects to anon;
grant select,insert,update,delete on table public.projects,public.profiles,public.published_projects to authenticated;
grant select,insert,delete on table public.gallery_likes,public.profile_follows to authenticated;
grant select,insert on table public.gallery_reports to authenticated;
