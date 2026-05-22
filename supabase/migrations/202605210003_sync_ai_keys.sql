-- Agregar columnas para las claves de API de IA en la tabla settings si no existen
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS gemini_api_key text,
  ADD COLUMN IF NOT EXISTS ai_openai_key text,
  ADD COLUMN IF NOT EXISTS ai_claude_key text;
