import React from 'react';
import { MessageSquare, Send, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { collection, addDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useCollection } from '../hooks/useCollection';

interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  responses: {
    id: string;
    userId: string;
    userEmail: string;
    message: string;
    createdAt: Date;
    isAdmin: boolean;
  }[];
}

export default function Support() {
  const { user } = useAuth();
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [selectedTicket, setSelectedTicket] = React.useState<SupportTicket | null>(null);
  const [reply, setReply] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const ticketsQuery = React.useMemo(() => {
    if (!user?.uid) return null;
    
    // Simple query without composite index requirement
    return query(
      collection(db, 'supportTickets'),
      where('userId', '==', user.uid)
    );
  }, [user?.uid]);

  const { data: tickets, loading: ticketsLoading, error: ticketsError } = useCollection<SupportTicket>(ticketsQuery);

  // Sort tickets client-side instead of using orderBy in query
  const sortedTickets = React.useMemo(() => {
    return [...(tickets || [])].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [tickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const ticketData = {
        userId: user.uid,
        userEmail: user.email,
        subject,
        message,
        status: 'open',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        responses: []
      };

      await addDoc(collection(db, 'supportTickets'), ticketData);
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket) return;

    setLoading(true);
    try {
      const response = {
        id: crypto.randomUUID(),
        userId: user.uid,
        userEmail: user.email,
        message: reply,
        createdAt: Timestamp.now(),
        isAdmin: false
      };

      const ticketRef = collection(db, 'supportTickets');
      await addDoc(ticketRef, {
        ...selectedTicket,
        responses: [...selectedTicket.responses, response],
        updatedAt: Timestamp.now()
      });

      setReply('');
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'in-progress':
        return <AlertTriangle className="w-5 h-5 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'closed':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">Please sign in to access support.</p>
      </div>
    );
  }

  if (ticketsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (ticketsError) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Tickets</h3>
        <p className="mt-1 text-sm text-red-500">{ticketsError.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2" />
            Support
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* New Ticket Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Support Ticket</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Tickets List */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Your Tickets</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {sortedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{ticket.subject}</span>
                      {getStatusIcon(ticket.status)}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{ticket.message}</p>
                    <div className="mt-2 text-xs text-gray-400">
                      {ticket.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {sortedTickets.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No tickets yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Ticket Detail */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedTicket.subject}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedTicket.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedTicket.message}</p>
                </div>

                {selectedTicket.responses.map((response) => (
                  <div
                    key={response.id}
                    className={`p-4 rounded-lg ${
                      response.isAdmin ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {response.isAdmin ? 'Support Team' : response.userEmail}
                      </span>
                      <span className="text-xs text-gray-500">
                        {response.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{response.message}</p>
                  </div>
                ))}

                <form onSubmit={handleReply} className="mt-4">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}