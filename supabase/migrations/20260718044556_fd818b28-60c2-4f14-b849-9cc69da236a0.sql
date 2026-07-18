
DROP POLICY IF EXISTS "anyone can insert their own events" ON public.analytics_events;

CREATE POLICY "public can insert well-formed events"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(session_id) BETWEEN 8 AND 64
    AND event_type IN (
      'page_view','section_view','click','checkout_step',
      'pix_copied','purchase','exit','form_field'
    )
    AND (target IS NULL OR char_length(target) <= 120)
    AND (path IS NULL OR char_length(path) <= 200)
  );
