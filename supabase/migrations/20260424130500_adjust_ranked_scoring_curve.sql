-- Adjust ranked scoring curve to be more forgiving for 2nd/3rd answers.
-- Keeps fastest answer at full points and raises lower-rank shares.

create or replace function public.recompute_ranked_question_scores(
  p_session_id uuid,
  p_question_index int
)
returns void
language plpgsql
security definer
as $$
declare
  v_max_points int;
  v_time_limit_sec int;
  v_active_players int;
begin
  select
    coalesce((s.questions_snapshot -> p_question_index ->> 'points')::int, 0),
    coalesce((s.questions_snapshot -> p_question_index ->> 'time_limit_sec')::int, 0)
  into v_max_points, v_time_limit_sec
  from public.sessions s
  where s.id = p_session_id;

  if v_max_points <= 0 or v_time_limit_sec <= 0 then
    return;
  end if;

  select greatest(1, count(*))
  into v_active_players
  from public.session_players sp
  where sp.session_id = p_session_id;

  with ranked as (
    select
      pa.id,
      pa.is_correct,
      pa.time_taken_ms,
      row_number() over (
        order by pa.answered_at asc, pa.id asc
      ) as answer_rank
    from public.player_answers pa
    where pa.session_id = p_session_id
      and pa.question_index = p_question_index
  ),
  rescored as (
    select
      r.id,
      case
        when not r.is_correct then 0
        when r.time_taken_ms >= (v_time_limit_sec * 1000) then 0
        else floor(
          v_max_points * greatest(
            0.2::numeric,
            1 / (1 + 0.28::numeric * (least(r.answer_rank, v_active_players) - 1))
          )
        )::int
      end as new_points
    from ranked r
  )
  update public.player_answers pa
  set points_awarded = rs.new_points
  from rescored rs
  where pa.id = rs.id
    and pa.points_awarded is distinct from rs.new_points;

  update public.session_players sp
  set score = coalesce(t.total_points, 0)
  from (
    select
      sp_inner.id as player_id,
      coalesce(sum(pa.points_awarded), 0)::int as total_points
    from public.session_players sp_inner
    left join public.player_answers pa
      on pa.session_id = sp_inner.session_id
     and pa.player_id = sp_inner.id
    where sp_inner.session_id = p_session_id
    group by sp_inner.id
  ) t
  where sp.id = t.player_id
    and sp.session_id = p_session_id;
end;
$$;
