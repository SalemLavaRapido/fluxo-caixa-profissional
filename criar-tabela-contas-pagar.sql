-- =====================================================
-- TABELA: contas_pagar
-- Objetivo: gerenciar contas a pagar, sem alterar o caixa atual
-- Execute este script no SQL Editor do Supabase
-- =====================================================

CREATE TABLE IF NOT EXISTS contas_pagar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    data_vencimento DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago')),
    data_pagamento DATE,
    categoria TEXT NOT NULL CHECK (categoria IN (
        'aluguel','funcionarios','fornecedores','impostos',
        'marketing','transporte','outras'
    )),
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cp_select_own" ON contas_pagar;
DROP POLICY IF EXISTS "cp_insert_own" ON contas_pagar;
DROP POLICY IF EXISTS "cp_update_own" ON contas_pagar;
DROP POLICY IF EXISTS "cp_delete_own" ON contas_pagar;

CREATE POLICY "cp_select_own" ON contas_pagar
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cp_insert_own" ON contas_pagar
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cp_update_own" ON contas_pagar
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cp_delete_own" ON contas_pagar
    FOR DELETE USING (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cp_user_id     ON contas_pagar(user_id);
CREATE INDEX IF NOT EXISTS idx_cp_status      ON contas_pagar(status);
CREATE INDEX IF NOT EXISTS idx_cp_vencimento  ON contas_pagar(data_vencimento);

-- Trigger updated_at (reutiliza a função já criada no setup principal)
DROP TRIGGER IF EXISTS update_contas_pagar_updated_at ON contas_pagar;
CREATE TRIGGER update_contas_pagar_updated_at
    BEFORE UPDATE ON contas_pagar
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE contas_pagar IS 'Contas a pagar pendentes/pagas. Ao marcar como pago, o sistema insere uma saída correspondente na tabela saidas.';
