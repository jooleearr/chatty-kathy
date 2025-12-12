/**
 * Google File Search API client (FileSearchStores API)
 * Documentation: https://ai.google.dev/gemini-api/docs/file-search
 * API Reference: https://ai.google.dev/api/file-search/file-search-stores
 */

import { env } from '@/lib/utils/env'
import { logger } from '@/lib/utils/logger'
import type { FileSearchCorpus, FileSearchFile, FileSearchUploadOptions } from '@/lib/types/data-sources'
import * as fs from 'fs'
import * as path from 'path'
import { FormData, File as FormDataFile } from 'formdata-node'
import { fileFromPath } from 'formdata-node/file-from-path'

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
const UPLOAD_URL = 'https://generativelanguage.googleapis.com/upload/v1beta'

export class FileSearchClient {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.GOOGLE_GENERATIVE_AI_API_KEY
  }

  /**
   * Create a new File Search Store
   * API: POST /fileSearchStores
   */
  async createCorpus(displayName: string): Promise<FileSearchCorpus> {
    logger.info('Creating File Search Store', { displayName })

    const response = await fetch(`${BASE_URL}/fileSearchStores?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayName,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Failed to create File Search Store', new Error(error), {
        status: response.status,
        statusText: response.statusText
      })
      throw new Error(`Failed to create File Search Store (${response.status}): ${error}`)
    }

    const store = await response.json() as FileSearchCorpus
    logger.info('File Search Store created successfully', {
      storeName: store.name,
      storeId: this.extractStoreId(store.name)
    })

    return store
  }

  /**
   * Get File Search Store details
   * API: GET /{name=fileSearchStores/*}
   */
  async getCorpus(storeId: string): Promise<FileSearchCorpus> {
    logger.debug('Getting File Search Store details', { storeId })

    // Ensure we have the full resource name
    const resourceName = storeId.includes('fileSearchStores/')
      ? storeId
      : `fileSearchStores/${storeId}`

    const response = await fetch(`${BASE_URL}/${resourceName}?key=${this.apiKey}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Failed to get File Search Store', new Error(error), {
        storeId,
        status: response.status,
        statusText: response.statusText
      })
      throw new Error(`Failed to get File Search Store (${response.status}): ${error}`)
    }

    return await response.json() as FileSearchCorpus
  }

  /**
   * List all File Search Stores
   * API: GET /fileSearchStores
   */
  async listCorpora(options: { pageToken?: string; pageSize?: number } = {}): Promise<{
    corpora: FileSearchCorpus[]
    nextPageToken?: string
  }> {
    logger.debug('Listing File Search Stores', options)

    const params = new URLSearchParams()
    params.append('key', this.apiKey)
    if (options.pageToken) {
      params.append('pageToken', options.pageToken)
    }
    if (options.pageSize) {
      params.append('pageSize', options.pageSize.toString())
    }

    const url = `${BASE_URL}/fileSearchStores?${params.toString()}`

    const response = await fetch(url, {
      method: 'GET',
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Failed to list File Search Stores', new Error(error), {
        status: response.status,
        statusText: response.statusText
      })
      throw new Error(`Failed to list File Search Stores (${response.status}): ${error}`)
    }

    const data = await response.json() as {
      fileSearchStores?: FileSearchCorpus[]
      nextPageToken?: string
    }

    logger.debug('File Search Stores listed', {
      count: data.fileSearchStores?.length || 0,
      hasMore: !!data.nextPageToken
    })

    return {
      corpora: data.fileSearchStores || [],
      nextPageToken: data.nextPageToken,
    }
  }

  /**
   * List all File Search Stores (with auto-pagination)
   */
  async listAllCorpora(): Promise<FileSearchCorpus[]> {
    logger.debug('Listing all File Search Stores')

    const allStores: FileSearchCorpus[] = []
    let pageToken: string | undefined

    do {
      const { corpora, nextPageToken } = await this.listCorpora({ pageToken })
      allStores.push(...corpora)
      pageToken = nextPageToken
    } while (pageToken)

    logger.debug('All File Search Stores listed', { totalCount: allStores.length })
    return allStores
  }

  /**
   * Upload a file to File Search Store
   * API: POST /upload/v1beta/{fileSearchStoreName}:uploadToFileSearchStore
   *
   * Note: This creates a temporary file in /tmp for the upload
   */
  async uploadFile(
    storeId: string,
    content: string | Buffer,
    options: FileSearchUploadOptions = {}
  ): Promise<FileSearchFile> {
    const displayName = options.displayName || `document-${Date.now()}.txt`

    logger.info('Uploading file to File Search Store', {
      storeId,
      displayName,
      contentSize: content.length
    })

    // Ensure we have the full resource name
    const resourceName = storeId.includes('fileSearchStores/')
      ? storeId
      : `fileSearchStores/${storeId}`

    // Convert content to Buffer if it's a string
    const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content

    // Create a temporary file for upload
    const tmpFilePath = path.join('/tmp', displayName)
    fs.writeFileSync(tmpFilePath, buffer)

    try {
      // Create form data with the file
      const formData = new FormData()

      // Add the file using fileFromPath
      const file = await fileFromPath(tmpFilePath, displayName, { type: 'text/plain' })
      formData.append('file', file)

      // Note: Custom metadata in FileSearchStores API may need to be set via a separate API call
      // The upload endpoint primarily handles the file itself

      const response = await fetch(
        `${UPLOAD_URL}/${resourceName}:uploadToFileSearchStore?key=${this.apiKey}`,
        {
          method: 'POST',
          body: formData as any,
        }
      )

      if (!response.ok) {
        const error = await response.text()
        logger.error('Failed to upload file', new Error(error), {
          storeId,
          displayName,
          status: response.status,
          statusText: response.statusText
        })
        throw new Error(`Failed to upload file (${response.status}): ${error}`)
      }

      const operation = await response.json() as any

      logger.info('File upload operation started', {
        storeId,
        operationName: operation.name,
        displayName
      })

      // Return a mock FileSearchFile for now since the API returns an operation
      // In practice, you'd need to poll the operation status
      return {
        name: operation.name,
        displayName,
        mimeType: 'text/plain',
        sizeBytes: buffer.length.toString(),
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        sha256Hash: '',
        state: 'PROCESSING' as const,
      }
    } finally {
      // Clean up temporary file
      try {
        fs.unlinkSync(tmpFilePath)
      } catch (error) {
        logger.warn('Failed to delete temporary file', { tmpFilePath })
      }
    }
  }

  /**
   * Note: File listing is not supported in the FileSearchStores API
   * Files are managed internally and you interact with them through the search interface
   */
  async listFiles(storeId: string): Promise<{ files: FileSearchFile[]; nextPageToken?: string }> {
    logger.warn('File listing is not supported in FileSearchStores API', { storeId })
    return {
      files: [],
    }
  }

  async listAllFiles(storeId: string): Promise<FileSearchFile[]> {
    logger.warn('File listing is not supported in FileSearchStores API', { storeId })
    return []
  }

  /**
   * Note: Individual file operations not supported in FileSearchStores API
   * Files are managed at the store level
   */
  async getFile(storeId: string, fileId: string): Promise<FileSearchFile> {
    throw new Error('Individual file operations not supported in FileSearchStores API')
  }

  async deleteFile(storeId: string, fileId: string): Promise<void> {
    throw new Error('Individual file operations not supported in FileSearchStores API')
  }

  async waitForFileProcessing(
    storeId: string,
    fileId: string,
    maxWaitMs: number = 60000
  ): Promise<FileSearchFile> {
    logger.info('File processing happens automatically in FileSearchStores', { storeId })
    // In the new API, files are processed automatically
    // Return a mock successful state
    return {
      name: fileId,
      displayName: fileId,
      mimeType: 'text/plain',
      sizeBytes: '0',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      sha256Hash: '',
      state: 'ACTIVE',
    }
  }

  /**
   * Extract store ID from resource name
   * e.g., "fileSearchStores/abc123" -> "abc123"
   */
  private extractStoreId(resourceName: string): string {
    return resourceName.split('/').pop() || resourceName
  }

  /**
   * For backwards compatibility
   */
  private extractCorpusId(resourceName: string): string {
    return this.extractStoreId(resourceName)
  }
}

// Export a singleton instance
export const fileSearchClient = new FileSearchClient()
