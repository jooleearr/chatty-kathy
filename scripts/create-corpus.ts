#!/usr/bin/env tsx

/**
 * One-time script to create a Google File Search corpus
 *
 * Usage:
 *   npm run create-corpus
 *
 * This will:
 * 1. Create a new File Search corpus
 * 2. Output the corpus ID
 * 3. Save it to your .env.local file (you can copy it manually)
 */

import { config } from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') })

import { FileSearchClient } from '../src/lib/ingestion/file-search/client'
import { logger } from '../src/lib/utils/logger'
import * as fs from 'fs'

async function main() {
  console.log('\n🚀 Creating Google File Search Corpus...\n')

  // Check for API key
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    console.error('❌ Error: GOOGLE_GENERATIVE_AI_API_KEY not found in environment')
    console.error('\nPlease set your Google AI API key in .env.local:')
    console.error('GOOGLE_GENERATIVE_AI_API_KEY=your_key_here')
    console.error('\nGet your API key from: https://aistudio.google.com/app/apikey')
    process.exit(1)
  }

  try {
    const client = new FileSearchClient(apiKey)

    const displayName = `chatty-kathy-${Date.now()}`
    console.log(`Creating corpus: ${displayName}`)

    const corpus = await client.createCorpus(displayName)

    // Extract corpus ID from the resource name
    const corpusId = corpus.name.split('/').pop()

    console.log('\n✅ Corpus created successfully!')
    console.log('\n📋 Corpus Details:')
    console.log(`   Name: ${corpus.displayName}`)
    console.log(`   ID: ${corpusId}`)
    console.log(`   Resource Name: ${corpus.name}`)
    console.log(`   Created: ${corpus.createTime}`)

    console.log('\n📝 Next Steps:')
    console.log('\n1. Add this to your .env.local file:')
    console.log(`\n   GOOGLE_CORPUS_ID=${corpusId}\n`)

    // Optionally update .env.local automatically
    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8')

      if (envContent.includes('GOOGLE_CORPUS_ID=your_corpus_id_here')) {
        // Replace the placeholder
        const newContent = envContent.replace(
          'GOOGLE_CORPUS_ID=your_corpus_id_here',
          `GOOGLE_CORPUS_ID=${corpusId}`
        )
        fs.writeFileSync(envPath, newContent, 'utf-8')
        console.log('   ✅ Updated .env.local automatically!\n')
      } else if (!envContent.includes('GOOGLE_CORPUS_ID=')) {
        // Append to file
        fs.appendFileSync(envPath, `\nGOOGLE_CORPUS_ID=${corpusId}\n`, 'utf-8')
        console.log('   ✅ Added to .env.local automatically!\n')
      } else {
        console.log('   ℹ️  GOOGLE_CORPUS_ID already exists in .env.local - please update manually if needed\n')
      }
    }

    console.log('2. Test the corpus by uploading a sample file:')
    console.log('   npm run test-upload\n')

  } catch (error) {
    console.error('\n❌ Failed to create corpus')

    if (error instanceof Error) {
      console.error(`\nError: ${error.message}`)

      if (error.message.includes('API key')) {
        console.error('\nTip: Make sure your Google AI API key is valid')
        console.error('Get a new one from: https://aistudio.google.com/app/apikey')
      }

      if (error.message.includes('403')) {
        console.error('\nTip: The File Search API might not be enabled for your project')
        console.error('Check the Google AI Studio documentation for access')
      }
    } else {
      console.error(error)
    }

    process.exit(1)
  }
}

main()
