-- =============================================================================
-- Adiciona suporte a arquivamento de projetos e tarefas
-- Projetos arquivados ficam ocultos da tela principal e de relatórios.
-- Ao arquivar um projeto, todas as suas tarefas são arquivadas junto.
-- =============================================================================

-- Adiciona coluna is_archived aos projetos
ALTER TABLE tasks_projects
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Adiciona coluna is_archived às tarefas
ALTER TABLE tasks_items
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Índices para otimizar filtros por is_archived
CREATE INDEX IF NOT EXISTS idx_projects_archived ON tasks_projects (is_archived);
CREATE INDEX IF NOT EXISTS idx_tasks_archived    ON tasks_items    (is_archived);
