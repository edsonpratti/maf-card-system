import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { SurveySubmission } from '@/lib/types/survey-types';

// POST /api/public/surveys/[code]/submit - Submit survey responses (public)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
    const { code } = await params
) {
    try {
        const body: SurveySubmission = await request.json();
        const supabase = getServiceSupabase();

        // Get survey
        const { data: survey, error: surveyError } = await supabase
            .from('surveys')
            .select('id, status, start_date, end_date')
            .eq('code', code)
            .single();

        if (surveyError || !survey) {
            return NextResponse.json({ message: 'Enquete não encontrada' }, { status: 404 });
        }

        // Validate survey is active
        const now = new Date();
        const startDate = new Date(survey.start_date);
        const endDate = survey.end_date ? new Date(survey.end_date) : null;

        if (survey.status !== 'active' || startDate > now || (endDate && endDate < now)) {
            return NextResponse.json({ message: 'Esta enquete não está mais ativa' }, { status: 403 });
        }

        // Get client info
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Create response record
        const { data: response, error: responseError } = await supabase
            .from('survey_responses')
            .insert({
                survey_id: survey.id,
                session_id: body.session_id,
                ip_address: ip,
                user_agent: userAgent,
                completed_at: new Date().toISOString()
            })
            .select()
            .single();

        if (responseError || !response) {
            console.error('Error creating response:', responseError);
            return NextResponse.json({ message: 'Erro ao salvar resposta' }, { status: 500 });
        }

        // Insert all answers
        const answers = body.answers.map(answer => ({
            response_id: response.id,
            question_id: answer.question_id,
            answer_value: answer.answer_value
        }));

        const { error: answersError } = await supabase
            .from('survey_answers')
            .insert(answers);

        if (answersError) {
            console.error('Error inserting answers:', answersError);
            return NextResponse.json({ message: 'Erro ao salvar respostas' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Respostas enviadas com sucesso!',
            response_id: response.id
        }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/public/surveys/[code]/submit:', error);
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}
