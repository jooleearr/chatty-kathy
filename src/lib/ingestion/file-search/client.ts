/**
 * Google File Search API client
 * Handles corpus management and file uploads
 */

import { env } from '@/lib/utils/env'
import { logger } from '@/lib/utils/logger'
import type { FileSearchCorpus, FileSearchFile, FileSearchUploadOptions } from '@/lib/types/data-sources'

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

export class FileSearchClient {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.GOOGLE_GENERATIVE_AI_API_KEY
  }

  /**
   * List all corpora
   */
  async listCorpora(options: { pageToken?: string; pageSize?: number } = {}): Promise<{
    corpora: FileSearchCorpus[]
    nextPageToken?: string
  }> {
    logger.debug('Listing corpora', options)

    const params = new URLSearchParams()
    if (options.pageToken) {
      params.append('pageToken', options.pageToken)
    }
    if (options.pageSize) {
      params.append('pageSize', options.pageSize.toString())
    }

    const url = `${BASE_URL}/corpora${params.toString() ? `?${params.toString()}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': this.apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Failed to list corpora', new Error(error))
      throw new Error(`Failed to list corpora: ${error}`)
    }

    const data = await response.json() as {
      corpora?: FileSearchCorpus[]
      nextPageToken?: string
    }

    return {
      corpora: data.corpora || [],
      nextPageToken: data.nextPageToken,
    }
  }

  /**
   * List all corpora (automatically handles pagination)
   */
  async listAllCorpora(): Promise<FileSearchCorpus[]> {
    logger.debug('Listing all corpora')

    const allCorpora: FileSearchCorpus[] = []
    let pageToken: string | undefined

    do {
      const { corpora, nextPageToken } = await this.listCorpora({ pageToken })
      allCorpora.push(...corpora)
      pageToken = nextPageToken
    } while (pageToken)

    logger.debug('All corpora listed', { totalCount: allCorpora.length })
    return allCorpora
  }

  /**
   * Create a new File Search corpus
   */
  async createCorpus(displayName: string): Promise<FileSearchCorpus> {
    logger.info('Creating File Search corpus', { displayName })

    const response = await fetch(`${BASE_URL}/corpora`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
      },
      body: JSON.stringify({
        displayName,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Failed to create corpus', new Error(error))
      throw new Error(`Failed to create corpus: ${error}`)
    }

    const corpus = await response.json() as FileSearchCorpus
    logger.info('Corpus created successfully', {
      corpusName: corpus.name,
      corpusId: this.extractCorpusId(corpus.name)
    })

    return corpus
  }

  /**
   * Delete a corpus
   */
  async deleteCorpus(corpusId: string): Promise<void> {
    logger.info('Deleting corpus', { corpusId })

    const response = await fetch(`${BASE_URL}/corpora/${corpusId}`, {
      method: 'DELETE',
      headers: {
        'X-Goog-Api-Key': this.apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Failed to delete corpus', new Error(error), { corpusId })
      throw new Error(`Failed to delete corpus: ${error}`)
    }

    logger.info('Corpus deleted successfully', { corpusId })
  }

  /**
   * Get corpus details
   */
  async getCorpus(corpusId: string): Promise<FileSearchCorpus> {
    logger.debug('Getting corpus details', { corpusId })

    const response = await fetch(`${BASE_URL}/corpora/${corpusId}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': this.apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Failed to get corpus', new Error(error), { corpusId })
      throw new Error(`Failed to get corpus: ${error}`)
    }

    return await response.json() as FileSearchCorpus
  }

  /**
   * List files in a corpus with pagination support
   */
  async listFiles(
    corpusId: string,
    options: { pageToken?: string; pageSize?: number } = {}
  ): Promise<{ files: FileSearchFile[]; nextPageToken?: string }> {
    logger.debug('Listing files in corpus', { corpusId, ...options })

    // Build query parameters
    const params = new URLSearchParams()
    if (options.pageToken) {
      params.append('pageToken', options.pageToken)
    }
    if (options.pageSize) {
      params.append('pageSize', options.pageSize.toString())
    }

    const url = `${BASE_URL}/corpora/${corpusId}/files${params.toString() ? `?${params.toString()}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': this.apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Failed to list files', new Error(error), {
        corpusId,
        status: response.status,
        statusText: response.statusText
      })
      throw new Error(`Failed to list files (${response.status}): ${error}`)
    }

    const data = await response.json() as {
      files?: FileSearchFile[]
      nextPageToken?: string
    }
    const files = data.files || []

    logger.debug('Files listed', {
      corpusId,
      count: files.length,
      hasMore: !!data.nextPageToken
    })

    return {
      files,
      nextPageToken: data.nextPageToken,
    }
  }

  /**
   * List all files in a corpus (automatically handles pagination)
   */
  async listAllFiles(corpusId: string): Promise<FileSearchFile[]> {
    logger.debug('Listing all files in corpus', { corpusId })

    const allFiles: FileSearchFile[] = []
    let pageToken: string | undefined

    do {
      const { files, nextPageToken } = await this.listFiles(corpusId, { pageToken })
      allFiles.push(...files)
      pageToken = nextPageToken
    } while (pageToken)

    logger.debug('All files listed', { corpusId, totalCount: allFiles.length })
    return allFiles
  }

  /**
   * Upload a file to the corpus
   */
  async uploadFile(
    corpusId: string,
    content: string | Buffer,
    options: FileSearchUploadOptions = {}
  ): Promise<FileSearchFile> {
    const displayName = options.displayName || `document-${Date.now()}.txt`

    logger.info('Uploading file to corpus', {
      corpusId,
      displayName,
      contentSize: content.length
    })

    // Convert content to Buffer if it's a string
    const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content

    // Create form data
    const formData = new FormData()
    const blob = new Blob([buffer], { type: 'text/plain' })
    formData.append('file', blob, displayName)

    // Add metadata if provided
    if (options.metadata) {
      const metadataBlob = new Blob([JSON.stringify({ metadata: options.metadata })], {
        type: 'application/json',
      })
      formData.append('metadata', metadataBlob)
    }

    const response = await fetch(`${BASE_URL}/corpora/${corpusId}/files`, {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': this.apiKey,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Failed to upload file', new Error(error), {
        corpusId,
        displayName,
        status: response.status,
        statusText: response.statusText
      })
      throw new Error(`Failed to upload file (${response.status}): ${error}`)
    }

    const file = await response.json() as FileSearchFile

    logger.info('File uploaded successfully', {
      corpusId,
      fileName: file.name,
      fileId: this.extractFileId(file.name),
      state: file.state
    })

    return file
  }

  /**
   * Delete a file from the corpus
   */
  async deleteFile(corpusId: string, fileId: string): Promise<void> {
    logger.info('Deleting file from corpus', { corpusId, fileId })

    const response = await fetch(`${BASE_URL}/corpora/${corpusId}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'X-Goog-Api-Key': this.apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Failed to delete file', new Error(error), {
        corpusId,
        fileId
      })
      throw new Error(`Failed to delete file: ${error}`)
    }

    logger.info('File deleted successfully', { corpusId, fileId })
  }

  /**
   * Get file details
   */
  async getFile(corpusId: string, fileId: string): Promise<FileSearchFile> {
    logger.debug('Getting file details', { corpusId, fileId })

    const response = await fetch(`${BASE_URL}/corpora/${corpusId}/files/${fileId}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': this.apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Failed to get file', new Error(error), {
        corpusId,
        fileId
      })
      throw new Error(`Failed to get file: ${error}`)
    }

    return await response.json() as FileSearchFile
  }

  /**
   * Wait for a file to finish processing
   */
  async waitForFileProcessing(
    corpusId: string,
    fileId: string,
    maxWaitMs: number = 60000
  ): Promise<FileSearchFile> {
    logger.info('Waiting for file to process', { corpusId, fileId, maxWaitMs })

    const startTime = Date.now()
    const pollInterval = 2000 // Poll every 2 seconds

    while (Date.now() - startTime < maxWaitMs) {
      const file = await this.getFile(corpusId, fileId)

      if (file.state === 'ACTIVE') {
        logger.info('File processing complete', { corpusId, fileId })
        return file
      }

      if (file.state === 'FAILED') {
        const errorMsg = file.error?.message || 'Unknown error'
        logger.error('File processing failed', new Error(errorMsg), {
          corpusId,
          fileId
        })
        throw new Error(`File processing failed: ${errorMsg}`)
      }

      // Still processing, wait and retry
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error(`File processing timeout after ${maxWaitMs}ms`)
  }

  /**
   * Extract corpus ID from resource name
   * e.g., "corpora/abc123" -> "abc123"
   */
  private extractCorpusId(resourceName: string): string {
    return resourceName.split('/').pop() || resourceName
  }

  /**
   * Extract file ID from resource name
   * e.g., "corpora/abc/files/xyz" -> "xyz"
   */
  private extractFileId(resourceName: string): string {
    return resourceName.split('/').pop() || resourceName
  }
}

// Export a singleton instance
export const fileSearchClient = new FileSearchClient()
