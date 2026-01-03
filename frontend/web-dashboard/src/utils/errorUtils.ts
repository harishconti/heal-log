import axios, { AxiosError } from 'axios';

/**
 * API Error Response structure from the backend
 */
interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

/**
 * Type guard to check if an error is an AxiosError
 */
export function isAxiosError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return axios.isAxiosError(error);
}

/**
 * Extracts a user-friendly error message from an unknown error
 * @param error - The error to extract message from
 * @param defaultMessage - Default message if error cannot be parsed
 * @returns A user-friendly error message
 */
export function getErrorMessage(error: unknown, defaultMessage = 'An unexpected error occurred'): string {
  if (isAxiosError(error)) {
    // Try to get the detail from the API response
    const apiDetail = error.response?.data?.detail;
    if (apiDetail) {
      return apiDetail;
    }

    // Try to get a general message from the response
    const apiMessage = error.response?.data?.message;
    if (apiMessage) {
      return apiMessage;
    }

    // Handle specific HTTP status codes
    if (error.response?.status === 401) {
      return 'Invalid credentials. Please check your email and password.';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.response?.status === 422) {
      return 'Invalid input. Please check your data and try again.';
    }
    if (error.response?.status === 429) {
      return 'Too many requests. Please try again later.';
    }
    if (error.response?.status && error.response.status >= 500) {
      return 'Server error. Please try again later.';
    }

    // Fall back to the Axios error message
    if (error.message) {
      return error.message;
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
}

/**
 * Gets the HTTP status code from an error if available
 * @param error - The error to extract status from
 * @returns The HTTP status code or undefined
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}
