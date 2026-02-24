-- =============================================================================
-- MAF Pro Tasks — Hierarquia: Projetos > Tarefas > Sub Tarefas
-- Execute no SQL Editor do Supabase Dashboard
--
-- Se você já rodou a versão anterior deste arquivo (tabela "tasks" plana),
-- descomente o bloco de limpeza abaixo antes de executar.
-- =============================================================================

-- ─── Limpeza da versão anterior (descomente se necessário) ───────────────────
-- DROP TABLE  IF EXISTS tasks            CASCADE;
-- DROP TYPE   IF EXISTS task_status      CASCADE;
-- DROP TYPE   IF EXISTS task_priority    CASCADE;
-- DROP FUNCTION IF EXISTS update_tasks_updated_at CASCADE;

-- ─── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('active', 'paused', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Projetos ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks_projects (
    id           UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    name         TEXT          NOT NULL,
    description  TEXT,
    manager_email TEXT         NOT NULL,   -- email do admin gerente
    status       project_status NOT NULL DEFAULT 'active',
    start_date   DATE          NOT NULL,
    end_date     DATE,
    created_by   TEXT          NOT NULL,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── Tarefas ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks_items (
    id             UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id     UUID          NOT NULL REFERENCES tasks_projects(id) ON DELETE CASCADE,
    title          TEXT          NOT NULL,
    description    TEXT,
    status         task_status   NOT NULL DEFAULT 'todo',
    priority       task_priority NOT NULL DEFAULT 'medium',
    assignee_email TEXT,                    -- email do admin responsável
    due_datetime   TIMESTAMPTZ,             -- prazo com data e hora
    created_by     TEXT          NOT NULL,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── Sub Tarefas ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks_subtasks (
    id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id        UUID        NOT NULL REFERENCES tasks_items(id) ON DELETE CASCADE,
    title          TEXT        NOT NULL,
    assignee_email TEXT,
    due_date       DATE,
    is_done        BOOLEAN     NOT NULL DEFAULT false,
    created_by     TEXT        NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Comentários ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks_comments (
    id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id      UUID        NOT NULL REFERENCES tasks_items(id) ON DELETE CASCADE,
    content      TEXT        NOT NULL,
    author_email TEXT        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Anexos ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks_attachments (
    id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id      UUID        NOT NULL REFERENCES tasks_items(id) ON DELETE CASCADE,
    file_name    TEXT        NOT NULL,
    file_path    TEXT        NOT NULL,   -- path no bucket "task-attachments"
    file_size    BIGINT,
    mime_type    TEXT,
    uploaded_by  TEXT        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Função e Triggers updated_at ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_maf_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_projects_updated_at  ON tasks_projects;
CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON tasks_projects
    FOR EACH ROW EXECUTE FUNCTION update_maf_tasks_updated_at();

DROP TRIGGER IF EXISTS trg_items_updated_at ON tasks_items;
CREATE TRIGGER trg_items_updated_at
    BEFORE UPDATE ON tasks_items
    FOR EACH ROW EXECUTE FUNCTION update_maf_tasks_updated_at();

DROP TRIGGER IF EXISTS trg_subtasks_updated_at ON tasks_subtasks;
CREATE TRIGGER trg_subtasks_updated_at
    BEFORE UPDATE ON tasks_subtasks
    FOR EACH ROW EXECUTE FUNCTION update_maf_tasks_updated_at();

DROP TRIGGER IF EXISTS trg_comments_updated_at ON tasks_comments;
CREATE TRIGGER trg_comments_updated_at
    BEFORE UPDATE ON tasks_comments
    FOR EACH ROW EXECUTE FUNCTION update_maf_tasks_updated_at();

-- ─── Índices ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_status      ON tasks_projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_manager     ON tasks_projects (manager_email);
CREATE INDEX IF NOT EXISTS idx_projects_dates       ON tasks_projects (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_items_project        ON tasks_items (project_id);
CREATE INDEX IF NOT EXISTS idx_items_status         ON tasks_items (status);
CREATE INDEX IF NOT EXISTS idx_items_priority       ON tasks_items (priority);
CREATE INDEX IF NOT EXISTS idx_items_assignee       ON tasks_items (assignee_email);
CREATE INDEX IF NOT EXISTS idx_items_due            ON tasks_items (due_datetime);
CREATE INDEX IF NOT EXISTS idx_subtasks_task        ON tasks_subtasks (task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_done        ON tasks_subtasks (task_id, is_done);
CREATE INDEX IF NOT EXISTS idx_comments_task        ON tasks_comments (task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_task     ON tasks_attachments (task_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Acesso exclusivo via service role key nas rotas de API admin.
-- Usuários autenticados comuns não têm acesso direto.

ALTER TABLE tasks_projects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks_subtasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks_comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access - projects"
    ON tasks_projects    FOR ALL TO authenticated USING (false);
CREATE POLICY "No direct access - items"
    ON tasks_items       FOR ALL TO authenticated USING (false);
CREATE POLICY "No direct access - subtasks"
    ON tasks_subtasks    FOR ALL TO authenticated USING (false);
CREATE POLICY "No direct access - comments"
    ON tasks_comments    FOR ALL TO authenticated USING (false);
CREATE POLICY "No direct access - attachments"
    ON tasks_attachments FOR ALL TO authenticated USING (false);

-- ─── Storage: bucket privado para anexos ─────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'task-attachments',
    'task-attachments',
    false,
    52428800, -- 50 MB por arquivo
    ARRAY[
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv',
        'application/zip'
    ]
)
ON CONFLICT (id) DO NOTHING;
