import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { CreateQuestionData, UpdateQuestionData } from '@/lib/types/survey-types';

// GET /api/admin/surveys/[id]/questions - Get all questions for a survey
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getServiceSupabase();

        const { data, error } = await supabase
            .from('survey_questions')
            .select('*')
            .eq('survey_id', params.id)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Error fetching questions:', error);
            return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error in GET /api/admin/surveys/[id]/questions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/surveys/[id]/questions - Create new question
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body: CreateQuestionData = await request.json();
        const supabase = getServiceSupabase();

        // Get current max order_index
        const { data: maxOrder } = await supabase
            .from('survey_questions')
            .select('order_index')
            .eq('survey_id', params.id)
            .order('order_index', { ascending: false })
            .limit(1)
            .single();

        const nextOrderIndex = maxOrder ? maxOrder.order_index + 1 : 0;

        const { data, error } = await supabase
            .from('survey_questions')
            .insert({
                survey_id: params.id,
                order_index: nextOrderIndex,
                title: body.title,
                subtitle: body.subtitle || null,
                question_type: body.question_type,
                is_required: body.is_required,
                settings: body.settings
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating question:', error);
            return NextResponse.json({ message: 'Erro ao criar pergunta' }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/admin/surveys/[id]/questions:', error);
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}

// PUT /api/admin/surveys/[id]/questions - Update multiple questions (for reordering)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body: { questions: Array<{ id: string; order_index: number }> } = await request.json();
        const supabase = getServiceSupabase();

        // Update each question's order
        const updates = body.questions.map(q =>
            supabase
                .from('survey_questions')
                .update({ order_index: q.order_index })
                .eq('id', q.id)
                .eq('survey_id', params.id)
        );

        await Promise.all(updates);

        return NextResponse.json({ message: 'Ordem atualizada com sucesso' });
    } catch (error) {
        console.error('Error in PUT /api/admin/surveys/[id]/questions:', error);
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}
