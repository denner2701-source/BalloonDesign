revoke all privileges on table public.projects from anon, authenticated;
revoke all privileges on table public.profiles from anon, authenticated;
revoke all privileges on table public.published_projects from anon, authenticated;
revoke all privileges on table public.gallery_likes from anon, authenticated;
revoke all privileges on table public.gallery_reports from anon, authenticated;
revoke all privileges on table public.profile_follows from anon, authenticated;

grant select on table public.profiles, public.published_projects to anon;
grant select, insert, update, delete on table public.projects, public.profiles, public.published_projects to authenticated;
grant select, insert, delete on table public.gallery_likes, public.profile_follows to authenticated;
grant select, insert on table public.gallery_reports to authenticated;
