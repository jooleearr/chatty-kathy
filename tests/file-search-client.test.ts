/**
 * Tests for File Search API client
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { FileSearchClient } from '../src/lib/ingestion/file-search/client'
import { env } from '../src/lib/utils/env'

describe('FileSearchClient', () => {
  let client: FileSearchClient
  let testCorpusId: string | undefined

  beforeAll(() => {
    // Skip tests if no API key
    if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.log('Skipping FileSearchClient tests - no API key')
      return
    }

    client = new FileSearchClient()
    testCorpusId = env.GOOGLE_CORPUS_ID
  })

  describe('Corpus Operations', () => {
    it('should get corpus details if corpus ID is set', async () => {
      if (!testCorpusId) {
        console.log('Skipping - no GOOGLE_CORPUS_ID set')
        return
      }

      const corpus = await client.getCorpus(testCorpusId)

      expect(corpus).toBeDefined()
      expect(corpus.name).toContain(testCorpusId)
      expect(corpus.displayName).toBeDefined()
      expect(corpus.createTime).toBeDefined()
    })

    it('should list files in corpus with pagination', async () => {
      if (!testCorpusId) {
        console.log('Skipping - no GOOGLE_CORPUS_ID set')
        return
      }

      const result = await client.listFiles(testCorpusId)

      expect(result).toBeDefined()
      expect(result.files).toBeDefined()
      expect(Array.isArray(result.files)).toBe(true)
      // Files may or may not exist yet
      console.log(`Current file count: ${result.files.length}`)
    })

    it('should list all files in corpus (auto-pagination)', async () => {
      if (!testCorpusId) {
        console.log('Skipping - no GOOGLE_CORPUS_ID set')
        return
      }

      const files = await client.listAllFiles(testCorpusId)

      expect(Array.isArray(files)).toBe(true)
      console.log(`Total files (all pages): ${files.length}`)
    })
  })

  describe('File Operations', () => {
    it('should upload and retrieve a test file', async () => {
      if (!testCorpusId) {
        console.log('Skipping - no GOOGLE_CORPUS_ID set')
        return
      }

      const testContent = `# Test Document

This is a test document uploaded at ${new Date().toISOString()}.

## Purpose

This document is used to test the File Search upload functionality.
`

      const fileName = `test-${Date.now()}.md`

      // Upload the file
      const uploadedFile = await client.uploadFile(testCorpusId, testContent, {
        displayName: fileName,
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
        },
      })

      expect(uploadedFile).toBeDefined()
      expect(uploadedFile.name).toBeDefined()
      expect(uploadedFile.state).toBe('PROCESSING')

      // Extract file ID
      const fileId = uploadedFile.name.split('/').pop()
      expect(fileId).toBeDefined()

      // Wait for processing
      const processedFile = await client.waitForFileProcessing(
        testCorpusId,
        fileId!,
        30000 // 30 second timeout
      )

      expect(processedFile.state).toBe('ACTIVE')
      expect(processedFile.displayName).toBe(fileName)

      // Get file details
      const retrievedFile = await client.getFile(testCorpusId, fileId!)

      expect(retrievedFile.name).toBe(processedFile.name)
      expect(retrievedFile.state).toBe('ACTIVE')

      // Clean up - delete the test file
      await client.deleteFile(testCorpusId, fileId!)

      console.log(`✅ Test file ${fileName} uploaded and deleted successfully`)
    }, 60000) // 60 second timeout for this test
  })

  describe('Error Handling', () => {
    it('should throw error for invalid corpus ID', async () => {
      if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
        console.log('Skipping - no API key')
        return
      }

      await expect(client.getCorpus('invalid-corpus-id')).rejects.toThrow()
    })

    it('should throw error for invalid file ID', async () => {
      if (!testCorpusId) {
        console.log('Skipping - no GOOGLE_CORPUS_ID set')
        return
      }

      await expect(
        client.getFile(testCorpusId, 'invalid-file-id')
      ).rejects.toThrow()
    })
  })
})
