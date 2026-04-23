-- Refresh organization branding defaults to the premium ENS palette

alter table public.organization
  alter column primary_color set default '#8E191E',
  alter column secondary_color set default '#C9A84C';

update public.organization
set
  primary_color = '#8E191E',
  secondary_color = '#C9A84C',
  updated_at = now()
where primary_color = '#6C5CE7'
  and secondary_color = '#00CEC9';