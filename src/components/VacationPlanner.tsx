import React from 'react';
import { format, differenceInDays, addDays, isBefore, isAfter, isSameDay, parseISO } from 'date-fns';
import { Plane, Calendar, DollarSign, PiggyBank, Plus } from 'lucide-react';
import { collection, addDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useEvents from '../hooks/useEvents';
import { addEvent } from '../lib/firebase';

interface VacationPlan {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  estimatedCost: number;
  savingsGoal: number;
  notes: string;
}

export default function VacationPlanner() {
  const [showForm, setShowForm] = React.useState(false);
  const [plans, setPlans] = React.useState<VacationPlan[]>([]);
  const { events } = useEvents();
  
  const [formData, setFormData] = React.useState({
    destination: '',
    startDate: '',
    endDate: '',
    estimatedCost: '',
    notes: ''
  });

  // Subscribe to vacation plans from Firebase
  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'vacationPlans'), (snapshot) => {
      const plansList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VacationPlan[];
      setPlans(plansList);
    });

    return () => unsubscribe();
  }, []);

  const findPaydaysBetweenDates = (startDate: Date, endDate: Date) => {
    if (!events) return [];
    
    return events
      .filter(event => 
        event.type === 'payday' &&
        (isAfter(event.date, startDate) || isSameDay(event.date, startDate)) &&
        (isBefore(event.date, endDate) || isSameDay(event.date, endDate))
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Save vacation plan to Firebase
      const planData = {
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        estimatedCost: parseFloat(formData.estimatedCost),
        savingsGoal: parseFloat(formData.estimatedCost),
        notes: formData.notes,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'vacationPlans'), planData);

      // Find all paydays between today and vacation start date
      const today = new Date();
      const startDate = parseISO(formData.startDate);
      const paydays = findPaydaysBetweenDates(today, startDate);

      if (paydays.length === 0) {
        alert('No paydays found before the vacation start date. Please add some paydays first.');
        return;
      }

      // Calculate amount per payday
      const amountPerPayday = parseFloat(formData.estimatedCost) / paydays.length;
      const recurringGroupId = crypto.randomUUID(); // Group ID to link all split payments

      // Create a savings bill for each payday
      for (let i = 0; i < paydays.length; i++) {
        await addEvent({
          id: crypto.randomUUID(),
          title: `Vacation - ${formData.destination} (Split ${i + 1}/${paydays.length})`,
          date: paydays[i].date,
          amount: amountPerPayday,
          type: 'bill',
          isRecurring: false,
          recurringGroupId, // Link all splits together
          vacationPlanId: docRef.id // Reference to the vacation plan
        });
      }

      setFormData({
        destination: '',
        startDate: '',
        endDate: '',
        estimatedCost: '',
        notes: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error saving vacation plan:', error);
      alert('Failed to save vacation plan. Please try again.');
    }
  };

  const calculateCurrentSavings = (plan: VacationPlan) => {
    if (!events) return 0;
    
    return events
      .filter(event => 
        event.title.includes(`Vacation - ${plan.destination}`) &&
        event.type === 'bill'
      )
      .reduce((total, event) => total + event.amount, 0);
  };

  const calculateProgress = (plan: VacationPlan) => {
    const currentSavings = calculateCurrentSavings(plan);
    return Math.min((currentSavings / plan.estimatedCost) * 100, 100);
  };

  const getDaysUntilVacation = (startDate: string) => {
    const today = new Date();
    const vacationStart = parseISO(startDate);
    const days = differenceInDays(vacationStart, today);
    return Math.max(0, days);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Plane className="w-6 h-6 mr-2" />
            Vacation Planner
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vacation
          </button>
        </div>

        {showForm && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Destination</label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Cost</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                    className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Save Vacation Plan
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              <div className="bg-indigo-600 px-4 py-3 text-white">
                <div className="text-lg font-bold">{plan.destination}</div>
                <div className="text-sm">
                  {format(parseISO(plan.startDate), 'MMM d')} - {format(parseISO(plan.endDate), 'MMM d, yyyy')}
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    Days Until Trip
                  </div>
                  <span className="font-medium">{getDaysUntilVacation(plan.startDate)} days</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Estimated Cost
                  </div>
                  <span className="font-medium">${plan.estimatedCost.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <PiggyBank className="w-4 h-4 mr-1" />
                      Savings Progress
                    </div>
                    <span className="font-medium">
                      ${calculateCurrentSavings(plan).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${calculateProgress(plan)}%` }}
                    />
                  </div>
                </div>

                {plan.notes && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Notes:</p>
                    <p>{plan.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {plans.length === 0 && !showForm && (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
              <Plane className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No vacation plans</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new vacation plan.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vacation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}