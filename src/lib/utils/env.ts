import { z } from 'zod'

const envSchema = z.object({
  // Google AI
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, 'Google Generative AI API key is required'),
  GOOGLE_CORPUS_ID: z.string().optional(), // Optional initially until corpus is created

  // GitHub
  GITHUB_TOKEN: z.string().min(1, 'GitHub token is required'),

  // LangFuse
  LANGFUSE_PUBLIC_KEY: z.string().optional(), // Optional for development
  LANGFUSE_SECRET_KEY: z.string().optional(), // Optional for development
  LANGFUSE_BASE_URL: z.string().url().optional().default('https://cloud.langfuse.com'),

  // Vercel Cron (auto-provided in production)
  CRON_SECRET: z.string().optional(),

  // App Config
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validates environment variables and returns typed env object
 * @param throwOnError - If true, throws error on validation failure. If false, logs warning and returns partial env
 */
export function validateEnv(throwOnError = false): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = `Environment validation failed:\n${error.issues
        .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n')}`

      if (throwOnError) {
        throw new Error(errorMessage)
      } else {
        console.warn(errorMessage)
        // Return process.env as-is for development (with type assertion)
        return process.env as unknown as Env
      }
    }
    throw error
  }
}

// Export validated env for use throughout the application
export const env = validateEnv(false)
