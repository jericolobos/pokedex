import { useState, useEffect } from 'react';

export function usePokemonFetch<T = any>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState<number>(0);

  const refetch = () => setReloadToken((prev) => prev + 1);

  useEffect(() => {
    // REQ-5.1.3: Guard against race conditions and unmounted updates using AbortController
    const controller = new AbortController();
    
    setIsLoading(true);
    setError(null);

    async function fetchData() {
      try {
        const response = await fetch(url, { signal: controller.signal });
        
        // REQ-5.2.2: Handle non-2xx responses
        if (!response.ok) {
          throw new Error('Could not fetch data');
        }

        const json = await response.json();
        setData(json);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError("Couldn't load this Pokémon — check your connection and try again.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, [url, reloadToken]);

  return { data, isLoading, error, refetch };
}