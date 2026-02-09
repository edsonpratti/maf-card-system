-- Script para gerar card_number e validation_token para cartões aprovados sem essas informações

DO $$
DECLARE
    card_record RECORD;
    new_card_number VARCHAR(50);
    new_validation_token VARCHAR(100);
BEGIN
    -- Iterar sobre todos os cartões aprovados sem card_number ou validation_token
    FOR card_record IN 
        SELECT id 
        FROM public.users_cards 
        WHERE (status = 'AUTO_APROVADA' OR status = 'APROVADA_MANUAL')
        AND (card_number IS NULL OR validation_token IS NULL)
    LOOP
        -- Gerar card_number único
        new_card_number := 'MAF-' || UPPER(encode(gen_random_bytes(4), 'hex')) || '-' || UPPER(encode(gen_random_bytes(3), 'hex'));
        
        -- Gerar validation_token único (64 caracteres hex)
        new_validation_token := encode(gen_random_bytes(32), 'hex');
        
        -- Atualizar o registro
        UPDATE public.users_cards
        SET 
            card_number = COALESCE(card_number, new_card_number),
            validation_token = COALESCE(validation_token, new_validation_token),
            updated_at = NOW()
        WHERE id = card_record.id;
        
        RAISE NOTICE 'Atualizado cartão ID: %', card_record.id;
    END LOOP;
END $$;

-- Verificar resultados
SELECT 
    id,
    name,
    status,
    card_number,
    CASE 
        WHEN validation_token IS NOT NULL THEN 'SIM' 
        ELSE 'NÃO' 
    END as has_token
FROM public.users_cards
WHERE status IN ('AUTO_APROVADA', 'APROVADA_MANUAL')
ORDER BY created_at DESC;
