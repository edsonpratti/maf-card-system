import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { convertToCSV } from '@/lib/utils/survey-utils';

// GET /api/admin/surveys/[id]/export - Export survey responses as CSV
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const supabase = getServiceSupabase();

        // Get survey name
        const { data: survey } = await supabase
            .from('surveys')
            .select('name')
            .eq('id', id)
            .single();

        // Get questions
        const { data: questions } = await supabase
            .from('survey_questions')
            .select('*')
            .eq('survey_id', id)
            .order('order_index', { ascending: true });

        // Get responses with answers
        const { data: responses } = await supabase
            .from('survey_responses')
            .select(`
                id,
                completed_at,
                survey_answers (
                    question_id,
                    answer_value
                )
            `)
            .eq('survey_id', id)
            .not('completed_at', 'is', null);

        if (!questions || !responses) {
            return NextResponse.json({ error: 'No data to export' }, { status: 404 });
        }

        // Format responses for CSV
        const formattedResponses = responses.map(r => ({
            response_id: r.id,
            completed_at: r.completed_at,
            answers: r.survey_answers
        }));

        const csv = convertToCSV(questions, formattedResponses as any);

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${survey?.name || 'survey'}_respostas.csv"`
            }
        });
    } catch (error) {
        console.error('Error in GET /api/admin/surveys/[id]/export:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
