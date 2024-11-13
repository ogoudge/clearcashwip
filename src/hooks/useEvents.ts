import { useState, useEffect } from 'react';
import { collection, onSnapshot, Timestamp, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { CalendarEvent } from '../types';
import { isAfter, isSameDay } from 'date-fns';

export const useEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setEvents([]);
      setLoading(false);
      return;
    }

    // Only fetch events for the current user
    const eventsQuery = query(
      collection(db, 'events'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        try {
          const eventsList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              date: data.date instanceof Timestamp ? 
                data.date.toDate() : 
                new Date(data.date),
              createdAt: data.createdAt?.toDate?.() || null,
              updatedAt: data.updatedAt?.toDate?.() || null
            } as CalendarEvent;
          });
          setEvents(eventsList);
          setLoading(false);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to process events'));
          setLoading(false);
        }
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const redistributeSplitPayments = async (event: CalendarEvent) => {
    // Check if this is a split payment by looking for "(Split X/Y)" in the title
    const splitMatch = event.title.match(/\(Split (\d+)\/(\d+)\)/);
    if (!splitMatch) return;

    const [_, currentSplit, totalSplits] = splitMatch;
    const baseTitle = event.title.replace(/\(Split \d+\/\d+\)/, '').trim();

    // Find all related split payments that occur after the deleted split
    const remainingSplits = events.filter(e => 
      e.id !== event.id && 
      e.title.startsWith(baseTitle) && 
      e.title.includes('(Split') &&
      (isAfter(e.date, event.date) || isSameDay(e.date, event.date))
    ).sort((a, b) => a.date.getTime() - b.date.getTime());

    if (remainingSplits.length === 0) return;

    // Calculate new amount per split
    const newAmountPerSplit = event.amount + (event.amount / remainingSplits.length);

    // Update remaining split payments
    for (let i = 0; i < remainingSplits.length; i++) {
      const split = remainingSplits[i];
      const newTitle = `${baseTitle} (Split ${i + 1}/${remainingSplits.length})`;
      
      try {
        await updateDoc(doc(db, 'events', split.id), {
          title: newTitle,
          amount: newAmountPerSplit,
          updatedAt: Timestamp.now()
        });
      } catch (err) {
        console.error('Error updating split payment:', err);
      }
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const eventToDelete = events.find(e => e.id === eventId);
      if (eventToDelete) {
        await redistributeSplitPayments(eventToDelete);
      }
      await deleteDoc(doc(db, 'events', eventId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete event'));
    }
  };

  return { events, loading, error, deleteEvent };
};

export default useEvents;