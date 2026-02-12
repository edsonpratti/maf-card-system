import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { UpdateSurveyData } from '@/lib/types/survey-types';

// GET /api/admin/surveys/[id] - Get survey by ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getServiceSupabase();

        const { data, error } = await supabase
            .from('surveys')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in GET /api/admin/surveys/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/admin/surveys/[id] - Update survey
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body: UpdateSurveyData = await request.json();
        const supabase = getServiceSupabase();

        const { data, error } = await supabase
            .from('surveys')
            .update(body)
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating survey:', error);
            return NextResponse.json({ message: 'Erro ao atualizar enquete' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in PUT /api/admin/surveys/[id]:', error);
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}

// DELETE /api/admin/surveys/[id] - Delete survey
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getServiceSupabase();

        const { error } = await supabase
            .from('surveys')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('Error deleting survey:', error);
            return NextResponse.json({ message: 'Erro ao excluir enquete' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Enquete excluída com sucesso' });
    } catch (error) {
        console.error('Error in DELETE /api/admin/surveys/[id]:', error);
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}
