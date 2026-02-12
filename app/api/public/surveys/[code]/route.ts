import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/public/surveys/[code] - Get active survey by code (public)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params
    try {
        const supabase = getServiceSupabase();

        // Get survey by code or id (fallback)
        const { data: surveyByCode } = await supabase
            .from('surveys')
            .select('*')
            .eq('code', code)
            .single();

        const { data: surveyById } = !surveyByCode
            ? await supabase
                .from('surveys')
                .select('*')
                .eq('id', code)
                .single()
            : { data: null };

        const survey = surveyByCode || surveyById;

        if (!survey) {
            return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
        }

        // Check if survey is active
        const now = new Date();
        const startDate = new Date(survey.start_date);
        const endDate = survey.end_date ? new Date(survey.end_date) : null;

        if (survey.status !== 'active' || startDate > now || (endDate && endDate < now)) {
            return NextResponse.json({ error: 'Survey is not currently active' }, { status: 403 });
        }

        // Get questions
        const { data: questions, error: questionsError } = await supabase
            .from('survey_questions')
            .select('*')
            .eq('survey_id', survey.id)
            .order('order_index', { ascending: true });

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
        }

        return NextResponse.json({
            survey,
            questions: questions || []
        });
    } catch (error) {
        console.error('Error in GET /api/public/surveys/[code]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
