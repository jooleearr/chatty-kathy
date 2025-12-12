# Chatty Kathy

AI chatbot with multi-source integration using Google File Search API for semantic search across GitHub, Slack, and other data sources.

## Tech Stack

- **Frontend**: React + Vercel AI SDK UI
- **Backend**: Next.js 15 App Router + TypeScript
- **RAG**: Google File Search API (managed semantic search)
- **LLM**: Google Gemini 2.5 Flash
- **Observability**: LangFuse with OpenTelemetry
- **Deployment**: Vercel with Cron Jobs

## Project Structure

```
chatty-kathy/
├── app/
│   ├── api/
│   │   ├── chat/           # Main chat endpoint
│   │   └── cron/ingest/    # Data sync cron job
│   ├── page.tsx            # Home page
│   └── layout.tsx
├── src/
│   ├── components/chat/    # Chat UI components
│   └── lib/
│       ├── ai/             # Gemini & LangFuse config
│       ├── tools/          # AI tools (GitHub, Slack, etc.)
│       ├── ingestion/      # Data fetching & syncing
│       ├── types/          # TypeScript interfaces
│       └── utils/          # Utilities (env, logger)
├── scripts/                # Setup scripts
└── instrumentation.ts      # OpenTelemetry setup
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google AI API key ([Get one here](https://aistudio.google.com/app/apikey))
- GitHub personal access token ([Create one here](https://github.com/settings/tokens?type=beta))
- LangFuse account (optional, [sign up here](https://cloud.langfuse.com))

### Installation

1. **Clone the repository** (or you're already here!)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:

   Copy `.env.local` and fill in your API keys:
   ```bash
   # Google AI
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
   GOOGLE_CORPUS_ID=will_be_generated

   # GitHub
   GITHUB_TOKEN=ghp_your_github_token

   # LangFuse (optional for development)
   LANGFUSE_PUBLIC_KEY=pk-lf-xxxxxxxxxxxx
   LANGFUSE_SECRET_KEY=sk-lf-xxxxxxxxxxxx
   LANGFUSE_BASE_URL=https://cloud.langfuse.com
   ```

4. **Create Google File Search corpus** (one-time setup):
   ```bash
   npm run create-corpus
   ```
   This will output a `GOOGLE_CORPUS_ID` - add it to your `.env.local` file.

5. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI
- `npm run create-corpus` - Create a new File Search corpus (one-time setup)
- `npm run list-corpora` - List all File Search corpora
- `npm run delete-all-corpora` - Delete all File Search corpora (⚠️ destructive)

### Project Status

**Phase 0: Project Foundation** ✅ COMPLETE
- Next.js project setup
- Core dependencies installed
- Environment configuration
- Project structure created

**Phase 1: Google File Search Setup** ✅ COMPLETE
- FileSearchStores API client implemented
- Document uploader with batch support
- Integration tests with real API
- Corpus creation script

**Next Steps** (see [implementation plan](./.claude/plans/soft-knitting-hopper.md)):
- Phase 2: Chat interface foundation
- Phase 3: GitHub data ingestion pipeline
- Phase 4: GitHub search tool
- Phase 5: Vercel Cron automation
- Phase 6: Polish & production readiness
- Phase 7: Slack integration (future)

## Architecture

### Data Flow

```
GitHub/Slack → Fetcher → Transformer → File Search Upload
                                              ↓
                      User Question → AI + Tools → File Search Query → Response
```

### Tool-Based System

Each data source (GitHub, Slack, etc.) is implemented as a callable tool for the AI:
- **GitHub Search Tool**: Search repos, issues, PRs, code
- **Slack Search Tool** (future): Search messages, threads, channels

The AI automatically decides which tool to call based on the user's question.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Google AI API key for Gemini |
| `GOOGLE_CORPUS_ID` | Yes | File Search corpus ID (generated during setup) |
| `GITHUB_TOKEN` | Yes | GitHub fine-grained PAT with repo read access |
| `LANGFUSE_PUBLIC_KEY` | No | LangFuse public key (optional) |
| `LANGFUSE_SECRET_KEY` | No | LangFuse secret key (optional) |
| `LANGFUSE_BASE_URL` | No | LangFuse instance URL (default: cloud.langfuse.com) |
| `CRON_SECRET` | No | Vercel cron auth (auto-provided in production) |

## API Keys Setup

### Google AI API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy to `.env.local` as `GOOGLE_GENERATIVE_AI_API_KEY`

### GitHub Personal Access Token
1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens?type=beta)
2. Create a fine-grained token with:
   - Repository access: Select repositories
   - Permissions: Contents (read-only), Issues (read-only), Pull requests (read-only)
3. Copy to `.env.local` as `GITHUB_TOKEN`

### LangFuse (Optional)
1. Sign up at [LangFuse Cloud](https://cloud.langfuse.com)
2. Create a new project
3. Copy API keys to `.env.local`

## Deployment

### Vercel (Recommended)

1. **Push to GitHub** (if not already done)
2. **Connect to Vercel**: Import your repository
3. **Add environment variables** in Vercel dashboard
4. **Deploy**: Vercel will auto-deploy on push to main

The cron job for data syncing will run automatically every 6 hours in production.

## Contributing

This is a personal project, but feel free to fork and customize for your own use!

## License

MIT

## Roadmap

- [x] Phase 0: Project foundation
- [x] Phase 1: Google File Search setup (FileSearchStores API)
- [ ] Phase 2: Chat interface
- [ ] Phase 3: GitHub data ingestion
- [ ] Phase 4: GitHub search tool
- [ ] Phase 5: Cron automation
- [ ] Phase 6: Production polish
- [ ] Phase 7: Slack integration
- [ ] Future: Atlassian (Jira/Confluence) integration
- [ ] Future: Multi-user support with authentication

## Support

For issues or questions, please open an issue on GitHub.
