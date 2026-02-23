/**
 * Environment variables validation
 * This file validates required environment variables at build/runtime
 */

export function validateEnv() {
    const requiredEnvVars = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    }

    const missing: string[] = []

    for (const [key, value] of Object.entries(requiredEnvVars)) {
        if (!value) {
            missing.push(key)
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${missing.join('\n')}\n\n` +
            'Please check your .env.local file.'
        )
    }

    return true
}

// Validate on module load in development
if (process.env.NODE_ENV === 'development') {
    validateEnv()
}
