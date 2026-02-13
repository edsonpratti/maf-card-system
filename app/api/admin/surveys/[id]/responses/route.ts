import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyAdminAccess, handleAuthError } from '@/lib/auth';

// DELETE /api/admin/surveys/[id]/responses - Delete a specific response
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: surveyId } = await params
    
    try {
        // Verificar autenticação de admin
        await verifyAdminAccess();
        
        const { searchParams } = new URL(request.url);
        const responseId = searchParams.get('responseId');
        
        if (!responseId) {
            return NextResponse.json({ error: 'Response ID is required' }, { status: 400 });
        }
        
        const supabase = getServiceSupabase();

        // First delete all answers associated with this response
        const { error: answersError } = await supabase
            .from('survey_answers')
            .delete()
            .eq('response_id', responseId);

        if (answersError) {
            console.error('Error deleting answers:', answersError);
            return NextResponse.json({ error: 'Failed to delete answers' }, { status: 500 });
        }

        // Then delete the response itself
        const { error: responseError } = await supabase
            .from('survey_responses')
            .delete()
            .eq('id', responseId)
            .eq('survey_id', surveyId);

        if (responseError) {
            console.error('Error deleting response:', responseError);
            return NextResponse.json({ error: 'Failed to delete response' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Resposta excluída com sucesso' });
    } catch (error) {
        console.error('Error in DELETE /api/admin/surveys/[id]/responses:', error);
        return handleAuthError(error);
    }
}

// GET /api/admin/surveys/[id]/responses - Get individual responses with lead data
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        // Verificar autenticação de admin
        await verifyAdminAccess();
        
        const supabase = getServiceSupabase();

        // Get survey questions first
        const { data: questions, error: questionsError } = await supabase
            .from('survey_questions')
            .select('id, title, question_type, order_index, settings')
            .eq('survey_id', id)
            .order('order_index', { ascending: true });

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
        }

        // Get all completed responses with their answers
        const { data: responses, error: responsesError } = await supabase
            .from('survey_responses')
            .select(`
                id,
                session_id,
                started_at,
                completed_at,
                survey_answers (
                    question_id,
                    answer_value
                )
            `)
            .eq('survey_id', id)
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false });

        if (responsesError) {
            console.error('Error fetching responses:', responsesError);
            return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
        }

        // Format answers per response for easier display
        const formattedResponses = responses?.map(response => {
            const answersMap: Record<string, any> = {};
            
            response.survey_answers?.forEach((answer: any) => {
                const value = answer.answer_value;
                
                // Format answer based on type
                if (value.text !== undefined) {
                    answersMap[answer.question_id] = value.text;
                } else if (value.selected !== undefined) {
                    answersMap[answer.question_id] = Array.isArray(value.selected) 
                        ? value.selected.join(', ') 
                        : value.selected;
                } else if (value.value !== undefined) {
                    answersMap[answer.question_id] = value.value;
                } else {
                    answersMap[answer.question_id] = JSON.stringify(value);
                }
            });

            return {
                id: response.id,
                sessionId: response.session_id,
                startedAt: response.started_at,
                completedAt: response.completed_at,
                answers: answersMap
            };
        }) || [];

        return NextResponse.json({
            questions: questions || [],
            responses: formattedResponses,
            total: formattedResponses.length
        });
    } catch (error) {
        console.error('Error in GET /api/admin/surveys/[id]/responses:', error);
        return handleAuthError(error);
    }
}
