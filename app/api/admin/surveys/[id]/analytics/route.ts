import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyAdminAccess, handleAuthError } from '@/lib/auth';
import { processChoiceAnalytics, processLinearScaleAnalytics } from '@/lib/utils/survey-utils';

// GET /api/admin/surveys/[id]/analytics - Get analytics data for a survey
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        // Verificar autenticação de admin
        await verifyAdminAccess();
        
        const supabase = getServiceSupabase();

        // Get survey summary stats
        const { data: summaryData } = await supabase
            .rpc('get_survey_analytics', { survey_id_param: id })
            .single();

        // Get all responses with answers
        const { data: responses, error: responsesError } = await supabase
            .from('survey_responses')
            .select(`
                id,
                completed_at,
                started_at,
                survey_answers (
                    question_id,
                    answer_value
                )
            `)
            .eq('survey_id', id)
            .not('completed_at', 'is', null);

        if (responsesError) {
            console.error('Error fetching responses:', responsesError);
            return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
        }

        // Get questions
        const { data: questions, error: questionsError } = await supabase
            .from('survey_questions')
            .select('*')
            .eq('survey_id', id)
            .order('order_index', { ascending: true });

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
        }

        // Process analytics for each question
        const questionAnalytics = questions?.map(question => {
            const questionAnswers = responses
                ?.flatMap(r => r.survey_answers)
                .filter(a => a.question_id === question.id) || [];

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
            } else if (question.question_type === 'short_text' || question.question_type === 'long_text') {
                analyticsData = {
                    type: 'text',
                    responses: questionAnswers.map((a: any) => ({
                        id: a.id,
                        text: a.answer_value.text,
                        created_at: a.created_at
                    }))
                };
            }

            return {
                question_id: question.id,
                question_title: question.title,
                question_type: question.question_type,
                total_answers: questionAnswers.length,
                data: analyticsData
            };
        }) || [];

        // Calculate responses per day for the last 30 days
        const responsesPerDay = responses?.reduce((acc: any, r) => {
            const date = new Date(r.completed_at).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {}) || {};

        return NextResponse.json({
            summary: summaryData || {
                total_responses: responses?.length || 0,
                completed_responses: responses?.length || 0,
                completion_rate: 100,
                avg_completion_time: null
            },
            question_analytics: questionAnalytics,
            responses_per_day: responsesPerDay,
            total_responses: responses?.length || 0
        });
    } catch (error) {
        console.error('Error in GET /api/admin/surveys/[id]/analytics:', error);
        return handleAuthError(error);
    }
}
