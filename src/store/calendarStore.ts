import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CalendarEvent } from '../types';
import { addWeeks, addMonths, addYears, addDays, isBefore, isAfter, isSameDay, parseISO } from 'date-fns';

const ensureDateObject = (date: Date | string): Date => {
  if (date instanceof Date) return date;
  return parseISO(date as string);
};

const generateRecurringEvents = (event: CalendarEvent, numberOfOccurrences = 12): CalendarEvent[] => {
  if (!event.isRecurring || !event.frequency) return [event];

  const events: CalendarEvent[] = [];
  let currentDate = ensureDateObject(event.date);

  for (let i = 0; i < numberOfOccurrences; i++) {
    const newEvent = {
      ...event,
      id: i === 0 ? event.id : crypto.randomUUID(),
      date: currentDate,
    };
    events.push(newEvent);

    switch (event.frequency) {
      case 'weekly':
        currentDate = addWeeks(currentDate, 1);
        break;
      case 'biweekly':
        currentDate = addWeeks(currentDate, 2);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, 1);
        break;
      case 'yearly':
        currentDate = addYears(currentDate, 1);
        break;
    }
  }

  return events;
};

const calculateBalanceAtDate = (events: CalendarEvent[], date: Date): number => {
  const targetDate = ensureDateObject(date);
  return events
    .filter(event => {
      const eventDate = ensureDateObject(event.date);
      return isBefore(eventDate, targetDate) || isSameDay(eventDate, targetDate);
    })
    .reduce((balance, event) => 
      balance + (event.type === 'payday' ? event.amount : -event.amount)
    , 0);
};

const findNextViablePayday = (
  events: CalendarEvent[],
  billDate: Date,
  billAmount: number,
  oneMonthLimit: Date
): Date | null => {
  const targetBillDate = ensureDateObject(billDate);
  const limitDate = ensureDateObject(oneMonthLimit);
  
  const paydays = events
    .filter(event => {
      const eventDate = ensureDateObject(event.date);
      return event.type === 'payday' && 
        (isAfter(eventDate, targetBillDate) || isSameDay(eventDate, targetBillDate)) &&
        isBefore(eventDate, limitDate);
    })
    .sort((a, b) => {
      const dateA = ensureDateObject(a.date);
      const dateB = ensureDateObject(b.date);
      return dateA.getTime() - dateB.getTime();
    });

  for (const payday of paydays) {
    const balanceAfterPayday = calculateBalanceAtDate(events, payday.date);
    if (balanceAfterPayday >= billAmount) {
      return ensureDateObject(payday.date);
    }
  }

  return null;
};

const rescheduleBillsIfNeeded = (events: CalendarEvent[]): CalendarEvent[] => {
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = ensureDateObject(a.date);
    const dateB = ensureDateObject(b.date);
    return dateA.getTime() - dateB.getTime();
  });
  
  const rescheduledEvents: CalendarEvent[] = [];

  for (const event of sortedEvents) {
    if (event.type === 'bill' && !event.rescheduled) {
      const currentBalance = calculateBalanceAtDate(rescheduledEvents, event.date);
      
      if (currentBalance < event.amount) {
        const oneMonthLimit = addMonths(ensureDateObject(event.date), 1);
        const nextViableDate = findNextViablePayday(
          sortedEvents,
          event.date,
          event.amount,
          oneMonthLimit
        );

        if (nextViableDate) {
          rescheduledEvents.push({
            ...event,
            date: nextViableDate,
            rescheduled: true
          });
          continue;
        }
      }
    }
    rescheduledEvents.push(event);
  }

  return rescheduledEvents;
};

interface CalendarStore {
  events: CalendarEvent[];
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (eventId: string) => void;
  deleteRecurringEvent: (eventId: string, title: string) => void;
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (event) =>
        set((state) => {
          const eventWithDateObject = {
            ...event,
            date: ensureDateObject(event.date)
          };
          const newEvents = generateRecurringEvents(eventWithDateObject);
          const allEvents = [...state.events, ...newEvents];
          const rescheduledEvents = rescheduleBillsIfNeeded(allEvents);
          return { events: rescheduledEvents };
        }),
      updateEvent: (updatedEvent) =>
        set((state) => {
          const eventWithDateObject = {
            ...updatedEvent,
            date: ensureDateObject(updatedEvent.date)
          };
          const updatedEvents = state.events.map((event) =>
            event.id === eventWithDateObject.id ? eventWithDateObject : event
          );
          const rescheduledEvents = rescheduleBillsIfNeeded(updatedEvents);
          return { events: rescheduledEvents };
        }),
      deleteEvent: (eventId) =>
        set((state) => {
          const filteredEvents = state.events.filter((event) => event.id !== eventId);
          const rescheduledEvents = rescheduleBillsIfNeeded(filteredEvents);
          return { events: rescheduledEvents };
        }),
      deleteRecurringEvent: (eventId, title) =>
        set((state) => {
          const filteredEvents = state.events.filter((event) => 
            !(event.title === title && event.isRecurring)
          );
          const rescheduledEvents = rescheduleBillsIfNeeded(filteredEvents);
          return { events: rescheduledEvents };
        }),
    }),
    {
      name: 'calendar-store',
    }
  )
);