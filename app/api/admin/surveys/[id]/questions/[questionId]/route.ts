import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { UpdateQuestionData } from '@/lib/types/survey-types';

// GET /api/admin/surveys/[id]/questions/[questionId] - Get single question
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; questionId: string } }
) {
    try {
        const supabase = getServiceSupabase();

        const { data, error } = await supabase
            .from('survey_questions')
            .select('*')
            .eq('id', params.questionId)
            .eq('survey_id', params.id)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in GET question:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/admin/surveys/[id]/questions/[questionId] - Update question
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string; questionId: string } }
) {
    try {
        const body: UpdateQuestionData = await request.json();
        const supabase = getServiceSupabase();

        const { data, error } = await supabase
            .from('survey_questions')
            .update(body)
            .eq('id', params.questionId)
            .eq('survey_id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating question:', error);
            return NextResponse.json({ message: 'Erro ao atualizar pergunta' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in PUT question:', error);
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}

// DELETE /api/admin/surveys/[id]/questions/[questionId] - Delete question
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; questionId: string } }
) {
    try {
        const supabase = getServiceSupabase();

        const { error } = await supabase
            .from('survey_questions')
            .delete()
            .eq('id', params.questionId)
            .eq('survey_id', params.id);

        if (error) {
            console.error('Error deleting question:', error);
            return NextResponse.json({ message: 'Erro ao excluir pergunta' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Pergunta excluída com sucesso' });
    } catch (error) {
        console.error('Error in DELETE question:', error);
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}
