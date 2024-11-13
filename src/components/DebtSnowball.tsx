import React from 'react';
import { format, addMonths } from 'date-fns';
import { DollarSign, Plus, Trash2, ArrowDown, Snowflake, Calculator } from 'lucide-react';
import { collection, addDoc, onSnapshot, Timestamp, deleteDoc, doc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { addEvent } from '../lib/firebase';

interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: number;
  createdAt: Date;
}

export default function DebtSnowball() {
  const [showForm, setShowForm] = React.useState(false);
  const [debts, setDebts] = React.useState<Debt[]>([]);
  const [formData, setFormData] = React.useState({
    name: '',
    balance: '',
    interestRate: '',
    minimumPayment: '',
    dueDate: '1'
  });

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'debts'), (snapshot) => {
      const debtsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Debt[];
      
      // Sort by highest interest rate first
      setDebts(debtsList.sort((a, b) => b.interestRate - a.interestRate));
    });

    return () => unsubscribe();
  }, []);

  const createMonthlyBills = async (debt: Debt, months: number) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    for (let i = 0; i < months; i++) {
      const billDate = new Date(currentYear, currentMonth + i, debt.dueDate);
      
      if (billDate < today) continue;

      await addEvent({
        id: crypto.randomUUID(),
        title: `${debt.name} Payment`,
        date: billDate,
        amount: debt.minimumPayment,
        type: 'bill',
        isRecurring: false,
        debtId: debt.id
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const debtData = {
        name: formData.name,
        balance: parseFloat(formData.balance),
        interestRate: parseFloat(formData.interestRate),
        minimumPayment: parseFloat(formData.minimumPayment),
        dueDate: parseInt(formData.dueDate),
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'debts'), debtData);
      
      const monthlyInterestRate = (debtData.interestRate / 100) / 12;
      let remainingBalance = debtData.balance;
      let months = 0;

      while (remainingBalance > 0 && months <= 360) {
        const interestPayment = remainingBalance * monthlyInterestRate;
        const principalPayment = debtData.minimumPayment - interestPayment;
        remainingBalance = Math.max(0, remainingBalance - principalPayment);
        months++;
      }

      await createMonthlyBills({ ...debtData, id: docRef.id }, months);

      setFormData({
        name: '',
        balance: '',
        interestRate: '',
        minimumPayment: '',
        dueDate: '1'
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding debt:', error);
      alert('Failed to add debt. Please try again.');
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (confirm('Are you sure you want to delete this debt? This will also remove all associated calendar bills.')) {
      try {
        await deleteDoc(doc(db, 'debts', id));
        
        const eventsRef = collection(db, 'events');
        const snapshot = await getDocs(query(eventsRef, where('debtId', '==', id)));
        
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } catch (error) {
        console.error('Error deleting debt:', error);
        alert('Failed to delete debt. Please try again.');
      }
    }
  };

  const calculatePayoffDate = (debt: Debt) => {
    const monthlyInterestRate = (debt.interestRate / 100) / 12;
    let remainingBalance = debt.balance;
    let months = 0;

    while (remainingBalance > 0 && months <= 360) {
      const interestPayment = remainingBalance * monthlyInterestRate;
      const principalPayment = debt.minimumPayment - interestPayment;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);
      months++;
    }

    return addMonths(new Date(), months);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Snowflake className="w-6 h-6 mr-2" />
            Debt Snowball
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Debt
          </button>
        </div>

        {showForm && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Debt Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Balance</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                      className="block w-full pl-7 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Payment</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minimumPayment}
                      onChange={(e) => setFormData({ ...formData, minimumPayment: e.target.value })}
                      className="block w-full pl-7 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <select
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    {[...Array(31)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
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
                  Add Debt
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-6">
          {debts.map((debt) => (
            <div
              key={debt.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{debt.name}</h3>
                    <p className="text-sm text-gray-500">Due on day {debt.dueDate} of each month</p>
                  </div>
                  <button
                    onClick={() => handleDeleteDebt(debt.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Balance</div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${debt.balance.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Interest Rate</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {debt.interestRate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Monthly Payment</div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${debt.minimumPayment.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Estimated Payoff Date</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {format(calculatePayoffDate(debt), 'MMM yyyy')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {debts.length === 0 && !showForm && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Snowflake className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No debts</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first debt.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Debt
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}