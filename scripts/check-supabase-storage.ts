#!/usr/bin/env tsx
/**
 * Supabase Storage Configuration Checker
 * 
 * This script verifies that the required Supabase Storage buckets
 * are properly configured for the MAF Card System.
 * 
 * Usage: npx tsx scripts/check-supabase-storage.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!')
    console.error('   Please ensure .env.local contains:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const REQUIRED_BUCKETS = [
    {
        name: 'photos',
        description: 'User profile photos for ID cards',
        isPublic: true
    },
    {
        name: 'certificates',
        description: 'User certification documents',
        isPublic: true
    }
]

async function checkBuckets() {
    console.log('🔍 Checking Supabase Storage Configuration...\n')
    let allGood = true

    try {
        // List all buckets
        const { data: buckets, error: listError } = await supabase.storage.listBuckets()

        if (listError) {
            console.error('❌ Error listing buckets:', listError.message)
            console.error('\n💡 Tip: Check your SUPABASE_SERVICE_ROLE_KEY in .env.local\n')
            return false
        }

        console.log(`📦 Found ${buckets?.length || 0} bucket(s) in Supabase Storage\n`)

        // Check each required bucket
        for (const required of REQUIRED_BUCKETS) {
            const bucket = buckets?.find((b: any) => b.name === required.name)

            if (!bucket) {
                console.log(`❌ Missing bucket: "${required.name}"`)
                console.log(`   Description: ${required.description}`)
                console.log(`   Should be public: ${required.isPublic ? 'Yes' : 'No'}`)
                console.log(`   📖 See SETUP_FOTOS.md for setup instructions\n`)
                allGood = false
            } else {
                console.log(`✅ Bucket "${required.name}" exists`)
                console.log(`   Public: ${bucket.public ? 'Yes' : 'No'} ${bucket.public !== required.isPublic ? '⚠️  (Expected: ' + (required.isPublic ? 'Yes' : 'No') + ')' : ''}`)

                // Try to test upload permissions
                const testFileName = `test-${Date.now()}.txt`
                const testContent = new Blob(['test'], { type: 'text/plain' })

                const { error: uploadError } = await supabase.storage
                    .from(required.name)
                    .upload(testFileName, testContent)

                if (uploadError) {
                    console.log(`   ⚠️  Upload test failed: ${uploadError.message}`)
                    console.log(`   💡 Check bucket policies in Supabase Dashboard`)
                    allGood = false
                } else {
                    console.log(`   ✅ Upload permissions working`)

                    // Clean up test file
                    await supabase.storage.from(required.name).remove([testFileName])
                }

                console.log('')
            }
        }

        // Summary
        console.log('━'.repeat(60))
        if (allGood) {
            console.log('✅ All storage buckets are properly configured!')
            console.log('\nYou can now use the registration system.')
        } else {
            console.log('❌ Storage configuration incomplete')
            console.log('\n📖 Next steps:')
            console.log('1. Go to Supabase Dashboard → Storage')
            console.log('2. Create missing buckets as shown above')
            console.log('3. Configure bucket policies (see SETUP_FOTOS.md)')
            console.log('4. Run this script again to verify')
        }
        console.log('━'.repeat(60))

        return allGood

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return false
    }
}

// Run the check
checkBuckets()
    .then(success => {
        process.exit(success ? 0 : 1)
    })
    .catch(error => {
        console.error('Fatal error:', error)
        process.exit(1)
    })
