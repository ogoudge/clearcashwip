import React from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { collection, addDoc, onSnapshot, Timestamp, deleteDoc, doc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { addEvent } from '../lib/firebase';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  dueDate: number;
  createdAt: Date;
}

export default function Subscriptions() {
  const [showForm, setShowForm] = React.useState(false);
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [formData, setFormData] = React.useState({
    name: '',
    amount: '',
    dueDate: '1'
  });

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'subscriptions'), (snapshot) => {
      const subsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Subscription[];
      
      setSubscriptions(subsList.sort((a, b) => a.dueDate - b.dueDate));
    });

    return () => unsubscribe();
  }, []);

  const createMonthlyBills = async (subscription: Subscription) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Create bills for the next 12 months
    for (let i = 0; i < 12; i++) {
      const billDate = new Date(currentYear, currentMonth + i, subscription.dueDate);
      
      if (billDate < today) continue;

      await addEvent({
        id: crypto.randomUUID(),
        title: `${subscription.name} Subscription`,
        date: billDate,
        amount: subscription.amount,
        type: 'bill',
        isRecurring: true,
        frequency: 'monthly',
        subscriptionId: subscription.id
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const subscriptionData = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        dueDate: parseInt(formData.dueDate),
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'subscriptions'), subscriptionData);
      await createMonthlyBills({ ...subscriptionData, id: docRef.id });

      setFormData({
        name: '',
        amount: '',
        dueDate: '1'
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding subscription:', error);
      alert('Failed to add subscription. Please try again.');
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (confirm('Are you sure you want to delete this subscription? This will also remove all associated calendar bills.')) {
      try {
        await deleteDoc(doc(db, 'subscriptions', id));
        
        const eventsRef = collection(db, 'events');
        const snapshot = await getDocs(query(eventsRef, where('subscriptionId', '==', id)));
        
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } catch (error) {
        console.error('Error deleting subscription:', error);
        alert('Failed to delete subscription. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <CreditCard className="w-6 h-6 mr-2" />
            Subscriptions
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subscription
          </button>
        </div>

        {showForm && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Subscription Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monthly Amount</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
                  Add Subscription
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{subscription.name}</h3>
                    <p className="text-sm text-gray-500">Due on day {subscription.dueDate} of each month</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-lg font-semibold text-gray-900">
                      ${subscription.amount.toFixed(2)}/mo
                    </div>
                    <button
                      onClick={() => handleDeleteSubscription(subscription.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {subscriptions.length === 0 && !showForm && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first subscription.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subscription
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}