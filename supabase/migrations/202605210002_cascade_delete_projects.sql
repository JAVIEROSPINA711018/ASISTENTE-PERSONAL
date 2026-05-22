-- Alterar la clave foránea de financials para habilitar la eliminación en cascada
ALTER TABLE public.financials
  DROP CONSTRAINT IF EXISTS financials_project_id_fkey,
  ADD CONSTRAINT financials_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES public.projects(id)
    ON DELETE CASCADE;

-- Alterar la clave foránea de tasks para habilitar la eliminación en cascada
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_project_id_fkey,
  ADD CONSTRAINT tasks_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES public.projects(id)
    ON DELETE CASCADE;
