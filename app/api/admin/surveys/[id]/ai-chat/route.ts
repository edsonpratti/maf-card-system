import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyAdminAccess, handleAuthError } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/admin/surveys/[id]/ai-chat - Chat with AI about survey data
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        await verifyAdminAccess();

        const { messages } = await request.json();

        const supabase = getServiceSupabase();

        // Fetch survey info
        const { data: survey } = await supabase
            .from('surveys')
            .select('name, description')
            .eq('id', id)
            .single();

        if (!survey) {
            return NextResponse.json({ error: 'Enquete não encontrada' }, { status: 404 });
        }

        // Fetch questions
        const { data: questions } = await supabase
            .from('survey_questions')
            .select('id, title, question_type, settings, order_index')
            .eq('survey_id', id)
            .order('order_index', { ascending: true });

        // Fetch completed responses with answers
        const { data: responses } = await supabase
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

        // Build context summary per question
        const questionsWithAnswers = (questions || []).map(q => {
            const answers = (responses || []).flatMap(r =>
                (r.survey_answers as any[]).filter(a => a.question_id === q.id)
            );

            const answersText = answers.map(a => {
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
                respostas: answersText.slice(0, 50), // limit per question to avoid token overflow
            };
        });

        const contextData = JSON.stringify(questionsWithAnswers, null, 2);
        const truncatedContext = contextData.length > 8000
            ? contextData.slice(0, 8000) + '\n...(dados truncados para limite de tokens)'
            : contextData;

        const systemPrompt = `Você é um analista de dados especializado em pesquisas, auxiliando administradores do MAF Pro — sistema de credenciamento profissional para educadores físicos no Brasil.

ENQUETE: "${survey.name}"${survey.description ? `\nDESCRIÇÃO: ${survey.description}` : ''}
TOTAL DE RESPONDENTES: ${responses?.length || 0}

DADOS COMPLETOS POR PERGUNTA:
${truncatedContext}

INSTRUÇÕES:
- Responda SEMPRE em português brasileiro
- Seja conversacional, objetivo e útil
- Baseie suas respostas exclusivamente nos dados acima
- Cite números, percentuais e exemplos das respostas quando relevante
- Não use formatação markdown pesada (evite # cabeçalhos), prefira texto natural com listas simples quando necessário
- Se o usuário perguntar algo não relacionado à enquete, redirecione gentilmente para os dados disponíveis
- Seja proativo em oferecer insights interessantes`;

        // First message: auto-generate initial analysis without showing the trigger prompt
        const chatHistory: { role: 'user' | 'assistant'; content: string }[] =
            messages.length === 0
                ? [
                    {
                        role: 'user',
                        content:
                            'Olá! Apresente-se brevemente e faça uma análise inicial dos principais achados desta enquete. Destaque os pontos mais relevantes e interessantes dos dados.',
                    },
                ]
                : messages.map((m: any) => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content,
                }));

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                ...chatHistory,
            ],
            temperature: 0.5,
            max_tokens: 1200,
        });

        const reply = completion.choices[0]?.message?.content;
        if (!reply) {
            return NextResponse.json({ error: 'Resposta vazia da IA' }, { status: 500 });
        }

        return NextResponse.json({ message: reply });
    } catch (error: any) {
        console.error('Error in POST /api/admin/surveys/[id]/ai-chat:', error);

        if (error?.code === 'insufficient_quota') {
            return NextResponse.json(
                { error: 'Cota da API OpenAI esgotada. Adicione créditos em platform.openai.com.' },
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
                { error: 'Limite de requisições atingido. Aguarde alguns instantes e tente novamente.' },
                { status: 429 }
            );
        }

        return handleAuthError(error);
    }
}
