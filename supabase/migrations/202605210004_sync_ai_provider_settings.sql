-- Agregar columnas para persistir el proveedor y modelo seleccionado de IA en la tabla settings si no existen
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS ai_provider text,
  ADD COLUMN IF NOT EXISTS ai_base_url text,
  ADD COLUMN IF NOT EXISTS ai_gemini_model text,
  ADD COLUMN IF NOT EXISTS ai_openai_model text,
  ADD COLUMN IF NOT EXISTS ai_claude_model text;
