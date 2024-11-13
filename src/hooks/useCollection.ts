import { useEffect, useState } from 'react';
import { Query, onSnapshot } from 'firebase/firestore';

interface UseCollectionReturn<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
}

export function useCollection<T>(query: Query | null): UseCollectionReturn<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      const unsubscribe = onSnapshot(
        query,
        (snapshot) => {
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            achievedAt: doc.data().achievedAt?.toDate(),
          })) as T[];
          
          setData(items);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Collection error:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Initial fetch error:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [query]);

  return { data, loading, error };
}