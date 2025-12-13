/**
 * Retry utility with exponential backoff
 * Used for resilient API calls and sync operations
 */

/**
 * Sleep for a specified duration
 */
const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry configuration options
 */
export interface RetryOptions {
    maxRetries?: number;
    backoffFactor?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: any) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    backoffFactor: 2,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    shouldRetry: (error: any) => {
        // Retry on network errors or 5xx server errors
        if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
            return true;
        }
        if (error.response?.status >= 500) {
            return true;
        }
        // Retry on specific error codes
        if (error.response?.status === 408 || error.response?.status === 429) {
            return true; // Request Timeout or Too Many Requests
        }
        return false;
    },
};

/**
 * Execute a function with retry logic and exponential backoff
 * 
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function's result
 * @throws The last error if all retries fail
 * 
 * @example
 * const result = await retryWithBackoff(
 *   () => api.post('/api/sync/pull', data),
 *   { maxRetries: 3 }
 * );
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const opts = { ...defaultOptions, ...options };
    let lastError: any;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
        try {
            // Log retry attempt if not first try
            if (attempt > 0) {
                console.log(`🔄 Retry attempt ${attempt}/${opts.maxRetries}...`);
            }

            // Execute the function
            const result = await fn();

            // Log success if this was a retry
            if (attempt > 0) {
                console.log(`✅ Retry succeeded on attempt ${attempt}`);
            }

            return result;
        } catch (error) {
            lastError = error;

            // Check if we should retry
            const shouldRetry = opts.shouldRetry(error);
            const isLastAttempt = attempt === opts.maxRetries;

            if (!shouldRetry || isLastAttempt) {
                // Log final failure
                if (isLastAttempt && shouldRetry) {
                    console.error(`❌ All retry attempts failed (${opts.maxRetries + 1} attempts)`);
                }
                throw error;
            }

            // Calculate backoff delay with exponential growth
            const backoffDelay = Math.min(
                opts.initialDelay * Math.pow(opts.backoffFactor, attempt),
                opts.maxDelay
            );

            console.warn(
                `⚠️ Attempt ${attempt + 1} failed, retrying in ${backoffDelay}ms...`,
                error.message || error
            );

            // Wait before next retry
            await sleep(backoffDelay);
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError;
}

/**
 * Retry specifically for sync operations
 * Pre-configured with sync-specific retry logic
 */
export async function retrySyncOperation<T>(
    fn: () => Promise<T>,
    operationName: string = 'Sync'
): Promise<T> {
    console.log(`🔄 [${operationName}] Starting operation...`);

    try {
        const result = await retryWithBackoff(fn, {
            maxRetries: 3,
            initialDelay: 2000, // 2 seconds
            backoffFactor: 2,
            shouldRetry: (error) => {
                // Retry on network errors
                if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
                    console.warn(`[${operationName}] Network error, will retry`);
                    return true;
                }
                // Retry on 5xx server errors
                if (error.response?.status >= 500) {
                    console.warn(`[${operationName}] Server error ${error.response.status}, will retry`);
                    return true;
                }
                // Don't retry on 4xx client errors (except 408 timeout and 429 rate limit)
                if (error.response?.status >= 400 && error.response?.status < 500) {
                    if (error.response.status === 408 || error.response.status === 429) {
                        console.warn(`[${operationName}] Throttled/timeout, will retry`);
                        return true;
                    }
                    console.error(`[${operationName}] Client error ${error.response.status}, won't retry`);
                    return false;
                }
                return true; // Retry other errors
            },
        });

        console.log(`✅ [${operationName}] Operation completed successfully`);
        return result;
    } catch (error) {
        console.error(`❌ [${operationName}] Operation failed after all retries`, error);
        throw error;
    }
}
