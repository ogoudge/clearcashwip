import React from 'react';
import { MessageSquare, Send, Clock, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import { collection, query, orderBy, updateDoc, doc, addDoc, Timestamp } from 'firebase/firestore';
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

export default function AdminSupport() {
  const { user } = useAuth();
  const [selectedTicket, setSelectedTicket] = React.useState<SupportTicket | null>(null);
  const [reply, setReply] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [loading, setLoading] = React.useState(false);

  // Use a simpler query and filter client-side
  const { data: tickets } = useCollection<SupportTicket>(
    query(
      collection(db, 'supportTickets'),
      orderBy('createdAt', 'desc')
    )
  );

  const filteredTickets = React.useMemo(() => {
    if (statusFilter === 'all') return tickets;
    return tickets?.filter((ticket) => ticket.status === statusFilter);
  }, [tickets, statusFilter]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const ticketRef = doc(db, 'supportTickets', ticketId);
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
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
        isAdmin: true
      };

      const ticketRef = doc(db, 'supportTickets', selectedTicket.id);
      await updateDoc(ticketRef, {
        responses: [...selectedTicket.responses, response],
        status: 'in-progress',
        updatedAt: Timestamp.now()
      });

      setReply('');
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
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'closed':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Support Tickets
          </h3>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Tickets</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {/* Tickets List */}
        <div className="space-y-2">
          {filteredTickets?.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`w-full text-left p-3 rounded-md transition-colors ${
                selectedTicket?.id === ticket.id
                  ? 'bg-indigo-50 border-indigo-500'
                  : 'hover:bg-gray-50 border-transparent'
              } border`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getStatusIcon(ticket.status)}
                  <span className="ml-2 font-medium">{ticket.subject}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {ticket.createdAt.toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">From: {ticket.userEmail}</p>
              <p className="text-sm text-gray-600 mt-1 truncate">{ticket.message}</p>
            </button>
          ))}

          {filteredTickets?.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets</h3>
              <p className="mt-1 text-sm text-gray-500">
                No support tickets match your current filter.
              </p>
            </div>
          )}
        </div>

        {/* Ticket Details */}
        <div className="md:col-span-2">
          {selectedTicket ? (
            <div className="h-full flex flex-col">
              <div className="border-b pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{selectedTicket.subject}</h3>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={loading}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  From: {selectedTicket.userEmail}
                </p>
                <p className="mt-2 text-gray-600">{selectedTicket.message}</p>
              </div>

              <div className="flex-1 overflow-y-auto mb-4">
                {selectedTicket.responses.map((response) => (
                  <div
                    key={response.id}
                    className={`mb-4 ${
                      response.isAdmin ? 'ml-8' : 'mr-8'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-lg ${
                        response.isAdmin
                          ? 'bg-indigo-50'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {response.isAdmin ? 'Admin' : response.userEmail}
                        </span>
                        <span className="text-sm text-gray-500">
                          {response.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{response.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleReply} className="mt-auto">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={!reply.trim() || loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No ticket selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a ticket from the list to view details and respond
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}