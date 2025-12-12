/**
 * File Search uploader
 * Handles batch uploading of documents to File Search corpus
 */

import { fileSearchClient, FileSearchClient } from './client'
import { logger } from '@/lib/utils/logger'
import { env } from '@/lib/utils/env'
import type { Document } from '@/lib/types/data-sources'

export interface UploadResult {
  success: boolean
  fileName: string
  fileId?: string
  error?: string
}

export interface BatchUploadResult {
  totalDocuments: number
  successCount: number
  failureCount: number
  results: UploadResult[]
  duration: number
}

export class FileSearchUploader {
  private client: FileSearchClient
  private corpusId: string

  constructor(corpusId?: string, client?: FileSearchClient) {
    this.corpusId = corpusId || env.GOOGLE_CORPUS_ID || ''
    this.client = client || fileSearchClient

    if (!this.corpusId) {
      logger.warn('GOOGLE_CORPUS_ID not set - uploads will fail')
    }
  }

  /**
   * Upload a single document to the corpus
   */
  async uploadDocument(document: Document): Promise<UploadResult> {
    const fileName = document.fileName || this.generateFileName(document)

    try {
      logger.debug('Uploading document', {
        fileName,
        source: document.metadata.source,
        type: document.metadata.type
      })

      const file = await this.client.uploadFile(
        this.corpusId,
        document.content,
        {
          displayName: fileName,
          metadata: document.metadata,
        }
      )

      // Wait for the file to finish processing
      const fileId = this.extractFileId(file.name)
      await this.client.waitForFileProcessing(this.corpusId, fileId)

      return {
        success: true,
        fileName,
        fileId,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Failed to upload document', error, { fileName })

      return {
        success: false,
        fileName,
        error: errorMessage,
      }
    }
  }

  /**
   * Upload multiple documents in batch
   */
  async uploadDocuments(documents: Document[]): Promise<BatchUploadResult> {
    const startTime = Date.now()

    logger.info('Starting batch upload', {
      corpusId: this.corpusId,
      documentCount: documents.length
    })

    const results: UploadResult[] = []

    // Upload documents sequentially to avoid overwhelming the API
    // TODO: Consider implementing concurrent uploads with rate limiting
    for (const document of documents) {
      const result = await this.uploadDocument(document)
      results.push(result)

      // Add a small delay between uploads to respect rate limits
      await this.delay(500)
    }

    const duration = Date.now() - startTime
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    logger.info('Batch upload completed', {
      corpusId: this.corpusId,
      totalDocuments: documents.length,
      successCount,
      failureCount,
      duration: `${duration}ms`
    })

    return {
      totalDocuments: documents.length,
      successCount,
      failureCount,
      results,
      duration,
    }
  }

  /**
   * Upload documents with progress callback
   */
  async uploadDocumentsWithProgress(
    documents: Document[],
    onProgress?: (current: number, total: number, result: UploadResult) => void
  ): Promise<BatchUploadResult> {
    const startTime = Date.now()

    logger.info('Starting batch upload with progress tracking', {
      corpusId: this.corpusId,
      documentCount: documents.length
    })

    const results: UploadResult[] = []

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i]
      const result = await this.uploadDocument(document)
      results.push(result)

      if (onProgress) {
        onProgress(i + 1, documents.length, result)
      }

      await this.delay(500)
    }

    const duration = Date.now() - startTime
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return {
      totalDocuments: documents.length,
      successCount,
      failureCount,
      results,
      duration,
    }
  }

  /**
   * Delete all files from the corpus
   * WARNING: This is destructive and cannot be undone
   */
  async clearCorpus(): Promise<number> {
    logger.warn('Clearing all files from corpus', { corpusId: this.corpusId })

    const files = await this.client.listFiles(this.corpusId)
    let deletedCount = 0

    for (const file of files) {
      try {
        const fileId = this.extractFileId(file.name)
        await this.client.deleteFile(this.corpusId, fileId)
        deletedCount++
        await this.delay(500) // Rate limiting
      } catch (error) {
        logger.error('Failed to delete file', error, { fileName: file.name })
      }
    }

    logger.info('Corpus cleared', {
      corpusId: this.corpusId,
      deletedCount,
      totalFiles: files.length
    })

    return deletedCount
  }

  /**
   * Generate a filename from document metadata
   */
  private generateFileName(document: Document): string {
    const { source, type, id } = document.metadata
    const timestamp = Date.now()
    return `${source}-${type}-${id}-${timestamp}.md`
  }

  /**
   * Extract file ID from resource name
   */
  private extractFileId(resourceName: string): string {
    return resourceName.split('/').pop() || resourceName
  }

  /**
   * Utility: delay for a specified time
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export a singleton instance
export const fileSearchUploader = new FileSearchUploader()
