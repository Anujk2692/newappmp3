import {useCallback, useEffect, useRef, useState} from 'react';
import {Alert} from 'react-native';
import {connectionErrorHint} from '../../../utils/serverConnection';
import {getCachedSearch, setCachedSearch} from '../../../utils/searchCache';
import {mediaApi} from '../api/mediaApi';
import type {MediaSearchResult} from '../domain/types';

export function useMediaSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);

  const search = useCallback(async (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim();
    if (!q || q.length < 2) {
      return;
    }

    const cached = getCachedSearch<MediaSearchResult[]>(q);
    if (cached) {
      setResults(cached);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const seq = ++seqRef.current;

    setLoading(true);
    try {
      const response = await mediaApi.search(q, controller.signal);
      if (seq !== seqRef.current) {
        return;
      }
      if (response.success) {
        const data = response.data || [];
        setResults(data);
        setCachedSearch(q, data);
      } else {
        Alert.alert('Search failed', response.message || 'Try again');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      if (seq === seqRef.current) {
        Alert.alert('Connection error', connectionErrorHint());
      }
    } finally {
      if (seq === seqRef.current) {
        setLoading(false);
      }
    }
  }, [query]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => search(query), 350);
    return () => clearTimeout(timer);
  }, [query, search]);

  return {query, setQuery, results, loading, search};
}
