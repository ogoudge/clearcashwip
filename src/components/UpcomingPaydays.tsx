import React from 'react';
import { format, isAfter, isSameDay, isBefore } from 'date-fns';
import { CalendarCheck, ArrowRight, TrendingUp } from 'lucide-react';
import useEvents from '../hooks/useEvents';

export default function UpcomingPaydays() {
  const { events, loading, error } = useEvents();

  const calculateRunningBalance = (date: Date): number => {
    if (!events) return 0;
    return events
      .filter(event => isBefore(event.date, date) || isSameDay(event.date, date))
      .reduce((balance, event) => {
        if (event.type === 'adjustment') {
          return event.amount;
        }
        return balance + (event.type === 'payday' ? event.amount : -event.amount);
      }, 0);
  };

  const getUpcomingPaydays = () => {
    if (!events) return [];
    
    const today = new Date();
    const paydays = events
      .filter(event => 
        event.type === 'payday' && 
        (isAfter(event.date, today) || isSameDay(event.date, today))
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 4);

    return paydays.map(payday => {
      const associatedBills = events.filter(event => 
        event.type === 'bill' &&
        isSameDay(event.date, payday.date)
      );

      return {
        payday,
        bills: associatedBills,
        runningBalance: calculateRunningBalance(payday.date)
      };
    });
  };

  const calculateNetAmount = (payday: any) => {
    const totalBills = payday.bills.reduce((sum: number, bill: any) => sum + bill.amount, 0);
    return payday.payday.amount - totalBills;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error.message}</div>;
  }

  const upcomingPaydays = getUpcomingPaydays();

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <CalendarCheck className="w-6 h-6 mr-2" />
          Upcoming Paydays
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {upcomingPaydays.map(({ payday, bills, runningBalance }) => (
            <div
              key={payday.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
            >
              {/* Payday Header */}
              <div className="bg-indigo-600 px-4 py-3">
                <div className="text-white">
                  <div className="text-sm font-medium">Payday</div>
                  <div className="text-lg font-bold">{format(payday.date, 'MMM d, yyyy')}</div>
                </div>
                <div className="mt-1 text-indigo-100 text-sm">
                  Amount: ${payday.amount.toFixed(2)}
                </div>
              </div>

              {/* Running Balance */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Running Balance
                  </div>
                  <span className={`font-medium ${
                    runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${runningBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Bills Section */}
              <div className="px-4 py-3">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Bills Due ({bills.length})
                </h4>
                <div className="space-y-2">
                  {bills.map(bill => (
                    <div
                      key={bill.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-700">{bill.title}</span>
                      <span className="text-red-600 font-medium">
                        -${bill.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {bills.length === 0 && (
                    <div className="text-sm text-gray-500 italic">
                      No bills due
                    </div>
                  )}
                </div>
              </div>

              {/* Net Amount */}
              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Net Amount</span>
                  <span className={`text-lg font-bold ${
                    calculateNetAmount({ payday, bills }) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    ${calculateNetAmount({ payday, bills }).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {upcomingPaydays.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No upcoming paydays found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}