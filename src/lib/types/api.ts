/** Every successful API response is wrapped in data */
export type ApiResponse<T> = { data: T };

/** Every API error response */
export type ApiError = { error: string; code: string };
