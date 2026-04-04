import type { ApiEnvelope, ApiErrorResponse, ErrorCode } from '@/api';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

export interface ClientConfig {
    /** Base URL, e.g. https://example.com/wp-json/csp/v1 */
    baseUrl: string;
    /** WordPress nonce injected into page via wp_localize_script */
    nonce: string;
    /** Default request timeout in ms. Default: 15_000 */
    timeout?: number;
    /** How many times to retry on 5xx / network failure. Default: 1 */
    retries?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ApiError — typed error thrown by the client
// ─────────────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
    readonly code: ErrorCode;
    readonly status: number;
    readonly data: unknown;

    constructor(code: ErrorCode, message: string, status: number, data: unknown = null) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
        this.data = data;
    }

    get isAborted(): boolean {
        return this.code === 'ABORT_ERROR';
    }

    get isUnauthorized(): boolean {
        return this.status === 401;
    }

    get isForbidden(): boolean {
        return this.status === 403;
    }

    get isNotFound(): boolean {
        return this.status === 404;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory cache with TTL
// ─────────────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

class RequestCache {
    private store = new Map<string, CacheEntry<unknown>>();

    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.value as T;
    }

    set<T>(key: string, value: T, ttlMs: number): void {
        this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    }

    invalidate(keyOrPrefix: string): void {
        for (const key of this.store.keys()) {
            if (key.startsWith(keyOrPrefix)) {
                this.store.delete(key);
            }
        }
    }

    clear(): void {
        this.store.clear();
    }
}

export const apiCache = new RequestCache();

// ─────────────────────────────────────────────────────────────────────────────
// Request options
// ─────────────────────────────────────────────────────────────────────────────

export interface RequestOptions {
    /** External AbortController signal for component-level cancellation */
    signal?: AbortSignal;
    /** Cache TTL in ms. Omit = no caching. Only applies to GET. */
    cacheTtl?: number;
    /** Override retry count for this request */
    retries?: number;
    /** If true, bypasses the in-memory cache and fetches fresh data */
    force?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core HTTP client
// ─────────────────────────────────────────────────────────────────────────────

export class HttpClient {
    private readonly baseUrl: string;
    private readonly nonce: string;
    private readonly timeout: number;
    private readonly defaultRetries: number;

    constructor(config: ClientConfig) {
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.nonce = config.nonce;
        this.timeout = config.timeout ?? 15_000;
        this.defaultRetries = config.retries ?? 1;
    }

    // ── Public HTTP methods ──────────────────────────────────────────────────

    get<T>(path: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
        const url = this.buildUrl(path, params);
        const cacheKey = url.toString();

        if (options?.cacheTtl && !options?.force) {
            const cached = apiCache.get<T>(cacheKey);
            if (cached !== null) return Promise.resolve(cached);
        }

        return this.request<T>('GET', url, undefined, options).then((data) => {
            if (options?.cacheTtl) {
                apiCache.set(cacheKey, data, options.cacheTtl);
            }
            return data;
        });
    }

    post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>('POST', this.buildUrl(path), body, options);
    }

    patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>('PATCH', this.buildUrl(path), body, options);
    }

    delete<T>(path: string, options?: RequestOptions): Promise<T> {
        return this.request<T>('DELETE', this.buildUrl(path), undefined, options);
    }

    // ── Internals ────────────────────────────────────────────────────────────

    private buildUrl(path: string, params?: Record<string, unknown>): URL {
        const url = new URL(`${this.baseUrl}${path}`);
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value === undefined || value === null || value === '') continue;
                if (Array.isArray(value)) {
                    value.forEach((v) => url.searchParams.append(key, String(v)));
                } else {
                    url.searchParams.set(key, String(value));
                }
            }
        }
        return url;
    }

    private async request<T>(
        method: string,
        url: URL,
        body?: unknown,
        options?: RequestOptions,
        attempt = 0
    ): Promise<T> {
        // Merge external signal with internal timeout signal
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), this.timeout);

        const signal = options?.signal
            ? AbortSignal.any
                ? AbortSignal.any([options.signal, timeoutController.signal])
                : this.mergeSignals(options.signal, timeoutController.signal)
            : timeoutController.signal;

        try {
            const fetchOptions: RequestInit = {
                method,
                headers: {
                    'X-WP-Nonce': this.nonce
                },
                signal
            };

            if (body !== undefined) {
                if (body instanceof FormData) {
                    fetchOptions.body = body;
                    // Note: Browser will automatically set Content-Type to multipart/form-data with the correct boundary
                } else {
                    (fetchOptions.headers as Record<string, string>)['Content-Type'] =
                        'application/json';
                    fetchOptions.body = JSON.stringify(body);
                }
            }

            const response = await fetch(url.toString(), fetchOptions);

            clearTimeout(timeoutId);

            const envelope: ApiEnvelope<T> = await response.json();

            if (!envelope.success) {
                const err = envelope as ApiErrorResponse;
                throw new ApiError(err.code, err.message, response.status, err.data);
            }

            return envelope.data;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof ApiError) throw error;

            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new ApiError('ABORT_ERROR', 'Request was cancelled', 0);
            }

            // Retry on network / 5xx errors
            const maxRetries = options?.retries ?? this.defaultRetries;
            if (attempt < maxRetries) {
                await this.sleep(200 * (attempt + 1));
                return this.request<T>(method, url, body, options, attempt + 1);
            }

            throw new ApiError('NETWORK_ERROR', (error as Error).message ?? 'Network error', 0);
        }
    }

    /** Polyfill for AbortSignal.any in older environments */
    private mergeSignals(...signals: AbortSignal[]): AbortSignal {
        const controller = new AbortController();
        const onAbort = () => controller.abort();
        signals.forEach((s) => {
            if (s.aborted) {
                controller.abort();
            } else {
                s.addEventListener('abort', onAbort, { once: true });
            }
        });
        return controller.signal;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton factory
// ─────────────────────────────────────────────────────────────────────────────

let _client: HttpClient | null = null;

export function createApiClient(config: ClientConfig): HttpClient {
    _client = new HttpClient(config);
    return _client;
}

export function useHttpClient(): HttpClient {
    if (!_client) {
        throw new Error('[API] Client not initialized. Call createApiClient() in main.ts.');
    }
    return _client;
}
