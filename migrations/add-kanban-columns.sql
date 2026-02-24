-- =============================================================================
-- MIGRAÇÃO: Colunas Kanban personalizadas + remoção do campo status das tarefas
-- Executar no SQL Editor do Supabase Dashboard
-- =============================================================================

-- 1. Adiciona campo `done` (booleano) às tarefas, preservando quem já estava concluído
ALTER TABLE public.tasks_items
    ADD COLUMN IF NOT EXISTS done BOOLEAN NOT NULL DEFAULT false;

-- Migra quem já tinha status='done'
UPDATE public.tasks_items SET done = true WHERE status = 'done';

-- 2. Remove o campo status (após migrar os dados)
ALTER TABLE public.tasks_items
    DROP COLUMN IF EXISTS status;

-- 3. Tabela de colunas Kanban personalizadas por projeto
CREATE TABLE IF NOT EXISTS public.tasks_columns (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID        NOT NULL REFERENCES public.tasks_projects(id) ON DELETE CASCADE,
    name       TEXT        NOT NULL,
    position   INTEGER     NOT NULL DEFAULT 0,
    color      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_columns_project ON public.tasks_columns(project_id, position);

-- RLS: apenas service role acessa
ALTER TABLE public.tasks_columns ENABLE ROW LEVEL SECURITY;

-- 4. Adiciona referência de coluna kanban às tarefas (nullable = tarefa não alocada em coluna)
ALTER TABLE public.tasks_items
    ADD COLUMN IF NOT EXISTS column_id UUID REFERENCES public.tasks_columns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_items_column ON public.tasks_items(column_id);

-- Comentários
COMMENT ON TABLE  public.tasks_columns              IS 'Colunas Kanban personalizadas por projeto MAF Pro Tasks';
COMMENT ON COLUMN public.tasks_columns.position     IS 'Ordem de exibição das colunas (0 = primeira)';
COMMENT ON COLUMN public.tasks_items.done           IS 'Tarefa concluída (substitui o campo status)';
COMMENT ON COLUMN public.tasks_items.column_id      IS 'Coluna kanban à qual a tarefa pertence (nullable)';

-- Verificação final
SELECT
    (SELECT COUNT(*) FROM public.tasks_columns)                        AS colunas_criadas,
    (SELECT COUNT(*) FROM public.tasks_items WHERE done = true)        AS tarefas_concluidas,
    (SELECT COUNT(*) FROM public.tasks_items WHERE column_id IS NULL)  AS tarefas_sem_coluna;
