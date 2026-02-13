import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyAdminAccess, handleAuthError } from '@/lib/auth';
import { CreateQuestionData, UpdateQuestionData } from '@/lib/types/survey-types';

// GET /api/admin/surveys/[id]/questions - Get all questions for a survey
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        // Verificar autenticação de admin
        await verifyAdminAccess();
        
        const supabase = getServiceSupabase();

        const { data, error } = await supabase
            .from('survey_questions')
            .select('*')
            .eq('survey_id', id)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Error fetching questions:', error);
            return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error in GET /api/admin/surveys/[id]/questions:', error);
        return handleAuthError(error);
    }
}

// POST /api/admin/surveys/[id]/questions - Create new question
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        // Verificar autenticação de admin
        await verifyAdminAccess();
        
        const body: CreateQuestionData = await request.json();
        const supabase = getServiceSupabase();

        // Get current max order_index
        const { data: maxOrder } = await supabase
            .from('survey_questions')
            .select('order_index')
            .eq('survey_id', id)
            .order('order_index', { ascending: false })
            .limit(1)
            .single();

        const nextOrderIndex = maxOrder ? maxOrder.order_index + 1 : 0;

        const { data, error } = await supabase
            .from('survey_questions')
            .insert({
                survey_id: id,
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
        return handleAuthError(error);
    }
}

// PUT /api/admin/surveys/[id]/questions - Update multiple questions (for reordering)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        // Verificar autenticação de admin
        await verifyAdminAccess();
        
        const body: { questions: Array<{ id: string; order_index: number }> } = await request.json();
        const supabase = getServiceSupabase();

        // Para evitar conflitos com a constraint UNIQUE(survey_id, order_index),
        // primeiro definimos order_index temporário com valores negativos,
        // depois atualizamos para os valores finais
        
        // Passo 1: Definir order_index temporários negativos
        const tempUpdates = body.questions.map((q, i) =>
            supabase
                .from('survey_questions')
                .update({ order_index: -(i + 1000) })
                .eq('id', q.id)
                .eq('survey_id', id)
        );
        
        await Promise.all(tempUpdates);

        // Passo 2: Definir os order_index finais
        const finalUpdates = body.questions.map(q =>
            supabase
                .from('survey_questions')
                .update({ order_index: q.order_index })
                .eq('id', q.id)
                .eq('survey_id', id)
        );

        const results = await Promise.all(finalUpdates);
        
        // Verificar se algum update falhou
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
            console.error('Errors updating question order:', errors.map(e => e.error));
            return NextResponse.json({ message: 'Erro ao reordenar perguntas' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Ordem atualizada com sucesso' });
    } catch (error) {
        console.error('Error in PUT /api/admin/surveys/[id]/questions:', error);
        return handleAuthError(error);
    }
}
