/**
 * Test setup file
 * Runs before all tests
 */

import { beforeAll } from 'vitest'

beforeAll(() => {
  // Ensure test environment variables are set
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.warn('⚠️  GOOGLE_GENERATIVE_AI_API_KEY not set - File Search tests will be skipped')
  }

  if (!process.env.GOOGLE_CORPUS_ID) {
    console.warn('⚠️  GOOGLE_CORPUS_ID not set - File Search upload tests will be skipped')
  }
})
