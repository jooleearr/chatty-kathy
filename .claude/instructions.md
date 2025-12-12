# Claude Instructions for Chatty Kathy

## Project Overview

Chatty Kathy is an AI chatbot with multi-source integration using Google File Search API for semantic search across GitHub, Slack, and other data sources.

**Tech Stack:**
- Frontend: React + Vercel AI SDK UI
- Backend: Next.js 15 App Router + TypeScript
- RAG: Google File Search API (managed semantic search)
- LLM: Google Gemini 2.5 Flash
- Observability: LangFuse with OpenTelemetry
- Deployment: Vercel with Cron Jobs

## Critical Guidelines

### Always Check Latest Documentation

**IMPORTANT:** When working with libraries or adding new dependencies, ALWAYS fetch up-to-date information from the web first. Your knowledge cutoff is January 2025, but library APIs, best practices, and documentation change frequently.

**Before using any library:**
1. Use WebSearch to find the latest documentation
2. Check the current version and any breaking changes
3. Verify API signatures and recommended patterns
4. Look for official migration guides if upgrading

**This applies especially to:**
- Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/react`) - rapidly evolving
- Next.js 15 App Router - newer patterns and conventions
- Google Generative AI API - frequent updates
- React 19 - latest features and patterns
- Any new library being added to the project

### Architecture Principles

**Tool-Based System:**
- Each data source (GitHub, Slack, etc.) is a callable AI tool
- The AI automatically decides which tool to use based on user questions
- Tools use Google File Search API for semantic search over ingested data

**Data Flow:**
```
GitHub/Slack → Fetcher → Transformer → File Search Upload
                                           ↓
User Question → AI + Tools → File Search Query → Response
```

**Key Components:**
- `app/api/chat/` - Main chat endpoint with streaming
- `app/api/cron/ingest/` - Data sync cron job (runs every 6 hours)
- `src/lib/ai/` - Gemini and LangFuse configuration
- `src/lib/tools/` - AI tools for GitHub, Slack, etc.
- `src/lib/ingestion/` - Data fetching and syncing logic

## Development Guidelines

### Code Style
- Use TypeScript strictly - no `any` types
- Prefer server components in Next.js App Router
- Use Zod for runtime validation and structured outputs
- Keep components small and focused
- Error handling is critical - always handle API failures gracefully

### Environment Variables
Always check `.env.local` for required keys:
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key
- `GOOGLE_CORPUS_ID` - File Search corpus ID
- `GITHUB_TOKEN` - GitHub PAT with repo read access
- `LANGFUSE_*` - Optional observability keys

### Testing
- Run `npm run type-check` before committing
- Test streaming responses in chat UI
- Verify tool calls work correctly with real data

### Vercel AI SDK Patterns
- Use `streamText()` for AI responses in API routes
- Use `useChat()` hook for React chat components
- Tools are defined with Zod schemas for type safety
- Always handle streaming errors and loading states

### Google File Search API
- Files must be uploaded before searching
- Corpus IDs are project-scoped
- Pagination required for listing files (max 100 per page)
- Check scripts in `/scripts` for corpus management utilities

### Common Commands
- `npm run dev` - Start dev server
- `npm run create-corpus` - Create File Search corpus (one-time)
- `npm run list-corpora` - List all corpora
- `npm run delete-all-corpora` - Clean up test corpora
- `npm run type-check` - TypeScript validation
- `npm test` - Run Vitest tests

## Project Phases

Current implementation follows a phased approach (see `.claude/plans/` for details):

1. ✅ Phase 0: Project foundation
2. Phase 1: Google File Search setup
3. Phase 2: Chat interface foundation
4. Phase 3: GitHub data ingestion pipeline
5. Phase 4: GitHub search tool
6. Phase 5: Vercel Cron automation
7. Phase 6: Polish & production readiness
8. Phase 7: Slack integration (future)

## Best Practices

### When Adding Features
1. Check which phase it belongs to
2. Follow existing patterns in the codebase
3. Add proper error handling and logging
4. Update types in `src/lib/types/`
5. Test with real API calls, not mocks

### When Debugging
1. Check LangFuse traces if configured
2. Look at server logs for API errors
3. Verify environment variables are set
4. Test File Search API directly if RAG isn't working

### Security
- Never commit API keys or secrets
- GitHub tokens should have minimal scopes
- Validate all user inputs
- Sanitize data before uploading to File Search

## Helpful Resources

When searching for documentation, prioritize:
- Official Vercel AI SDK docs: https://sdk.vercel.ai/docs
- Google Generative AI docs: https://ai.google.dev/
- Next.js 15 App Router docs: https://nextjs.org/docs
- LangFuse docs: https://langfuse.com/docs

Remember: ALWAYS verify current API signatures and patterns with WebSearch before implementing!
