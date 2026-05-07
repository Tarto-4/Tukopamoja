-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Text Input Questions + Session Feedback System            ║
-- ║                                                            ║
-- ║  1. Add text_input question type                           ║
-- ║  2. Add accepted_answers JSONB column to questions          ║
-- ║  3. Add answer_text to player_answers for typed responses  ║
-- ║  4. Add session feedback settings + feedback table          ║
-- ║  5. Update scoring RPC to handle text_input                ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─── 1. Extend question_type enum ────────────────────────────
-- The check constraint on questions.question_type needs updating
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_question_type_check;

ALTER TABLE public.questions
  ADD CONSTRAINT questions_question_type_check
  CHECK (question_type IN ('multiple_choice', 'true_false', 'text_input'));

-- ─── 2. Add accepted_answers column ─────────────────────────
-- JSON array of {text: string} for text_input questions
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS accepted_answers jsonb NOT NULL DEFAULT '[]';

-- ─── 3. Add answer_text to player_answers ───────────────────
ALTER TABLE public.player_answers
  ADD COLUMN IF NOT EXISTS answer_text text;

-- ─── 4. Session feedback settings ───────────────────────────
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS require_feedback boolean NOT NULL DEFAULT false;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS feedback_scale int NOT NULL DEFAULT 5
  CHECK (feedback_scale IN (5, 10));

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS feedback_comment_enabled boolean NOT NULL DEFAULT true;

-- ─── 5. Session feedback table ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  player_id     uuid NOT NULL REFERENCES public.session_players(id) ON DELETE CASCADE,
  rating        int NOT NULL CHECK (rating >= 1 AND rating <= 10),
  comment       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, player_id)
);

ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can read feedback (host needs it for dashboard)
CREATE POLICY "feedback_read" ON public.session_feedback
  FOR SELECT USING (true);

-- Any authenticated player can insert their own feedback
CREATE POLICY "feedback_insert" ON public.session_feedback
  FOR INSERT WITH CHECK (true);

-- ─── 6. Update create_session to snapshot accepted_answers ──
CREATE OR REPLACE FUNCTION public.create_session(
  p_template_id uuid,
  p_host_id     uuid
)
RETURNS public.sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_session  public.sessions;
  v_snapshot jsonb;
  v_count    int;
BEGIN
  -- Build snapshot
  SELECT jsonb_agg(
           jsonb_build_object(
             'question_text',   q.question_text,
             'question_type',   q.question_type,
             'image_url',       q.image_url,
             'time_limit_sec',  q.time_limit_sec,
             'points',          q.points,
             'options',         q.options,
             'accepted_answers', q.accepted_answers
           ) ORDER BY q.sort_order
         ),
         count(*)
    INTO v_snapshot, v_count
    FROM public.questions q
   WHERE q.template_id = p_template_id;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'Template has no questions';
  END IF;

  INSERT INTO public.sessions (
    id, template_id, host_id, pin,
    questions_snapshot, status, current_q_index
  )
  VALUES (
    gen_random_uuid(),
    p_template_id,
    p_host_id,
    public.generate_unique_pin(),
    v_snapshot,
    'lobby',
    -1
  )
  RETURNING * INTO v_session;

  -- Bump play count
  UPDATE public.templates
     SET play_count = play_count + 1
   WHERE id = p_template_id;

  RETURN v_session;
END;
$$;

-- ─── 7. Update scoring RPC to handle text_input questions ───
CREATE OR REPLACE FUNCTION public.recompute_ranked_question_scores(
  p_session_id     uuid,
  p_question_index int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_snapshot     jsonb;
  v_q            jsonb;
  v_max_points   int;
  v_time_limit   int;
  v_q_type       text;
  v_accepted     jsonb;
BEGIN
  -- Fetch question snapshot
  SELECT s.questions_snapshot
    INTO v_snapshot
    FROM public.sessions s
   WHERE s.id = p_session_id;

  IF v_snapshot IS NULL THEN RETURN; END IF;

  v_q := v_snapshot -> p_question_index;
  IF v_q IS NULL THEN RETURN; END IF;

  v_max_points := (v_q ->> 'points')::int;
  v_time_limit := (v_q ->> 'time_limit_sec')::int;
  v_q_type     := v_q ->> 'question_type';
  v_accepted   := COALESCE(v_q -> 'accepted_answers', '[]'::jsonb);

  -- For text_input questions: evaluate is_correct from accepted_answers
  IF v_q_type = 'text_input' THEN
    UPDATE public.player_answers pa
       SET is_correct = EXISTS (
             SELECT 1
               FROM jsonb_array_elements(v_accepted) AS a
              WHERE lower(trim(a ->> 'text')) = lower(trim(pa.answer_text))
           )
     WHERE pa.session_id = p_session_id
       AND pa.question_index = p_question_index;
  END IF;

  -- Rank all correct answers by speed, assign points
  WITH ranked AS (
    SELECT pa.id,
           pa.is_correct,
           pa.time_taken_ms,
           ROW_NUMBER() OVER (
             PARTITION BY pa.is_correct
             ORDER BY pa.answered_at ASC, pa.id ASC
           ) AS answer_rank
      FROM public.player_answers pa
     WHERE pa.session_id = p_session_id
       AND pa.question_index = p_question_index
  )
  UPDATE public.player_answers pa
     SET points_awarded = CASE
           WHEN r.is_correct = false THEN 0
           WHEN pa.time_taken_ms >= (v_time_limit * 1000) THEN 0
           ELSE floor(v_max_points * CASE r.answer_rank
                  WHEN 1 THEN 1.0
                  WHEN 2 THEN 0.9
                  WHEN 3 THEN 0.8
                  WHEN 4 THEN 0.7
                  WHEN 5 THEN 0.6
                  WHEN 6 THEN 0.5
                  WHEN 7 THEN 0.4
                  WHEN 8 THEN 0.3
                  ELSE 0.2
                END)
         END
    FROM ranked r
   WHERE pa.id = r.id;

  -- Recalculate total score for all players in session
  UPDATE public.session_players sp
     SET score = COALESCE(sub.total, 0)
    FROM (
      SELECT pa.player_id, SUM(pa.points_awarded) AS total
        FROM public.player_answers pa
       WHERE pa.session_id = p_session_id
       GROUP BY pa.player_id
    ) sub
   WHERE sp.id = sub.player_id
     AND sp.session_id = p_session_id;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.recompute_ranked_question_scores(uuid, int) TO authenticated;
