do $$
declare
  target_site_url text := 'https://tarto-4.github.io/quizarena-public';
  target_redirect_glob text := 'https://tarto-4.github.io/quizarena-public/**';
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'auth'
      and table_name = 'config'
  ) then
    update auth.config
    set
      site_url = target_site_url,
      uri_allow_list = (
        select array(
          select distinct unnest(coalesce(uri_allow_list, '{}'::text[]) || array[target_redirect_glob])
        )
      );
  end if;
end
$$;