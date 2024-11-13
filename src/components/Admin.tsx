import React from 'react';
import { Shield, UserPlus, Key, Trash2, AlertCircle, Mail, CheckCircle, XCircle, DollarSign, Users, Receipt, PiggyBank, Settings, UserCheck } from 'lucide-react';
import { collection, onSnapshot, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db, createUser, resetUserPassword, deleteUserAccount } from '../lib/firebase';

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  status: 'pending' | 'active' | 'rejected';
  createdAt: Date;
}

interface SystemSettings {
  requireApproval: boolean;
}

export default function Admin() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [systemSettings, setSystemSettings] = React.useState<SystemSettings>({
    requireApproval: true
  });
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    isAdmin: false
  });
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    totalBillsPaid: 0,
    totalSavings: 0,
    activeUsers: 0
  });

  React.useEffect(() => {
    // Subscribe to users collection
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as User[];
      
      setUsers(usersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setStats(prev => ({
        ...prev,
        totalUsers: usersList.length,
        activeUsers: usersList.filter(u => u.status === 'active').length
      }));
    });

    // Subscribe to system settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'system'), (doc) => {
      if (doc.exists()) {
        setSystemSettings(doc.data() as SystemSettings);
      }
    });

    // Calculate total bills paid and savings
    const calculateStats = async () => {
      const eventsRef = collection(db, 'events');
      const billsSnapshot = await getDocs(query(eventsRef, where('type', '==', 'bill')));
      const savingsSnapshot = await getDocs(query(eventsRef, where('title', '==', 'Savings')));

      setStats(prev => ({
        ...prev,
        totalBillsPaid: billsSnapshot.size,
        totalSavings: savingsSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0)
      }));
    };

    calculateStats();

    return () => {
      unsubscribeUsers();
      unsubscribeSettings();
    };
  }, []);

  const showMessage = (message: string, isError: boolean = false) => {
    if (isError) {
      setError(message);
      setSuccess(null);
    } else {
      setSuccess(message);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createUser(formData.email, formData.password);
      showMessage('User created successfully');
      setFormData({ email: '', password: '', isAdmin: false });
      setShowCreateForm(false);
    } catch (error) {
      showMessage((error as Error).message, true);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await resetUserPassword(email);
      showMessage('Password reset email sent');
    } catch (error) {
      showMessage((error as Error).message, true);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (confirm(`Are you sure you want to delete user ${email}?`)) {
      try {
        await deleteUserAccount(userId);
        showMessage('User deleted successfully');
      } catch (error) {
        showMessage((error as Error).message, true);
      }
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'active',
        updatedAt: Timestamp.now()
      });
      showMessage('User approved successfully');
    } catch (error) {
      showMessage((error as Error).message, true);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'rejected',
        updatedAt: Timestamp.now()
      });
      showMessage('User rejected successfully');
    } catch (error) {
      showMessage((error as Error).message, true);
    }
  };

  const toggleApprovalRequirement = async () => {
    try {
      await updateDoc(doc(db, 'settings', 'system'), {
        requireApproval: !systemSettings.requireApproval
      });
      showMessage('Settings updated successfully');
    } catch (error) {
      showMessage((error as Error).message, true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* System Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            System Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Bills Paid</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBillsPaid}</p>
                </div>
                <Receipt className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Savings</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalSavings.toFixed(2)}</p>
                </div>
                <PiggyBank className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            System Settings
          </h2>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">New User Approval</h3>
                <p className="text-sm text-gray-500">
                  Require admin approval for new user registrations
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={systemSettings.requireApproval}
                  onChange={toggleApprovalRequirement}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Access Requests Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <UserCheck className="w-6 h-6 mr-2" />
            Access Requests
          </h2>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="divide-y divide-gray-200">
              {users
                .filter(user => user.status === 'pending')
                .map((user) => (
                  <div key={user.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{user.email}</h3>
                        <p className="text-sm text-gray-500">
                          Requested: {user.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleApproveUser(user.id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectUser(user.id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {users.filter(user => user.status === 'pending').length === 0 && (
                <div className="p-6 text-center">
                  <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    All user access requests have been processed
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="w-6 h-6 mr-2" />
              User Management
            </h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </button>
          </div>

          {(error || success) && (
            <div className={`mb-4 p-4 rounded-md ${
              error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <p>{error || success}</p>
              </div>
            </div>
          )}

          {showCreateForm && (
            <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                    minLength={6}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={formData.isAdmin}
                    onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-900">
                    Admin User
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {users
                .filter(user => user.status === 'active')
                .map((user) => (
                <li key={user.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{user.email}</h3>
                      <p className="text-sm text-gray-500">
                        Created: {user.createdAt.toLocaleDateString()}
                        {user.isAdmin && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Admin
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleResetPassword(user.email)}
                        className="flex items-center px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        <Key className="w-4 h-4 mr-1" />
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}

              {users.filter(user => user.status === 'active').length === 0 && (
                <li className="px-6 py-12 text-center">
                  <Shield className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No active users</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}