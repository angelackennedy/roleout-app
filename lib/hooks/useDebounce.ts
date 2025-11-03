import { useState, useEffect } from 'react';

/**
 * Debounces a value by delaying updates until after the specified delay.
 * Useful for search queries to reduce API calls while user is typing.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for debounced search functionality.
 * Provides both the immediate value and debounced value.
 * 
 * @param initialValue - Initial search query
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 */
export function useDebouncedSearch(initialValue: string = '', delay: number = 300) {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const debouncedSearchQuery = useDebounce(searchQuery, delay);

  return {
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    isSearching: searchQuery !== debouncedSearchQuery,
  };
}
