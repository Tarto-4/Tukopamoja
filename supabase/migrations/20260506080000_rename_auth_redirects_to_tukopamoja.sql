-- Update auth redirect URLs after GitHub repo rename: quizarena-public → Tukopamoja
DO $$
DECLARE
  target_site_url text := 'https://tarto-4.github.io/Tukopamoja';
  target_redirect_glob text := 'https://tarto-4.github.io/Tukopamoja/**';
BEGIN
  -- Update site_url in auth config
  UPDATE auth.config
  SET site_url = target_site_url
  WHERE site_url LIKE '%quizarena%';

  -- Update redirect URLs: replace old repo references
  UPDATE auth.config
  SET additional_redirect_urls = REPLACE(
    REPLACE(
      additional_redirect_urls::text,
      'quizarena-public',
      'Tukopamoja'
    ),
    'quizarena',
    'tukopamoja'
  )::jsonb
  WHERE additional_redirect_urls::text LIKE '%quizarena%';

  RAISE NOTICE 'Auth redirects updated to %', target_site_url;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'auth.config table not found — skipping (managed Supabase handles this via dashboard)';
END $$;
