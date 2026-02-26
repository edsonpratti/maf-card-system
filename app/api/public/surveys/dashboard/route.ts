import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { processChoiceAnalytics, processLinearScaleAnalytics } from '@/lib/utils/survey-utils';

// GET /api/public/surveys/dashboard - Rota pública, sem autenticação
// Retorna todas as enquetes ATIVAS com seus dados analíticos completos
export async function GET() {
    try {
        const supabase = getServiceSupabase();
        const now = new Date().toISOString();

        // Buscar todas as enquetes ativas
        const { data: surveys, error: surveysError } = await supabase
            .from('surveys')
            .select('*')
            .eq('status', 'active')
            .lte('start_date', now)
            .order('created_at', { ascending: false });

        if (surveysError) {
            console.error('Error fetching surveys:', surveysError);
            return NextResponse.json({ error: 'Erro ao buscar enquetes' }, { status: 500 });
        }

        // Filtrar: remover enquetes que passaram da end_date (se houver)
        const activeSurveys = (surveys || []).filter(survey => {
            if (survey.end_date && new Date(survey.end_date) < new Date()) return false;
            return true;
        });

        if (activeSurveys.length === 0) {
            return NextResponse.json({ surveys: [] });
        }

        // Para cada enquete, buscar perguntas e respostas
        const surveysWithAnalytics = await Promise.all(
            activeSurveys.map(async (survey) => {
                // Buscar perguntas
                const { data: questions } = await supabase
                    .from('survey_questions')
                    .select('*')
                    .eq('survey_id', survey.id)
                    .order('order_index', { ascending: true });

                // Buscar respostas completas
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
                    .eq('survey_id', survey.id)
                    .not('completed_at', 'is', null);

                const completedResponses = responses || [];
                const questionList = questions || [];

                // Processar analytics por pergunta
                const questionAnalytics = questionList.map(question => {
                    const questionAnswers = completedResponses
                        .flatMap(r => r.survey_answers)
                        .filter((a: any) => a.question_id === question.id);

                    let analyticsData: any = null;

                    if (question.question_type === 'multiple_choice' || question.question_type === 'checkboxes') {
                        const options = (question.settings as any).options || [];
                        analyticsData = {
                            type: question.question_type,
                            options: processChoiceAnalytics(questionAnswers as any, options)
                        };
                    } else if (question.question_type === 'linear_scale') {
                        const settings = question.settings as any;
                        analyticsData = {
                            type: 'linear_scale',
                            ...processLinearScaleAnalytics(questionAnswers as any, settings.min, settings.max)
                        };
                    } else if (
                        question.question_type === 'short_text' ||
                        question.question_type === 'long_text' ||
                        question.question_type === 'name' ||
                        question.question_type === 'email' ||
                        question.question_type === 'phone'
                    ) {
                        // SEGURANÇA: endpoint público retorna apenas contagem, nunca texto individual
                        analyticsData = {
                            type: 'text',
                            total: questionAnswers.length
                        };
                    }

                    return {
                        question_id: question.id,
                        question_title: question.title,
                        question_type: question.question_type,
                        order_index: question.order_index,
                        total_answers: questionAnswers.length,
                        data: analyticsData
                    };
                });

                // Calcular respostas por dia (últimos 30 dias)
                const responsesPerDay = completedResponses.reduce((acc: any, r: any) => {
                    const date = new Date(r.completed_at).toISOString().split('T')[0];
                    acc[date] = (acc[date] || 0) + 1;
                    return acc;
                }, {});

                // Gerar série de respostas por dia ordenada
                const responsesTimeline = Object.entries(responsesPerDay)
                    .map(([date, count]) => ({ date, count: count as number }))
                    .sort((a, b) => a.date.localeCompare(b.date));

                return {
                    survey: {
                        id: survey.id,
                        code: survey.code,
                        name: survey.name,
                        description: survey.description,
                        start_date: survey.start_date,
                        end_date: survey.end_date,
                        status: survey.status,
                        created_at: survey.created_at,
                    },
                    summary: {
                        total_responses: completedResponses.length,
                        total_questions: questionList.length,
                    },
                    question_analytics: questionAnalytics,
                    responses_timeline: responsesTimeline,
                    // raw_responses removido: endpoint público não deve expor dados pessoais individuais
                };
            })
        );

        return NextResponse.json({ surveys: surveysWithAnalytics });
    } catch (error) {
        console.error('Error in GET /api/public/surveys/dashboard:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
