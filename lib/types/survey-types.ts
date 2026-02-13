// Survey Module Type Definitions

export type SurveyStatus = 'draft' | 'active' | 'closed';

export type QuestionType =
    | 'name'
    | 'short_text'
    | 'long_text'
    | 'multiple_choice'
    | 'checkboxes'
    | 'linear_scale'
    | 'email'
    | 'phone';

// Survey interface
export interface Survey {
    id: string;
    code: string;
    name: string;
    description?: string;
    start_date: string;
    end_date?: string;
    status: SurveyStatus;
    created_by?: string;
    created_at: string;
    updated_at: string;
    // Completion page settings
    completion_title?: string;
    completion_subtitle?: string;
    completion_show_button?: boolean;
    completion_button_text?: string;
    completion_button_url?: string;
}

// Question settings based on type
export interface MultipleChoiceSettings {
    options: string[];
}

export interface CheckboxSettings {
    options: string[];
}

export interface LinearScaleSettings {
    min: number;
    max: number;
    minLabel?: string;
    maxLabel?: string;
}

export interface TextSettings {
    placeholder?: string;
    maxLength?: number;
}

export type QuestionSettings =
    | MultipleChoiceSettings
    | CheckboxSettings
    | LinearScaleSettings
    | TextSettings
    | Record<string, never>;

// Survey Question interface
export interface SurveyQuestion {
    id: string;
    survey_id: string;
    order_index: number;
    title: string;
    subtitle?: string;
    question_type: QuestionType;
    is_required: boolean;
    settings: QuestionSettings;
    created_at: string;
    updated_at: string;
}

// Answer value types
export interface TextAnswerValue {
    text: string;
}

export interface MultipleChoiceAnswerValue {
    selected: string;
}

export interface CheckboxAnswerValue {
    selected: string[];
}

export interface LinearScaleAnswerValue {
    value: number;
}

export type AnswerValue =
    | TextAnswerValue
    | MultipleChoiceAnswerValue
    | CheckboxAnswerValue
    | LinearScaleAnswerValue;

// Survey Response interface
export interface SurveyResponse {
    id: string;
    survey_id: string;
    session_id: string;
    ip_address?: string;
    user_agent?: string;
    started_at: string;
    completed_at?: string;
    created_at: string;
}

// Survey Answer interface
export interface SurveyAnswer {
    id: string;
    response_id: string;
    question_id: string;
    answer_value: AnswerValue;
    created_at: string;
}

// Complete response with answers
export interface CompleteResponse extends SurveyResponse {
    answers: SurveyAnswer[];
}

// Survey with questions
export interface SurveyWithQuestions extends Survey {
    questions: SurveyQuestion[];
}

// Analytics data types
export interface SurveyAnalyticsSummary {
    total_responses: number;
    completed_responses: number;
    completion_rate: number;
    avg_completion_time?: string; // ISO duration or formatted string
}

export interface QuestionAnalytics {
    question_id: string;
    question_title: string;
    question_type: QuestionType;
    total_answers: number;
    data: QuestionAnalyticsData;
}

export type QuestionAnalyticsData =
    | MultipleChoiceAnalytics
    | CheckboxAnalytics
    | LinearScaleAnalytics
    | TextAnalytics;

export interface MultipleChoiceAnalytics {
    type: 'multiple_choice';
    options: {
        option: string;
        count: number;
        percentage: number;
    }[];
}

export interface CheckboxAnalytics {
    type: 'checkboxes';
    options: {
        option: string;
        count: number;
        percentage: number;
    }[];
}

export interface LinearScaleAnalytics {
    type: 'linear_scale';
    average: number;
    median: number;
    distribution: {
        value: number;
        count: number;
    }[];
}

export interface TextAnalytics {
    type: 'text';
    responses: {
        id: string;
        text: string;
        created_at: string;
    }[];
}

// Form data types for creating/editing
export interface CreateSurveyData {
    name: string;
    description?: string;
    start_date: string;
    end_date?: string;
    code?: string; // Optional, will be auto-generated if not provided
}

export interface UpdateSurveyData extends Partial<CreateSurveyData> {
    status?: SurveyStatus;
    completion_title?: string;
    completion_subtitle?: string;
    completion_show_button?: boolean;
    completion_button_text?: string;
    completion_button_url?: string;
}

export interface CreateQuestionData {
    title: string;
    subtitle?: string;
    question_type: QuestionType;
    is_required: boolean;
    settings: QuestionSettings;
}

export interface UpdateQuestionData extends Partial<CreateQuestionData> {
    order_index?: number;
}

// Public survey submission
export interface SurveySubmission {
    session_id: string;
    answers: {
        question_id: string;
        answer_value: AnswerValue;
    }[];
}
