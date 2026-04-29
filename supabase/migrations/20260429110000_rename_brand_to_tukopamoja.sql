-- Rename persisted organization branding to TUKOPAMOJA
update public.organization
set name = 'TUKOPAMOJA',
    updated_at = now()
where coalesce(name, '') <> 'TUKOPAMOJA';
