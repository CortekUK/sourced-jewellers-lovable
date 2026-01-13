import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface KeysetPaginationOptions {
  limit?: number;
  orderBy: string;
  ascending?: boolean;
  idField?: string;
}

interface PaginationCursor {
  [key: string]: any;
}

export function useKeysetPagination<T>(
  tableName: string,
  options: KeysetPaginationOptions
) {
  const { limit = 20, orderBy, ascending = false, idField = 'id' } = options;
  const [data, setData] = useState<T[]>([]);
  const [cursor, setCursor] = useState<PaginationCursor | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadPage = useCallback(async (
    nextCursor?: PaginationCursor,
    selectQuery?: string,
    additionalFilters?: (query: any) => any
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      let query = (supabase as any)
        .from(tableName)
        .select(selectQuery || '*')
        .order(orderBy, { ascending })
        .order(idField, { ascending })
        .limit(limit + 1); // +1 to check if there are more items

      // Apply cursor-based filtering
      if (nextCursor) {
        if (ascending) {
          query = query.gt(orderBy, nextCursor[orderBy])
            .or(`and(${orderBy}.eq.${nextCursor[orderBy]},${idField}.gt.${nextCursor[idField]})`);
        } else {
          query = query.lt(orderBy, nextCursor[orderBy])
            .or(`and(${orderBy}.eq.${nextCursor[orderBy]},${idField}.lt.${nextCursor[idField]})`);
        }
      }

      // Apply additional filters if provided
      if (additionalFilters) {
        query = additionalFilters(query);
      }

      const { data: result, error } = await query;

      if (error) throw error;

      const items = result || [];
      const hasMoreItems = items.length > limit;
      const displayItems = hasMoreItems ? items.slice(0, limit) : items;

      if (nextCursor) {
        setData(prev => [...prev, ...(displayItems as T[])]);
      } else {
        setData(displayItems as T[]);
      }

      setHasMore(hasMoreItems);
      
      if (displayItems.length > 0) {
        const lastItem = displayItems[displayItems.length - 1];
        setCursor({
          [orderBy]: lastItem[orderBy],
          [idField]: lastItem[idField]
        });
      }

    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [tableName, orderBy, ascending, idField, limit]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading && cursor) {
      loadPage(cursor);
    }
  }, [hasMore, isLoading, cursor, loadPage]);

  const reset = useCallback(() => {
    setData([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
  }, []);

  const refresh = useCallback((selectQuery?: string, additionalFilters?: (query: any) => any) => {
    reset();
    loadPage(undefined, selectQuery, additionalFilters);
  }, [reset, loadPage]);

  return {
    data,
    cursor,
    hasMore,
    isLoading,
    error,
    loadMore,
    reset,
    refresh
  };
}