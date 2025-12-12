# Chatty-Kathy Implementation Plan

> **Current Phase**: Phase 0 ✅ Complete
> **Next Phase**: Phase 1 - Google File Search Setup

---

## Overview

Build an AI chatbot that answers questions by pulling from multiple data sources using Google File Search API for RAG capabilities. Starting with GitHub integration, then expanding to Slack and other sources.

**First Data Source**: GitHub (simpler auth, better rate limits, structured data)

---

## Tech Stack

- **Frontend**: React + Vercel AI SDK UI (`useChat` hook)
- **Backend**: Next.js 15 App Router + TypeScript
- **RAG**: Google File Search API (managed semantic search)
- **LLM**: Google Gemini 2.5 Flash (free tier)
- **Observability**: LangFuse with OpenTelemetry
- **Deployment**: Vercel with Cron Jobs

---

## Architecture Decisions

### Google File Search API
- Fully managed RAG (no need to build vector DB)
- Automatic chunking, embedding, and indexing
- Built-in citations for source attribution
- $0.15 per 1M tokens at indexing time

### Tool-Based Data Access
Each data source (GitHub, Slack, etc.) becomes a callable tool that queries the File Search corpus with appropriate filters. The AI decides when to call each tool based on user questions.

### Modular Design Pattern
```
Data Source → Fetcher → Transformer → File Search Uploader
                                              ↓
                            User Question → AI + Tools → File Search Query → Response
```

---

## Project Structure

```
chatty-kathy/
├── app/
│   ├── api/
│   │   ├── chat/route.ts              # Main chat endpoint (streamText + tools)
│   │   └── cron/ingest/route.ts       # Vercel Cron for data sync
│   ├── page.tsx                       # Chat UI page
│   └── layout.tsx
├── src/
│   ├── components/chat/
│   │   ├── ChatInterface.tsx          # useChat hook integration
│   │   ├── MessageList.tsx
│   │   └── CitationCard.tsx           # Display File Search citations
│   └── lib/
│       ├── ai/
│       │   ├── gemini.ts              # Gemini model config
│       │   └── langfuse.ts            # LangFuse setup
│       ├── tools/
│       │   ├── index.ts               # Tool registry
│       │   └── github-search.ts       # GitHub search tool
│       ├── ingestion/
│       │   ├── sync-manager.ts        # Orchestrates all source syncs
│       │   ├── github/
│       │   │   ├── client.ts          # GitHub API wrapper
│       │   │   ├── fetcher.ts         # Fetch repos, issues, PRs
│       │   │   └── transformer.ts     # Convert to File Search format
│       │   └── file-search/
│       │       ├── client.ts          # File Search API client
│       │       └── uploader.ts        # Upload documents to corpus
│       ├── types/
│       │   └── data-sources.ts        # Shared TypeScript interfaces
│       └── utils/
│           ├── env.ts                 # Environment validation (Zod)
│           └── logger.ts              # Structured logging
├── scripts/
│   └── create-corpus.ts               # One-time corpus setup
├── instrumentation.ts                 # OpenTelemetry for LangFuse
├── vercel.json                        # Cron configuration
└── .env.local                         # Environment variables
```

---

## Implementation Phases

### ✅ Phase 0: Project Foundation (COMPLETE)

**Goal**: Set up Next.js project with dependencies

**Completed Tasks**:
- ✅ Initialize Next.js 15 with TypeScript and App Router
- ✅ Install core dependencies (Vercel AI SDK, LangFuse, OpenTelemetry, Zod)
- ✅ Create `.env.local` with environment variables
- ✅ Configure `tsconfig.json` with path aliases (`@/` → `src/`)
- ✅ Create folder structure
- ✅ Build environment validation utility with Zod
- ✅ Build structured logger

**Git Commit**: `feat: initialize Next.js project with core dependencies (Phase 0)`

**Critical Files Created**:
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config with path aliases
- `.env.local` - Environment variables template
- `next.config.ts` - Next.js configuration
- `src/lib/utils/env.ts` - Zod-based env validation
- `src/lib/utils/logger.ts` - Structured logging
- `README.md` - Project documentation

**Validation**:
- ✅ `npm run build` succeeds
- ✅ `npm run dev` serves placeholder page
- ✅ TypeScript compilation works

---

### 🔄 Phase 1: Google File Search Setup

**Goal**: Create File Search corpus and build API client

**Tasks**:
1. Create TypeScript types for data sources (`src/lib/types/data-sources.ts`)
2. Get Google AI API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Create script to generate File Search corpus (`scripts/create-corpus.ts`)
4. Build File Search client (`src/lib/ingestion/file-search/client.ts`)
5. Build File Search uploader (`src/lib/ingestion/file-search/uploader.ts`)
6. Test with sample document upload

**Critical Files to Create**:
- `src/lib/types/data-sources.ts` - Shared TypeScript interfaces
  ```typescript
  export interface Document {
    content: string
    metadata: DocumentMetadata
  }

  export interface DocumentMetadata {
    source: 'github' | 'slack'
    type: string
    id: string
    url: string
    [key: string]: unknown
  }
  ```

- `scripts/create-corpus.ts` - One-time corpus creation
  ```typescript
  // Creates a new File Search corpus and outputs the corpus ID
  // Run: npx tsx scripts/create-corpus.ts
  ```

- `src/lib/ingestion/file-search/client.ts` - File Search API wrapper
  ```typescript
  export class FileSearchClient {
    async createCorpus(name: string): Promise<string>
    async uploadFile(corpusId: string, content: Buffer, metadata: FileMetadata): Promise<string>
    async deleteFile(corpusId: string, fileId: string): Promise<void>
    async listFiles(corpusId: string): Promise<FileMetadata[]>
  }
  ```

- `src/lib/ingestion/file-search/uploader.ts` - Document upload orchestration

**API Endpoints**:
- Create corpus: `POST https://generativelanguage.googleapis.com/v1beta/corpora`
- Upload file: `POST https://generativelanguage.googleapis.com/v1beta/corpora/{corpusId}/files`
- Query: Use `fileSearchRetrieval` in Gemini tool config

**Validation**:
- Run `npm run create-corpus` successfully
- Upload a test markdown file
- Verify file appears in corpus via API
- Save corpus ID to `.env.local`

**Git Commit**: `feat: add Google File Search API integration (Phase 1)`

---

### Phase 2: Chat Interface Foundation

**Goal**: Build basic chat UI with streaming (no tools yet)

**Tasks**:
1. Configure OpenTelemetry/LangFuse in `instrumentation.ts`
2. Create Gemini client (`src/lib/ai/gemini.ts`)
3. Create LangFuse config (`src/lib/ai/langfuse.ts`)
4. Implement chat API route (`app/api/chat/route.ts`)
5. Build ChatInterface component (`src/components/chat/ChatInterface.tsx`)
6. Update home page to use ChatInterface
7. Test end-to-end streaming

**Critical Files to Create**:

- `instrumentation.ts` - OpenTelemetry setup
  ```typescript
  import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
  import { LangfuseSpanProcessor } from '@langfuse/otel'

  export function register() {
    const provider = new NodeTracerProvider()
    provider.addSpanProcessor(new LangfuseSpanProcessor({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL,
    }))
    provider.register()
  }
  ```

- `src/lib/ai/gemini.ts` - Gemini model config
  ```typescript
  import { google } from '@ai-sdk/google'
  export const geminiModel = google('gemini-2.5-flash-latest')
  ```

- `app/api/chat/route.ts` - Chat endpoint
  ```typescript
  import { streamText } from 'ai'
  import { geminiModel } from '@/lib/ai/gemini'

  export async function POST(req: Request) {
    const { messages } = await req.json()

    const result = streamText({
      model: geminiModel,
      messages,
      experimental_telemetry: { isEnabled: true },
    })

    return result.toDataStreamResponse()
  }
  ```

- `src/components/chat/ChatInterface.tsx` - Chat UI
  ```typescript
  'use client'
  import { useChat } from '@ai-sdk/react'

  export function ChatInterface() {
    const { messages, input, handleInputChange, handleSubmit } = useChat({
      api: '/api/chat',
    })

    // Render chat UI
  }
  ```

**Validation**:
- Chat interface appears on home page
- Can send message and receive streaming response
- LangFuse dashboard shows traces (if configured)
- No console errors

**Git Commit**: `feat: add chat interface with Gemini streaming (Phase 2)`

---

### Phase 3: GitHub Data Ingestion Pipeline

**Goal**: Fetch GitHub data and upload to File Search corpus

**Tasks**:
1. Build GitHub API client (`src/lib/ingestion/github/client.ts`)
2. Implement fetchers for repos, issues, PRs (`src/lib/ingestion/github/fetcher.ts`)
3. Transform GitHub data to documents (`src/lib/ingestion/github/transformer.ts`)
4. Build SyncManager (`src/lib/ingestion/sync-manager.ts`)
5. Add npm script to run manual sync
6. Test sync with a small repository
7. Verify documents appear in File Search corpus

**GitHub Document Format**:
```markdown
# [GitHub Issue] Fix authentication bug (#123)

**Repository**: owner/repo-name
**Author**: @username
**Created**: 2025-01-15
**Status**: closed
**Labels**: bug, authentication

## Description
[Issue body...]

## Comments
@user1 (2025-01-16): This might be related to...
```

**Critical Files to Create**:

- `src/lib/ingestion/github/client.ts` - GitHub API wrapper
  ```typescript
  export class GitHubClient {
    async listRepositories(org?: string): Promise<Repository[]>
    async getIssues(repo: string, state?: 'open' | 'closed'): Promise<Issue[]>
    async getPullRequests(repo: string): Promise<PullRequest[]>
    async getFileContent(repo: string, path: string): Promise<string>
  }
  ```

- `src/lib/ingestion/github/fetcher.ts` - Data fetching logic
- `src/lib/ingestion/github/transformer.ts` - GitHub → Document conversion
  ```typescript
  export function issueToDocument(issue: Issue): Document
  export function prToDocument(pr: PullRequest): Document
  export function readmeToDocument(repo: Repository, content: string): Document
  ```

- `src/lib/ingestion/sync-manager.ts` - Main sync orchestrator
  ```typescript
  export class SyncManager {
    async syncGitHub(repoNames?: string[]): Promise<SyncResult>
    async syncAllSources(): Promise<SyncResult[]>
  }
  ```

**Add to package.json scripts**:
```json
"sync:github": "tsx scripts/sync-github.ts"
```

**Validation**:
- Run `npm run sync:github` successfully
- Check logs show issues/PRs fetched
- Verify documents uploaded to File Search corpus
- Check document format is correct

**Git Commit**: `feat: add GitHub data ingestion pipeline (Phase 3)`

---

### Phase 4: GitHub Search Tool Implementation

**Goal**: Enable AI to search GitHub data via File Search

**Tasks**:
1. Define tool schema with Zod (`src/lib/tools/github-search.ts`)
2. Implement tool function to query File Search corpus
3. Register tool in chat API route
4. Add citation display component
5. Test tool calling with GitHub-specific questions

**Tool Design**:
```typescript
const githubSearchTool = tool({
  description: 'Search GitHub repositories, issues, and pull requests',
  parameters: z.object({
    query: z.string().describe('Search query'),
    repository: z.string().optional().describe('Limit to specific repo'),
    type: z.enum(['all', 'issue', 'pr', 'code']).optional()
  }),
  execute: async ({ query, repository, type }) => {
    // Query File Search corpus with filters
    // Return results with citations
  }
})
```

**Critical Files to Create**:

- `src/lib/tools/github-search.ts` - GitHub search tool
- `src/lib/tools/index.ts` - Tool registry
  ```typescript
  import { githubSearchTool } from './github-search'

  export const tools = {
    searchGitHub: githubSearchTool,
  }
  ```

- Update `app/api/chat/route.ts` - Add tools parameter
  ```typescript
  const result = streamText({
    model: geminiModel,
    messages,
    tools,  // Add this
    experimental_telemetry: { isEnabled: true },
  })
  ```

- `src/components/chat/CitationCard.tsx` - Citation display UI

**Testing Questions**:
- "What are the open bugs in the repo?"
- "Summarize issue #123"
- "What PRs are related to authentication?"

**Validation**:
- AI calls GitHub search tool when asked about GitHub data
- Tool executes and returns results
- Citations are displayed in UI
- Citations link back to GitHub

**Git Commit**: `feat: add GitHub search tool with citations (Phase 4)`

---

### Phase 5: Vercel Cron Data Sync

**Goal**: Automate data ingestion on a schedule

**Tasks**:
1. Create cron API route (`app/api/cron/ingest/route.ts`)
2. Configure `vercel.json` with cron schedule
3. Secure endpoint with `CRON_SECRET` verification
4. Add comprehensive logging
5. Deploy to Vercel
6. Test cron execution manually via Vercel dashboard

**Cron Configuration** (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/ingest",
    "schedule": "0 */6 * * *"
  }]
}
```

**Critical Files to Create**:

- `app/api/cron/ingest/route.ts` - Cron endpoint
  ```typescript
  import { syncManager } from '@/lib/ingestion/sync-manager'
  import { logger } from '@/lib/utils/logger'

  export async function GET(req: Request) {
    // Verify CRON_SECRET header
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    logger.info('Cron job started')

    try {
      const result = await syncManager.syncAllSources()
      logger.info('Cron job completed', { result })
      return Response.json({ success: true, result })
    } catch (error) {
      logger.error('Cron job failed', error)
      return Response.json({ success: false, error }, { status: 500 })
    }
  }
  ```

- `vercel.json` - Cron configuration

**Security**: Verify `Authorization: Bearer ${CRON_SECRET}` header

**Validation**:
- Deploy to Vercel
- Trigger cron manually in Vercel dashboard
- Check logs show sync completed
- Verify new documents were uploaded

**Git Commit**: `feat: add automated data sync via Vercel Cron (Phase 5)`

---

### Phase 6: Polish & Production Readiness

**Goal**: Improve UX, error handling, and deploy

**Tasks**:
1. Add error boundaries for graceful failures
2. Improve loading states during streaming
3. Enhanced citation UI with source links
4. Add rate limiting to chat endpoint
5. Stricter environment variable validation
6. Update README with deployment guide
7. Security review (ensure no secrets in client code)

**Critical Files to Create**:

- `src/components/chat/ErrorBoundary.tsx` - Error handling
- Update `src/lib/utils/env.ts` - Stricter validation for production
- Update `README.md` - Add deployment section

**Validation**:
- Error states display gracefully
- Citations have working links
- Rate limiting prevents abuse
- All environment vars validated on startup
- No API keys exposed in client bundle

**Git Commit**: `feat: add error handling and production polish (Phase 6)`

---

### Phase 7: Slack Integration (Future)

**Goal**: Add Slack as second data source

**Challenges**:
- OAuth app setup required
- Rate limits: 1 request/minute for `conversations.history` (new apps)
- Thread complexity (need separate API calls for replies)
- Multiple scopes for public/private channels

**Critical Files** (future):
- `src/lib/ingestion/slack/client.ts`
- `src/lib/ingestion/slack/fetcher.ts`
- `src/lib/ingestion/slack/transformer.ts`
- `src/lib/tools/slack-search.ts`

**Git Commit**: `feat: add Slack integration (Phase 7)`

---

## Environment Variables

Required in `.env.local`:

```bash
# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here     # From: https://aistudio.google.com/app/apikey
GOOGLE_CORPUS_ID=your_corpus_id_here          # Generated by scripts/create-corpus.ts

# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxx                 # Fine-grained PAT with repo read access

# LangFuse (optional for development)
LANGFUSE_PUBLIC_KEY=pk-lf-xxxxxxxxxxxx
LANGFUSE_SECRET_KEY=sk-lf-xxxxxxxxxxxx
LANGFUSE_BASE_URL=https://cloud.langfuse.com

# Vercel (auto-provided in production)
CRON_SECRET=vercel_cron_secret

# App Config
NODE_ENV=development
```

---

## Critical Files Summary

The 5 most critical files that form the system backbone:

1. **`app/api/chat/route.ts`** - Main chat endpoint integrating AI streaming, tool calling, and LangFuse tracking
2. **`src/lib/ingestion/sync-manager.ts`** - Central orchestrator for all data source syncing
3. **`src/lib/ingestion/file-search/client.ts`** - Google File Search API client for RAG functionality
4. **`src/lib/tools/github-search.ts`** - First tool implementation, establishes pattern for all future tools
5. **`instrumentation.ts`** - OpenTelemetry/LangFuse setup for observability

---

## Modular Design for Future Sources

**Adding a new data source** (e.g., Confluence, Notion):

1. Create `/src/lib/ingestion/{source}/` directory
2. Implement: `client.ts`, `fetcher.ts`, `transformer.ts`
3. Add `sync{Source}()` method to `SyncManager`
4. Create tool in `/src/lib/tools/{source}-search.ts`
5. Register tool in `/src/lib/tools/index.ts`
6. Update environment variables

All sources follow the same pattern:
```
Fetch Data → Transform to Document → Upload to File Search → Query via Tool
```

---

## Success Criteria

**Project Complete When**:
- ✅ Chat interface streams responses from Gemini
- ✅ GitHub data syncs to File Search corpus
- ✅ AI can answer questions about GitHub data with citations
- ✅ Cron job runs automatically every 6 hours
- ✅ LangFuse tracks all requests and token usage
- ✅ Deployed to Vercel production

---

## Picking Up Mid-Implementation

If you need to resume work on this project:

1. **Check current phase**: Look at git commit history
   ```bash
   git log --oneline
   ```

2. **Find your place**: Check which phase commit you see most recently

3. **Review the phase**: Read the corresponding section above

4. **Continue from tasks**: Pick up from the next incomplete task in that phase

5. **Validate before proceeding**: Run the validation steps to ensure previous work is solid

---

## Git Commit Convention

All commits follow conventional commits format:

```
feat: <description> (Phase N)
```

Examples:
- `feat: initialize Next.js project with core dependencies (Phase 0)`
- `feat: add Google File Search API integration (Phase 1)`
- `feat: add chat interface with Gemini streaming (Phase 2)`
