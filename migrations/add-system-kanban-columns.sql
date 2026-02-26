-- =============================================================================
-- MIGRAÇÃO: Colunas Kanban globais (nível de sistema)
-- Substitui colunas por projeto por colunas compartilhadas entre todos os projetos.
-- Apenas admins master podem adicionar/renomear/excluir colunas do sistema.
-- Executar no SQL Editor do Supabase Dashboard
-- =============================================================================

-- 1. Cria tabela de colunas do sistema (sem vínculo com projeto específico)
CREATE TABLE IF NOT EXISTS public.tasks_system_columns (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       TEXT        NOT NULL,
    position   INTEGER     NOT NULL DEFAULT 0,
    color      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_system_columns_position
    ON public.tasks_system_columns(position);

ALTER TABLE public.tasks_system_columns ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE  public.tasks_system_columns          IS 'Colunas Kanban globais compartilhadas entre todos os projetos MAF Pro Tasks';
COMMENT ON COLUMN public.tasks_system_columns.position IS 'Ordem de exibição das colunas (0 = primeira)';

-- 2. Remove FK antiga de tasks_items → tasks_columns
--    (precisa ser feito antes de modificar os dados)
ALTER TABLE public.tasks_items
    DROP CONSTRAINT IF EXISTS tasks_items_column_id_fkey;

-- 3. Insere colunas do sistema com base nas colunas existentes por projeto (dedup por nome)
--    Se não houver colunas existentes, insere padrões.
DO $$
DECLARE
    existing_count INT;
BEGIN
    SELECT COUNT(*) INTO existing_count FROM public.tasks_columns;

    IF existing_count > 0 THEN
        -- Migra colunas distintas por nome (usa a cor mais comum de cada nome)
        INSERT INTO public.tasks_system_columns (name, color, position)
        SELECT
            name,
            color,
            (ROW_NUMBER() OVER (ORDER BY MIN(position))) - 1 AS position
        FROM (
            SELECT DISTINCT ON (LOWER(name)) name, color, position
            FROM public.tasks_columns
            ORDER BY LOWER(name), position
        ) AS deduped
        GROUP BY name, color
        ORDER BY MIN(position);
    ELSE
        -- Colunas padrão caso não haja nenhuma coluna de projeto existente
        INSERT INTO public.tasks_system_columns (name, color, position) VALUES
            ('A Fazer',      'slate',  0),
            ('Em Andamento', 'blue',   1),
            ('Em Revisão',   'yellow', 2),
            ('Concluídos',   'green',  3);
    END IF;
END $$;

-- 4. Migra column_id das tarefas: faz corresponder ao id da coluna do sistema pelo nome
UPDATE public.tasks_items ti
SET column_id = sc.id
FROM public.tasks_columns tc
JOIN public.tasks_system_columns sc ON LOWER(sc.name) = LOWER(tc.name)
WHERE ti.column_id = tc.id;

-- 5. Tarefas cujas colunas não foram mapeadas para colunas do sistema ficam sem coluna
UPDATE public.tasks_items
SET column_id = NULL
WHERE column_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM public.tasks_system_columns WHERE id = tasks_items.column_id
  );

-- 6. Adiciona nova FK: tasks_items.column_id → tasks_system_columns
ALTER TABLE public.tasks_items
    ADD CONSTRAINT tasks_items_column_id_fkey
        FOREIGN KEY (column_id) REFERENCES public.tasks_system_columns(id) ON DELETE SET NULL;

-- Verificação final
SELECT
    (SELECT COUNT(*) FROM public.tasks_system_columns)                         AS system_columns_criadas,
    (SELECT COUNT(*) FROM public.tasks_items WHERE column_id IS NOT NULL)      AS tarefas_com_coluna_sistema,
    (SELECT COUNT(*) FROM public.tasks_items WHERE column_id IS NULL)          AS tarefas_sem_coluna;
