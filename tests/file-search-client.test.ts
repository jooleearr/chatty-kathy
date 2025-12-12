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

  describe('Store Operations', () => {
    it('should get store details if corpus ID is set', async () => {
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

    it('should list all stores', async () => {
      const result = await client.listCorpora({ pageSize: 10 })

      expect(result).toBeDefined()
      expect(result.corpora).toBeDefined()
      expect(Array.isArray(result.corpora)).toBe(true)
      console.log(`Found ${result.corpora.length} stores`)
    })

    it('should list all stores with auto-pagination', async () => {
      const stores = await client.listAllCorpora()

      expect(Array.isArray(stores)).toBe(true)
      expect(stores.length).toBeGreaterThan(0)
      console.log(`Total stores (all pages): ${stores.length}`)
    })
  })

  describe('File Listing (Unsupported in New API)', () => {
    it('should return empty array when listing files (not supported)', async () => {
      if (!testCorpusId) {
        console.log('Skipping - no GOOGLE_CORPUS_ID set')
        return
      }

      const result = await client.listFiles(testCorpusId)

      expect(result).toBeDefined()
      expect(result.files).toBeDefined()
      expect(Array.isArray(result.files)).toBe(true)
      expect(result.files).toHaveLength(0)
      console.log('✓ File listing returns empty (as expected with new API)')
    })

    it('should return empty array when listing all files (not supported)', async () => {
      if (!testCorpusId) {
        console.log('Skipping - no GOOGLE_CORPUS_ID set')
        return
      }

      const files = await client.listAllFiles(testCorpusId)

      expect(Array.isArray(files)).toBe(true)
      expect(files).toHaveLength(0)
      console.log('✓ File listing returns empty (as expected with new API)')
    })
  })

  describe('File Operations', () => {
    it('should upload a test file successfully', async () => {
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
      })

      expect(uploadedFile).toBeDefined()
      expect(uploadedFile.name).toBeDefined()
      expect(uploadedFile.displayName).toBe(fileName)
      expect(uploadedFile.state).toBe('PROCESSING')

      // Extract file ID
      const fileId = uploadedFile.name.split('/').pop()
      expect(fileId).toBeDefined()

      console.log(`✅ Test file ${fileName} uploaded successfully`)
      console.log(`   Note: File cleanup not supported in FileSearchStores API`)
    }, 60000) // 60 second timeout for this test

    it('should handle file processing wait (mock in new API)', async () => {
      if (!testCorpusId) {
        console.log('Skipping - no GOOGLE_CORPUS_ID set')
        return
      }

      // In the new API, this just returns a mock ACTIVE file immediately
      const processedFile = await client.waitForFileProcessing(
        testCorpusId,
        'any-file-id',
        5000
      )

      expect(processedFile.state).toBe('ACTIVE')
      console.log('✓ waitForFileProcessing returns ACTIVE (mock in new API)')
    })
  })

  describe('Error Handling', () => {
    it('should throw error for invalid corpus ID', async () => {
      if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
        console.log('Skipping - no API key')
        return
      }

      await expect(client.getCorpus('invalid-corpus-id')).rejects.toThrow()
    })

    it('should throw error for unsupported individual file operations', async () => {
      if (!testCorpusId) {
        console.log('Skipping - no GOOGLE_CORPUS_ID set')
        return
      }

      // getFile is not supported in FileSearchStores API
      await expect(
        client.getFile(testCorpusId, 'any-file-id')
      ).rejects.toThrow('Individual file operations not supported')

      // deleteFile is not supported in FileSearchStores API
      await expect(
        client.deleteFile(testCorpusId, 'any-file-id')
      ).rejects.toThrow('Individual file operations not supported')
    })
  })
})
