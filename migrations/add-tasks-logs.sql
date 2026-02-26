-- =============================================================================
-- MAF Pro Tasks — Logs de Atividade
-- Registra todas as alterações feitas em cada tarefa.
-- Execute no SQL Editor do Supabase Dashboard.
-- =============================================================================

CREATE TABLE IF NOT EXISTS tasks_logs (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id     UUID        NOT NULL REFERENCES tasks_items(id) ON DELETE CASCADE,
    actor_email TEXT        NOT NULL,
    action      TEXT        NOT NULL,
    detail      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  tasks_logs             IS 'Histórico imutável de atividades de cada tarefa do MAF Pro Tasks';
COMMENT ON COLUMN tasks_logs.action      IS 'Código do tipo de evento (ex: created, title_changed, done, subtask_added...)';
COMMENT ON COLUMN tasks_logs.detail      IS 'Descrição legível do que foi alterado (ex: "Responsável: a@x.com → b@x.com")';

CREATE INDEX IF NOT EXISTS idx_tasks_logs_task ON tasks_logs(task_id, created_at DESC);

-- RLS: sem acesso direto; escrita exclusiva via service_role nas rotas de API
ALTER TABLE tasks_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'tasks_logs' AND policyname = 'No direct access - logs'
    ) THEN
        CREATE POLICY "No direct access - logs"
            ON tasks_logs FOR ALL TO authenticated USING (false);
    END IF;
END $$;
