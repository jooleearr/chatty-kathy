/**
 * Tests for File Search uploader
 *
 * Note: These tests use the new FileSearchStores API which has limited
 * file management capabilities (no listing or deletion of individual files).
 * Tests focus on upload functionality which is fully supported.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { FileSearchUploader } from '../src/lib/ingestion/file-search/uploader'
import { env } from '../src/lib/utils/env'
import type { Document } from '../src/lib/types/data-sources'

describe('FileSearchUploader', () => {
  let uploader: FileSearchUploader
  let testCorpusId: string | undefined

  beforeAll(() => {
    if (!env.GOOGLE_GENERATIVE_AI_API_KEY || !env.GOOGLE_CORPUS_ID) {
      console.log('Skipping FileSearchUploader tests - missing credentials')
      return
    }

    testCorpusId = env.GOOGLE_CORPUS_ID
    uploader = new FileSearchUploader(testCorpusId)
  })

  describe('Single Document Upload', () => {
    it('should upload a single document successfully', async () => {
      if (!testCorpusId) {
        console.log('Skipping - no GOOGLE_CORPUS_ID set')
        return
      }

      const testDoc: Document = {
        content: `# GitHub Issue #${Date.now()}

**Repository**: chatty-kathy/test
**Author**: @tester
**Created**: ${new Date().toISOString()}

## Description

This is a test issue for validating the upload functionality.
`,
        metadata: {
          source: 'github',
          type: 'issue',
          id: `test-${Date.now()}`,
          url: `https://github.com/test/test/issues/${Date.now()}`,
          title: 'Test Issue',
          author: 'tester',
          createdAt: new Date().toISOString(),
        },
      }

      const result = await uploader.uploadDocument(testDoc)

      expect(result.success).toBe(true)
      expect(result.fileName).toBeDefined()
      expect(result.fileId).toBeDefined()
      expect(result.error).toBeUndefined()

      console.log(`✅ Uploaded: ${result.fileName}`)
      console.log(`   Note: File cleanup not available in FileSearchStores API`)
    }, 60000)
  })

  describe('Batch Upload', () => {
    it('should upload multiple documents successfully', async () => {
      if (!testCorpusId) {
        console.log('Skipping - no GOOGLE_CORPUS_ID set')
        return
      }

      const documents: Document[] = [
        {
          content: '# Document 1\n\nThis is test document 1.',
          metadata: {
            source: 'github',
            type: 'issue',
            id: 'batch-test-1',
            url: 'https://example.com/1',
          },
        },
        {
          content: '# Document 2\n\nThis is test document 2.',
          metadata: {
            source: 'github',
            type: 'pr',
            id: 'batch-test-2',
            url: 'https://example.com/2',
          },
        },
      ]

      const result = await uploader.uploadDocuments(documents)

      expect(result.totalDocuments).toBe(2)
      expect(result.successCount).toBe(2)
      expect(result.failureCount).toBe(0)
      expect(result.results).toHaveLength(2)
      expect(result.duration).toBeGreaterThan(0)

      console.log(
        `✅ Batch upload: ${result.successCount}/${result.totalDocuments} successful in ${result.duration}ms`
      )
      console.log(`   Note: Files remain in corpus (cleanup not available in new API)`)
    }, 120000) // 2 minute timeout for batch
  })

  describe('Upload with Progress', () => {
    it('should track upload progress', async () => {
      if (!testCorpusId) {
        console.log('Skipping - no GOOGLE_CORPUS_ID set')
        return
      }

      const documents: Document[] = [
        {
          content: '# Progress Test 1',
          metadata: {
            source: 'github',
            type: 'issue',
            id: 'progress-1',
            url: 'https://example.com/progress-1',
          },
        },
        {
          content: '# Progress Test 2',
          metadata: {
            source: 'github',
            type: 'issue',
            id: 'progress-2',
            url: 'https://example.com/progress-2',
          },
        },
      ]

      const progressUpdates: number[] = []

      const result = await uploader.uploadDocumentsWithProgress(
        documents,
        (current, total, uploadResult) => {
          progressUpdates.push(current)
          console.log(
            `Progress: ${current}/${total} - ${uploadResult.fileName} ${uploadResult.success ? '✅' : '❌'}`
          )
        }
      )

      expect(progressUpdates).toHaveLength(2)
      expect(progressUpdates[0]).toBe(1)
      expect(progressUpdates[1]).toBe(2)
      expect(result.successCount).toBe(2)
    }, 120000)
  })

  describe('Filename Generation', () => {
    it('should generate valid filenames from metadata', async () => {
      if (!testCorpusId) {
        console.log('Skipping - no GOOGLE_CORPUS_ID set')
        return
      }

      const doc: Document = {
        content: '# Test',
        metadata: {
          source: 'github',
          type: 'issue',
          id: 'test-123',
          url: 'https://example.com',
        },
        // No fileName specified - should auto-generate
      }

      const result = await uploader.uploadDocument(doc)

      expect(result.success).toBe(true)
      expect(result.fileName).toMatch(/github-issue-test-123-\d+\.md/)

      console.log(`✅ Generated filename: ${result.fileName}`)
    }, 60000)
  })
})
