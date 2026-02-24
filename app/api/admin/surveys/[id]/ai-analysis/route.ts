import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyAdminAccess, handleAuthError } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/admin/surveys/[id]/ai-analysis - Generate AI analysis for survey responses
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        await verifyAdminAccess();

        const supabase = getServiceSupabase();

        // Buscar dados da enquete
        const { data: survey, error: surveyError } = await supabase
            .from('surveys')
            .select('name, description')
            .eq('id', id)
            .single();

        if (surveyError || !survey) {
            return NextResponse.json({ error: 'Enquete não encontrada' }, { status: 404 });
        }

        // Buscar perguntas
        const { data: questions, error: questionsError } = await supabase
            .from('survey_questions')
            .select('id, title, question_type, settings, order_index')
            .eq('survey_id', id)
            .order('order_index', { ascending: true });

        if (questionsError || !questions || questions.length === 0) {
            return NextResponse.json({ error: 'Nenhuma pergunta encontrada' }, { status: 404 });
        }

        // Buscar respostas completas com suas answers
        const { data: responses, error: responsesError } = await supabase
            .from('survey_responses')
            .select(`
                id,
                started_at,
                completed_at,
                survey_answers (
                    question_id,
                    answer_value
                )
            `)
            .eq('survey_id', id)
            .not('completed_at', 'is', null);

        if (responsesError) {
            return NextResponse.json({ error: 'Erro ao buscar respostas' }, { status: 500 });
        }

        if (!responses || responses.length === 0) {
            return NextResponse.json({ error: 'Nenhuma resposta disponível para análise' }, { status: 400 });
        }

        // Montar resumo das respostas por pergunta para o prompt
        const questionsWithAnswers = questions.map((q) => {
            const answers = responses.flatMap((r) =>
                (r.survey_answers as any[]).filter((a) => a.question_id === q.id)
            );

            const answersText = answers.map((a) => {
                const val = a.answer_value;
                if (typeof val === 'string') return val;
                if (val?.text) return val.text;
                if (val?.selected) return Array.isArray(val.selected) ? val.selected.join(', ') : val.selected;
                if (val?.value !== undefined) return String(val.value);
                if (val?.first_name || val?.last_name) return `${val.first_name || ''} ${val.last_name || ''}`.trim();
                return JSON.stringify(val);
            }).filter(Boolean);

            return {
                pergunta: q.title,
                tipo: q.question_type,
                total_respostas: answersText.length,
                respostas: answersText,
            };
        });

        // Limitar volume de texto enviado para a IA (max ~6000 chars por segurança de tokens)
        let promptData = JSON.stringify(questionsWithAnswers, null, 2);
        if (promptData.length > 6000) {
            // Resumir respostas longas de texto
            const trimmed = questionsWithAnswers.map((q) => ({
                ...q,
                respostas: q.respostas.slice(0, 30),
            }));
            promptData = JSON.stringify(trimmed, null, 2);
        }

        const systemPrompt = `Você é um analista de dados especializado em pesquisas e enquetes. 
Analise os dados fornecidos de uma enquete e gere um relatório detalhado em português brasileiro.
Seu relatório deve ser estruturado, claro e útil para tomada de decisão.
Use linguagem profissional mas acessível.
Sempre retorne um JSON válido com a estrutura exata especificada, sem markdown ou texto extra.`;

        const userPrompt = `Analise os resultados da enquete "${survey.name}"${survey.description ? ` (${survey.description})` : ''}.

Total de respondentes: ${responses.length}

Dados por pergunta:
${promptData}

Retorne SOMENTE um JSON válido com esta estrutura exata:
{
  "sumario_executivo": "Parágrafo de 3-5 frases resumindo os principais achados da enquete",
  "pontos_positivos": ["ponto1", "ponto2", "ponto3"],
  "pontos_atencao": ["ponto1", "ponto2"],
  "analise_por_pergunta": [
    {
      "pergunta": "título da pergunta",
      "insight": "análise específica desta pergunta em 2-3 frases",
      "destaque": "dado mais relevante desta pergunta"
    }
  ],
  "sentimento_geral": "positivo" | "neutro" | "negativo" | "misto",
  "sentimento_score": número de 0 a 100 (0=muito negativo, 50=neutro, 100=muito positivo),
  "recomendacoes": ["recomendação1", "recomendação2", "recomendação3"],
  "conclusao": "Parágrafo final com conclusão e próximos passos sugeridos"
}`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content;
        if (!raw) {
            return NextResponse.json({ error: 'Resposta vazia da IA' }, { status: 500 });
        }

        const analysis = JSON.parse(raw);

        return NextResponse.json({
            analysis,
            meta: {
                survey_name: survey.name,
                total_responses: responses.length,
                questions_analyzed: questions.length,
                generated_at: new Date().toISOString(),
                model: 'gpt-4o-mini',
            },
        });
    } catch (error: any) {
        console.error('Error in POST /api/admin/surveys/[id]/ai-analysis:', error);

        // Erros específicos da OpenAI
        if (error?.code === 'insufficient_quota') {
            return NextResponse.json(
                { error: 'Cota da API OpenAI esgotada. Adicione créditos em platform.openai.com para continuar.' },
                { status: 402 }
            );
        }
        if (error?.code === 'invalid_api_key') {
            return NextResponse.json(
                { error: 'Chave da API OpenAI inválida. Verifique a configuração no servidor.' },
                { status: 401 }
            );
        }
        if (error?.code === 'rate_limit_exceeded') {
            return NextResponse.json(
                { error: 'Limite de requisições da OpenAI atingido. Aguarde alguns instantes e tente novamente.' },
                { status: 429 }
            );
        }

        return handleAuthError(error);
    }
}
