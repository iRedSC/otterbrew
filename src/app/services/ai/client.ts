import OpenAI from "openai";

let _client: OpenAI | null = null;

function initializeClient(): OpenAI {
  if (_client) {
    return _client;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is required for AI generation",
    );
  }

  _client = new OpenAI({
    apiKey,
  });

  return _client;
}

export function getOpenAIClient(): OpenAI {
  return initializeClient();
}

/**
 * Retry wrapper with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      if (
        error instanceof Error &&
        (error.message.includes("invalid_api_key") ||
          error.message.includes("authentication"))
      ) {
        throw error;
      }

      // If this is the last attempt, throw
      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Unknown error in retry");
}
