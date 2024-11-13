import React from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, addMonths, subMonths, isBefore, isEqual } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, DollarSign, Receipt, Trash2, AlertCircle, Scale } from 'lucide-react';
import { CalendarEvent, DayCell } from '../types';
import EventModal from './EventModal';
import useEvents from '../hooks/useEvents';

export default function Calendar() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalEventType, setModalEventType] = React.useState<'payday' | 'bill' | 'adjustment' | null>(null);
  
  const { events, loading, error, deleteEvent } = useEvents();

  const calculateRunningBalance = (date: Date): number => {
    if (!events) return 0;
    return events
      .filter(event => isBefore(event.date, date) || isEqual(event.date, date))
      .reduce((balance, event) => {
        if (event.type === 'adjustment') {
          return event.amount; // Set balance to adjustment amount
        }
        return balance + (event.type === 'payday' ? event.amount : -event.amount);
      }, 0);
  };

  const getDaysInMonth = (date: Date): DayCell[] => {
    const start = startOfWeek(startOfMonth(date));
    const end = endOfWeek(endOfMonth(date));
    
    return eachDayOfInterval({ start, end }).map(day => ({
      date: day,
      events: events?.filter(event => 
        format(event.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      ) || [],
      isCurrentMonth: isSameMonth(day, date),
      runningBalance: calculateRunningBalance(day)
    }));
  };

  const days = getDaysInMonth(currentDate);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setModalEventType('bill');
    setIsModalOpen(true);
  };

  const handleEventTypeSelect = (type: 'payday' | 'bill' | 'adjustment') => {
    if (selectedDate) {
      setModalEventType(type);
    } else {
      setSelectedDate(new Date());
      setModalEventType(type);
      setIsModalOpen(true);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-600">Error: {error.message}</div>;
  }

  const monthlyIncome = events
    .filter(event => 
      event.type === 'payday' && 
      isSameMonth(event.date, currentDate)
    )
    .reduce((sum, event) => sum + event.amount, 0);

  const monthlyExpenses = events
    .filter(event => 
      event.type === 'bill' && 
      isSameMonth(event.date, currentDate)
    )
    .reduce((sum, event) => sum + event.amount, 0);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleEventTypeSelect('adjustment')}
              className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
            >
              <Scale className="w-4 h-4 mr-2" />
              Adjust Balance
            </button>
            <button
              onClick={() => handleEventTypeSelect('payday')}
              className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Add Payday
            </button>
            <button
              onClick={() => handleEventTypeSelect('bill')}
              className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Add Bill
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Monthly Income</h3>
            <p className="text-2xl font-bold text-green-600">${monthlyIncome.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Monthly Expenses</h3>
            <p className="text-2xl font-bold text-red-600">${monthlyExpenses.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Net Balance</h3>
            <p className={`text-2xl font-bold ${(monthlyIncome - monthlyExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(monthlyIncome - monthlyExpenses).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium">
              {day}
            </div>
          ))}
          
          {days.map((day, idx) => (
            <div
              key={idx}
              onClick={() => handleDateClick(day.date)}
              className={`min-h-[120px] p-2 bg-white ${
                day.isCurrentMonth ? 'hover:bg-gray-50' : 'bg-gray-50'
              } cursor-pointer transition-colors relative`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-sm ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                  {format(day.date, 'd')}
                </span>
                <span className={`text-xs font-medium ${
                  day.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${day.runningBalance.toFixed(2)}
                </span>
              </div>
              
              <div className="mt-2 space-y-1">
                {day.events.map((event) => (
                  <div
                    key={event.id}
                    className={`text-sm p-1 rounded group relative ${
                      event.type === 'payday'
                        ? 'bg-green-100 text-green-800'
                        : event.type === 'adjustment'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <div className="font-medium flex justify-between items-center">
                      <span className="flex items-center">
                        {event.title}
                        {event.rescheduled && (
                          <AlertCircle className="w-4 h-4 ml-1 text-amber-500" title="Rescheduled due to insufficient funds" />
                        )}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this event?')) {
                            deleteEvent(event.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 hover:text-red-600" />
                      </button>
                    </div>
                    <div>${event.amount.toFixed(2)}</div>
                    {event.isRecurring && (
                      <div className="text-xs text-gray-600">
                        Recurring ({event.frequency})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalEventType(null);
            setSelectedDate(null);
          }}
          date={selectedDate}
          eventType={modalEventType}
          onEventTypeChange={setModalEventType}
        />
      )}
    </div>
  );
}