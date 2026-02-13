import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyAdminAccess, handleAuthError } from '@/lib/auth';
import { CreateSurveyData, Survey } from '@/lib/types/survey-types';
import { generateSurveyCode } from '@/lib/utils/survey-utils';

// GET /api/admin/surveys - List all surveys
export async function GET() {
    try {
        // Verificar autenticação de admin
        await verifyAdminAccess();
        
        const supabase = getServiceSupabase();

        const { data, error } = await supabase
            .from('surveys')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching surveys:', error);
            return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in GET /api/admin/surveys:', error);
        return handleAuthError(error);
    }
}

// POST /api/admin/surveys - Create new survey
export async function POST(request: NextRequest) {
    try {
        // Verificar autenticação de admin
        await verifyAdminAccess();
        
        const body: CreateSurveyData = await request.json();

        // Validate required fields
        if (!body.name || !body.start_date) {
            return NextResponse.json(
                { message: 'Nome e data de início são obrigatórios' },
                { status: 400 }
            );
        }

        const supabase = getServiceSupabase();

        // Generate code if not provided
        const code = body.code || generateSurveyCode();

        // Check if code already exists
        const { data: existing } = await supabase
            .from('surveys')
            .select('id')
            .eq('code', code)
            .single();

        if (existing) {
            return NextResponse.json(
                { message: 'Código já existe. Por favor, escolha outro.' },
                { status: 400 }
            );
        }

        // Create survey
        const { data, error } = await supabase
            .from('surveys')
            .insert({
                code,
                name: body.name,
                description: body.description || null,
                start_date: body.start_date,
                end_date: body.end_date || null,
                status: 'draft'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating survey:', error);
            return NextResponse.json({ message: 'Erro ao criar enquete' }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/admin/surveys:', error);
        return handleAuthError(error);
    }
}
