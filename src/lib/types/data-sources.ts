/**
 * Shared TypeScript interfaces for data sources and documents
 */

/**
 * Source type for documents
 */
export type DataSource = 'github' | 'slack' | 'atlassian'

/**
 * Document metadata that will be stored with each uploaded file
 */
export interface DocumentMetadata {
  source: DataSource
  type: string // e.g., 'issue', 'pr', 'message', 'page'
  id: string // Unique identifier from the source
  url: string // Link back to the original content
  title?: string
  author?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown // Allow additional metadata
}

/**
 * Document to be uploaded to File Search
 */
export interface Document {
  content: string // The actual text content (markdown format)
  metadata: DocumentMetadata
  fileName?: string // Optional filename override
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  source: DataSource
  success: boolean
  documentsAdded: number
  documentsUpdated: number
  documentsDeleted: number
  errors: string[]
  duration: number // in milliseconds
  timestamp: string
}

/**
 * GitHub-specific types
 */
export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  default_branch: string
  owner: {
    login: string
  }
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  html_url: string
  user: {
    login: string
  }
  created_at: string
  updated_at: string
  closed_at: string | null
  labels: Array<{
    name: string
    color: string
  }>
  comments: number
  repository?: string // Added by fetcher
}

export interface GitHubIssueComment {
  id: number
  body: string
  user: {
    login: string
  }
  created_at: string
  updated_at: string
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  html_url: string
  user: {
    login: string
  }
  created_at: string
  updated_at: string
  merged_at: string | null
  draft: boolean
  labels: Array<{
    name: string
    color: string
  }>
  repository?: string // Added by fetcher
}

/**
 * Slack-specific types (for future use)
 */
export interface SlackMessage {
  ts: string
  text: string
  user: string
  channel: string
  thread_ts?: string
  reply_count?: number
}

/**
 * File Search API types
 */
export interface FileSearchFile {
  name: string // Resource name (e.g., "corpora/abc/files/xyz")
  displayName?: string
  mimeType: string
  sizeBytes: string
  createTime: string
  updateTime: string
  expirationTime?: string
  sha256Hash: string
  uri?: string
  state: 'STATE_UNSPECIFIED' | 'PROCESSING' | 'ACTIVE' | 'FAILED'
  error?: {
    code: number
    message: string
  }
  metadata?: Record<string, unknown>
}

export interface FileSearchCorpus {
  name: string // Resource name (e.g., "corpora/abc123")
  displayName: string
  createTime: string
  updateTime: string
}

export interface FileSearchUploadOptions {
  displayName?: string
  metadata?: Record<string, unknown>
}
