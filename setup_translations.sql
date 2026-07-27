CREATE TABLE IF NOT EXISTS public.tool_translations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id text NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  lang text NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  inputs jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(tool_id, lang)
);

ALTER TABLE public.tool_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to tool_translations" ON public.tool_translations FOR SELECT USING (true);
