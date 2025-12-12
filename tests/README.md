# Chatty-Kathy Test Suite

This directory contains the test suite for the Chatty-Kathy project using Vitest.

## Running Tests

```bash
# Run tests in watch mode (default)
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

## Test Structure

### Integration Tests (Current)

Tests that interact with real external APIs:

- **`file-search-client.test.ts`** - Tests for Google File Search API client
  - Corpus operations (get corpus, list files)
  - File operations (upload, retrieve, delete)
  - Error handling

- **`file-search-uploader.test.ts`** - Tests for document uploader
  - Single document upload
  - Batch uploads
  - Progress tracking
  - Filename generation

### Prerequisites for Integration Tests

These tests require valid API credentials:

1. **Google AI API Key**: Set `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local`
2. **Corpus ID**: Set `GOOGLE_CORPUS_ID` in `.env.local` (created via `npm run create-corpus`)

If credentials are missing, tests will be skipped with a warning.

## Test Philosophy

1. **Real API Testing**: Integration tests use real APIs to ensure functionality works end-to-end
2. **Cleanup**: Tests clean up after themselves (delete uploaded files)
3. **Graceful Skipping**: Tests skip gracefully if credentials are missing
4. **Regression Prevention**: Tests ensure new features don't break existing functionality
5. **Documentation**: Tests serve as executable documentation of how APIs work

## Adding New Tests

### For New Data Sources (e.g., GitHub, Slack)

Create test files following this pattern:

```typescript
// tests/github-client.test.ts
import { describe, it, expect } from 'vitest'
import { GitHubClient } from '../src/lib/ingestion/github/client'

describe('GitHubClient', () => {
  it('should fetch repository issues', async () => {
    // Test implementation
  })
})
```

### For New Features

1. Create a test file in `tests/` directory
2. Use descriptive `describe` blocks for feature grouping
3. Write clear `it` statements describing expected behavior
4. Include setup/teardown as needed
5. Add appropriate timeouts for async operations

## Test Coverage Goals

- **Phase 1**: File Search API integration
- **Phase 2**: Chat interface and Gemini streaming
- **Phase 3**: GitHub data ingestion
- **Phase 4**: Tool execution and search
- **Phase 5**: Cron job execution
- **Phase 6**: Error handling and edge cases

## Mocking Strategy

Currently using real APIs for integration tests. As the project grows:

- **Unit tests**: Mock external APIs to test logic in isolation
- **Integration tests**: Use real APIs to test end-to-end flows
- **E2E tests**: Test full user workflows (future consideration)

## Continuous Integration

When setting up CI/CD:

- Store API keys as encrypted secrets
- Run integration tests only on specific branches/PRs
- Consider using separate test corpus for CI environment
