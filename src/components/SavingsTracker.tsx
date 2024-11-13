import React from 'react';
import { PiggyBank, TrendingUp, Calendar } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import useEvents from '../hooks/useEvents';

export default function SavingsTracker() {
  const { events } = useEvents();
  
  const getSavingsTransactions = () => {
    if (!events) return [];
    
    const today = startOfDay(new Date());
    
    return events
      .filter(event => 
        event.title === 'Savings' && 
        isBefore(event.date, today)
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const calculateTotalSavings = () => {
    return getSavingsTransactions().reduce((total, event) => total + event.amount, 0);
  };

  const savingsTransactions = getSavingsTransactions();
  const totalSavings = calculateTotalSavings();

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <PiggyBank className="w-6 h-6 mr-2" />
            Savings Tracker
          </h2>
        </div>

        {/* Total Savings Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Savings</p>
              <p className="text-3xl font-bold text-green-600">
                ${totalSavings.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Savings Transactions
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {savingsTransactions.map((transaction) => (
                <li key={transaction.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {format(transaction.date, 'MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-gray-500">
                          Automatic savings from payday
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      +${transaction.amount.toFixed(2)}
                    </div>
                  </div>
                </li>
              ))}

              {savingsTransactions.length === 0 && (
                <li className="px-4 py-12 text-center">
                  <PiggyBank className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No savings transactions yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start saving by enabling automatic savings on your paydays.
                  </p>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}