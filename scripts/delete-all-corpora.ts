#!/usr/bin/env tsx

/**
 * Delete all Google File Search corpora in your account
 *
 * Usage:
 *   npm run delete-all-corpora
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
  console.log('\n🗑️  Deleting all Google File Search Corpora...\n')

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    console.error('❌ Error: GOOGLE_GENERATIVE_AI_API_KEY not found in environment')
    process.exit(1)
  }

  try {
    // First, list all corpora
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
      console.log('✅ No corpora found in your account. Nothing to delete.')
      return
    }

    console.log(`Found ${corpora.length} corpus/corpora to delete:\n`)

    corpora.forEach((corpus, index) => {
      const corpusId = corpus.name.split('/').pop()
      console.log(`${index + 1}. ${corpus.displayName} (${corpusId})`)
    })

    console.log('\n⏳ Deleting corpora (including all files)...\n')

    // Delete each corpus
    let successCount = 0
    let errorCount = 0

    for (const corpus of corpora) {
      const corpusId = corpus.name.split('/').pop() || corpus.name

      try {
        // First, list and delete all files in the corpus
        const filesResponse = await fetch(`${BASE_URL}/corpora/${corpusId}/files`, {
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': apiKey,
          },
        })

        if (!filesResponse.ok) {
          console.log(`   ⚠️  Could not list files for ${corpus.displayName}: ${filesResponse.status}`)
        } else {
          const filesData = (await filesResponse.json()) as { files?: Array<{ name: string }> }
          const files = filesData.files || []

          if (files.length > 0) {
            console.log(`   📄 Deleting ${files.length} file(s) from ${corpus.displayName}...`)

            for (const file of files) {
              const fileId = file.name.split('/').pop() || file.name
              const deleteFileResponse = await fetch(
                `${BASE_URL}/corpora/${corpusId}/files/${fileId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'X-Goog-Api-Key': apiKey,
                  },
                }
              )

              if (!deleteFileResponse.ok) {
                const fileError = await deleteFileResponse.text()
                console.error(`      ⚠️  Failed to delete file ${fileId}: ${fileError}`)
              } else {
                console.log(`      ✓ Deleted file ${fileId}`)
              }
            }

            // Wait a moment for deletions to propagate
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        // Now delete the empty corpus
        const deleteResponse = await fetch(`${BASE_URL}/corpora/${corpusId}`, {
          method: 'DELETE',
          headers: {
            'X-Goog-Api-Key': apiKey,
          },
        })

        if (!deleteResponse.ok) {
          const error = await deleteResponse.text()
          console.error(`   ❌ Failed to delete ${corpus.displayName} (${corpusId}): ${error}`)
          errorCount++
        } else {
          console.log(`   ✅ Deleted: ${corpus.displayName} (${corpusId})`)
          successCount++
        }
      } catch (error) {
        console.error(`   ❌ Error deleting ${corpus.displayName} (${corpusId}):`, error)
        errorCount++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Successfully deleted: ${successCount}`)
    if (errorCount > 0) {
      console.log(`   ❌ Failed to delete: ${errorCount}`)
    }
    console.log('')

  } catch (error) {
    console.error('\n❌ Failed to delete corpora')

    if (error instanceof Error) {
      console.error(`\nError: ${error.message}`)
    } else {
      console.error(error)
    }

    process.exit(1)
  }
}

main()
