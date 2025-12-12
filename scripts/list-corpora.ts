#!/usr/bin/env tsx

/**
 * List all Google File Search corpora in your account
 *
 * Usage:
 *   npm run list-corpora
 */

import { config } from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') })

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

interface Corpus {
  name: string
  displayName: string
  createTime: string
  updateTime: string
}

async function main() {
  console.log('\n📚 Listing Google File Search Corpora...\n')

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    console.error('❌ Error: GOOGLE_GENERATIVE_AI_API_KEY not found in environment')
    process.exit(1)
  }

  try {
    const response = await fetch(`${BASE_URL}/corpora`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to list corpora: ${error}`)
    }

    const data = (await response.json()) as { corpora?: Corpus[] }
    const corpora = data.corpora || []

    if (corpora.length === 0) {
      console.log('No corpora found in your account.')
      console.log('\nRun: npm run create-corpus')
      return
    }

    console.log(`Found ${corpora.length} corpus/corpora:\n`)

    corpora.forEach((corpus, index) => {
      const corpusId = corpus.name.split('/').pop()
      console.log(`${index + 1}. ${corpus.displayName}`)
      console.log(`   ID: ${corpusId}`)
      console.log(`   Resource Name: ${corpus.name}`)
      console.log(`   Created: ${corpus.createTime}`)
      console.log(`   Updated: ${corpus.updateTime}`)
      console.log('')
    })

    console.log('💡 To use one of these corpora:')
    console.log('   1. Copy the ID of the corpus you want to use')
    console.log('   2. Add it to your .env.local file:')
    console.log('      GOOGLE_CORPUS_ID=<corpus_id>\n')

    // Suggest the most recently updated one
    const mostRecent = corpora.sort(
      (a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()
    )[0]
    const recentId = mostRecent.name.split('/').pop()

    console.log(`📌 Most recently updated: ${mostRecent.displayName}`)
    console.log(`   Suggested ID: ${recentId}\n`)
  } catch (error) {
    console.error('\n❌ Failed to list corpora')

    if (error instanceof Error) {
      console.error(`\nError: ${error.message}`)
    } else {
      console.error(error)
    }

    process.exit(1)
  }
}

main()
