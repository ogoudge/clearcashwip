import React from 'react';
import { format, parseISO, startOfDay, isBefore, isSameDay, addDays, isAfter } from 'date-fns';
import { X, DollarSign, Receipt, Split } from 'lucide-react';
import { EventType, CalendarEvent } from '../types';
import { addEvent as addFirebaseEvent, updateEvent as updateFirebaseEvent } from '../lib/firebase';
import useEvents from '../hooks/useEvents';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  eventType: EventType | null;
  onEventTypeChange: (type: EventType) => void;
  event?: CalendarEvent | null;
}

export default function EventModal({ isOpen, onClose, date, eventType, onEventTypeChange, event }: EventModalProps) {
  const { events } = useEvents();
  const [title, setTitle] = React.useState(event?.title || '');
  const [amount, setAmount] = React.useState(event?.amount.toString() || '');
  const [selectedDate, setSelectedDate] = React.useState(
    event?.date ? format(event.date, 'yyyy-MM-dd') : 
    date ? format(date, 'yyyy-MM-dd') : ''
  );
  const [isRecurring, setIsRecurring] = React.useState(event?.isRecurring || false);
  const [frequency, setFrequency] = React.useState<'weekly' | 'biweekly' | 'monthly' | 'yearly'>(
    event?.frequency || 'monthly'
  );
  const [showSplitOption, setShowSplitOption] = React.useState(false);
  const [savingsPercentage, setSavingsPercentage] = React.useState(event?.savingsPercentage || 10);
  const [createSavingsBill, setCreateSavingsBill] = React.useState(false);

  const createEventData = (
    overrides: Partial<CalendarEvent> = {}
  ): Omit<CalendarEvent, 'id'> => {
    const baseEvent = {
      date: startOfDay(parseISO(selectedDate)),
      amount: parseFloat(amount),
      type: eventType as EventType,
      title,
      isRecurring,
      ...(isRecurring && { frequency }), // Only include frequency if isRecurring is true
      ...(eventType === 'payday' && { savingsPercentage }), // Only include savingsPercentage for paydays
      ...overrides
    };

    // Remove undefined values to prevent Firebase validation errors
    return Object.fromEntries(
      Object.entries(baseEvent).filter(([_, value]) => value !== undefined)
    ) as Omit<CalendarEvent, 'id'>;
  };

  const findPaydaysBetweenDates = (startDate: Date, endDate: Date) => {
    return events
      ?.filter(event => 
        event.type === 'payday' &&
        !isBefore(event.date, startDate) &&
        !isAfter(event.date, endDate)
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime()) || [];
  };

  const handleSplitBill = async () => {
    if (!selectedDate || !amount) return;

    const dueDate = startOfDay(parseISO(selectedDate));
    const today = startOfDay(new Date());
    const paydays = findPaydaysBetweenDates(addDays(today, 1), dueDate);

    if (paydays.length === 0) {
      alert('No paydays found between now and the due date');
      return;
    }

    const splitAmount = parseFloat(amount) / paydays.length;

    // Create split payments aligned with paydays
    for (let i = 0; i < paydays.length; i++) {
      const splitEvent = createEventData({
        title: `${title} (Split ${i + 1}/${paydays.length})`,
        amount: splitAmount,
        type: 'bill',
        date: paydays[i].date // Use payday date for the split payment
      });
      
      await addFirebaseEvent({
        id: crypto.randomUUID(),
        ...splitEvent
      });
    }

    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !eventType) return;

    const eventData = createEventData();

    try {
      if (event) {
        await updateFirebaseEvent({
          id: event.id,
          ...eventData
        });
      } else {
        const newEvent = {
          id: crypto.randomUUID(),
          ...eventData
        };
        await addFirebaseEvent(newEvent);

        // Create savings bill if checkbox is checked for paydays
        if (eventType === 'payday' && createSavingsBill) {
          const savingsAmount = (parseFloat(amount) * savingsPercentage) / 100;
          const savingsEvent = createEventData({
            title: 'Savings',
            amount: savingsAmount,
            type: 'bill',
            date: startOfDay(parseISO(selectedDate)) // Same date as payday
          });
          
          await addFirebaseEvent({
            id: crypto.randomUUID(),
            ...savingsEvent
          });
        }
      }

      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    }
  };

  // Show split option for bills over $500
  React.useEffect(() => {
    if (eventType === 'bill' && parseFloat(amount) >= 500) {
      setShowSplitOption(true);
    } else {
      setShowSplitOption(false);
    }
  }, [amount, eventType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {event ? 'Edit Entry' : 'Add New Entry'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex space-x-4 mb-4">
            <button
              type="button"
              onClick={() => onEventTypeChange('payday')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md ${
                eventType === 'payday'
                  ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-green-50'
              }`}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Payday
            </button>
            <button
              type="button"
              onClick={() => onEventTypeChange('bill')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md ${
                eventType === 'bill'
                  ? 'bg-red-100 text-red-700 ring-2 ring-red-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-red-50'
              }`}
            >
              <Receipt className="w-4 h-4 mr-2" />
              Bill
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {eventType === 'payday' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Savings Percentage
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={savingsPercentage}
                    onChange={(e) => setSavingsPercentage(Number(e.target.value))}
                    className="block w-full rounded-md border-gray-300 pr-12 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
                {amount && (
                  <p className="mt-1 text-sm text-gray-500">
                    Savings amount: ${((parseFloat(amount) * savingsPercentage) / 100).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="createSavings"
                  checked={createSavingsBill}
                  onChange={(e) => setCreateSavingsBill(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="createSavings" className="ml-2 block text-sm text-gray-900">
                  Create savings bill automatically
                </label>
              </div>
            </>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="recurring" className="ml-2 block text-sm text-gray-900">
              Recurring Event
            </label>
          </div>

          {isRecurring && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}

          {showSplitOption && (
            <div className="pt-4">
              <button
                type="button"
                onClick={handleSplitBill}
                className="w-full flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100"
              >
                <Split className="w-4 h-4 mr-2" />
                Split Bill into Multiple Payments
              </button>
              <p className="mt-1 text-xs text-gray-500">
                This bill can be split into smaller payments based on your paydays
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {event ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}