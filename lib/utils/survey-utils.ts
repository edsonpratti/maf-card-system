// Survey Module Utility Functions

import { Survey, QuestionAnalyticsData, SurveyAnswer, SurveyQuestion, MultipleChoiceSettings, CheckboxSettings, LinearScaleSettings } from '@/lib/types/survey-types';

/**
 * Generate a unique survey code
 * Format: 6 random alphanumeric characters (uppercase)
 */
export function generateSurveyCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Generate a unique anonymous session ID
 * Format: timestamp + random string
 */
export function generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomStr}`;
}

/**
 * Check if a survey is currently active
 */
export function isSurveyActive(survey: Survey): boolean {
    if (survey.status !== 'active') return false;

    const now = new Date();
    const startDate = new Date(survey.start_date);

    if (startDate > now) return false;

    if (survey.end_date) {
        const endDate = new Date(survey.end_date);
        if (endDate < now) return false;
    }

    return true;
}

/**
 * Validate if a survey can be published
 */
export function canPublishSurvey(survey: Survey, questions: SurveyQuestion[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!survey.name || survey.name.trim() === '') {
        errors.push('Survey must have a name');
    }

    if (!survey.start_date) {
        errors.push('Survey must have a start date');
    }

    if (questions.length === 0) {
        errors.push('Survey must have at least one question');
    }

    // Validate each question has proper settings
    questions.forEach((q, index) => {
        if (!q.title || q.title.trim() === '') {
            errors.push(`Question ${index + 1} must have a title`);
        }

        if (q.question_type === 'multiple_choice' || q.question_type === 'checkboxes') {
            const settings = q.settings as MultipleChoiceSettings | CheckboxSettings;
            if (!settings.options || settings.options.length < 2) {
                errors.push(`Question ${index + 1} must have at least 2 options`);
            }
        }

        if (q.question_type === 'linear_scale') {
            const settings = q.settings as LinearScaleSettings;
            if (!settings.min || !settings.max || settings.min >= settings.max) {
                errors.push(`Question ${index + 1} must have valid min and max values`);
            }
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Process analytics data for a multiple choice or checkbox question
 */
export function processChoiceAnalytics(
    answers: SurveyAnswer[],
    options: string[]
): { option: string; count: number; percentage: number }[] {
    const totalAnswers = answers.length;
    const optionCounts = new Map<string, number>();

    // Initialize all options with 0
    options.forEach(option => optionCounts.set(option, 0));

    // Count answers
    answers.forEach(answer => {
        const value = answer.answer_value as any;
        if (value.selected) {
            if (Array.isArray(value.selected)) {
                // Checkboxes
                value.selected.forEach((opt: string) => {
                    optionCounts.set(opt, (optionCounts.get(opt) || 0) + 1);
                });
            } else {
                // Multiple choice
                optionCounts.set(value.selected, (optionCounts.get(value.selected) || 0) + 1);
            }
        }
    });

    // Calculate percentages
    return options.map(option => ({
        option,
        count: optionCounts.get(option) || 0,
        percentage: totalAnswers > 0 ? Math.round((optionCounts.get(option) || 0) / totalAnswers * 100) : 0
    }));
}

/**
 * Process analytics data for a linear scale question
 */
export function processLinearScaleAnalytics(
    answers: SurveyAnswer[],
    min: number,
    max: number
): { average: number; median: number; distribution: { value: number; count: number }[] } {
    const values: number[] = [];
    const distribution = new Map<number, number>();

    // Initialize distribution
    for (let i = min; i <= max; i++) {
        distribution.set(i, 0);
    }

    // Collect values
    answers.forEach(answer => {
        const value = (answer.answer_value as any).value;
        if (typeof value === 'number') {
            values.push(value);
            distribution.set(value, (distribution.get(value) || 0) + 1);
        }
    });

    // Calculate average
    const average = values.length > 0
        ? Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 100) / 100
        : 0;

    // Calculate median
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length > 0
        ? sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)]
        : 0;

    return {
        average,
        median,
        distribution: Array.from(distribution.entries()).map(([value, count]) => ({ value, count }))
    };
}

/**
 * Format duration in a human-readable way
 */
export function formatDuration(seconds: number): string {
    if (seconds < 60) {
        return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${minutes}m ${secs}s`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
}

/**
 * Convert survey responses to CSV format
 */
export function convertToCSV(
    questions: SurveyQuestion[],
    responses: Array<{ response_id: string; completed_at: string; answers: SurveyAnswer[] }>
): string {
    // Header row
    const headers = ['Response ID', 'Completed At', ...questions.map(q => q.title)];
    const rows: string[][] = [headers];

    // Data rows
    responses.forEach(response => {
        const row: string[] = [
            response.response_id,
            response.completed_at
        ];

        questions.forEach(question => {
            const answer = response.answers.find(a => a.question_id === question.id);
            if (answer) {
                const value = answer.answer_value as any;
                if (value.text) {
                    row.push(`"${value.text.replace(/"/g, '""')}"`);
                } else if (value.selected) {
                    if (Array.isArray(value.selected)) {
                        row.push(`"${value.selected.join(', ')}"`);
                    } else {
                        row.push(value.selected);
                    }
                } else if (typeof value.value === 'number') {
                    row.push(value.value.toString());
                } else {
                    row.push('');
                }
            } else {
                row.push('');
            }
        });

        rows.push(row);
    });

    return rows.map(row => row.join(',')).join('\n');
}

/**
 * Validate answer value based on question type
 */
export function validateAnswer(question: SurveyQuestion, answerValue: any): boolean {
    if (question.is_required && !answerValue) {
        return false;
    }

    if (!answerValue) {
        return true; // Optional question, no answer is fine
    }

    switch (question.question_type) {
        case 'short_text':
        case 'long_text':
            return typeof answerValue.text === 'string' && answerValue.text.trim() !== '';

        case 'multiple_choice':
            const mcSettings = question.settings as MultipleChoiceSettings;
            return typeof answerValue.selected === 'string' &&
                mcSettings.options.includes(answerValue.selected);

        case 'checkboxes':
            const cbSettings = question.settings as CheckboxSettings;
            return Array.isArray(answerValue.selected) &&
                answerValue.selected.length > 0 &&
                answerValue.selected.every((opt: string) => cbSettings.options.includes(opt));

        case 'linear_scale':
            const lsSettings = question.settings as LinearScaleSettings;
            return typeof answerValue.value === 'number' &&
                answerValue.value >= lsSettings.min &&
                answerValue.value <= lsSettings.max;

        default:
            return false;
    }
}
