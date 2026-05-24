import { useState, useEffect, useCallback, useRef } from "preact/hooks";
import type { PaginatedResponse } from "@/api/types";
import client from "@/api/client";

type FetchFn<T> = () => Promise<PaginatedResponse<T>>;

export interface PaginationResult<T> {
    results: T[];
    count: number;
    nextUrl: string | null;
    previousUrl: string | null;
    isLoading: boolean;
    error: Error | null;
    loadMore: () => Promise<void>;
    goToPage: (url: string) => Promise<void>;
    refresh: () => Promise<void>;
    prepend: (item: T) => void;
}

// deps controls when results are reset and re-fetched from page 1.
// Pass [query] for search, [] for a static list.
export function usePagination<T>(fetchFn: FetchFn<T>, deps: unknown[] = []): PaginationResult<T> {
    const [results, setResults] = useState<T[]>([]);
    const [count, setCount] = useState(0);
    const [nextUrl, setNextUrl] = useState<string | null>(null);
    const [previousUrl, setPreviousUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Keep a stable ref so callbacks always call the latest fetchFn.
    const fetchFnRef = useRef(fetchFn);
    fetchFnRef.current = fetchFn;

    // Track in-flight requests so stale responses are ignored after deps change.
    const cancelledRef = useRef(false);

    const applyPage = (data: PaginatedResponse<T>, append: boolean) => {
        setResults((prev) => (append ? [...prev, ...data.results] : data.results));
        setCount(data.count);
        setNextUrl(data.next);
        setPreviousUrl(data.previous);
    };

    // Re-fetch from page 1 whenever deps change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        cancelledRef.current = false;
        setIsLoading(true);
        setError(null);
        setResults([]);
        setCount(0);
        setNextUrl(null);
        setPreviousUrl(null);

        fetchFnRef
            .current()
            .then((data) => {
                if (!cancelledRef.current) applyPage(data, false);
            })
            .catch((err) => {
                if (!cancelledRef.current) {
                    setError(err instanceof Error ? err : new Error(String(err)));
                }
            })
            .finally(() => {
                if (!cancelledRef.current) setIsLoading(false);
            });

        return () => {
            cancelledRef.current = true;
        };
    }, deps);

    const loadMore = useCallback(async () => {
        if (!nextUrl || isLoading) return;
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await client.get<PaginatedResponse<T>>(nextUrl);
            applyPage(data, true);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setIsLoading(false);
        }
    }, [nextUrl, isLoading]);

    const goToPage = useCallback(async (url: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await client.get<PaginatedResponse<T>>(url);
            applyPage(data, false);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchFnRef.current();
            applyPage(data, false);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Optimistically add an item to the front without re-fetching.
    const prepend = useCallback((item: T) => {
        setResults((prev) => [item, ...prev]);
        setCount((c) => c + 1);
    }, []);

    return { results, count, nextUrl, previousUrl, isLoading, error, loadMore, goToPage, refresh, prepend };
}
