import { Timestamp } from 'firebase/firestore';

export type EventType = 'payday' | 'bill' | 'adjustment';

export interface CalendarEvent {
  id: string;
  date: Date;
  amount: number;
  type: EventType;
  title: string;
  isRecurring?: boolean;
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  rescheduled?: boolean;
  savingsPercentage?: number;
  recurringGroupId?: string;
}

export interface DayCell {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  runningBalance: number;
}

export interface Trophy {
  id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  category: 'savings' | 'bills' | 'debt' | 'general';
  progress: number;
  target: number;
  achieved: boolean;
  achievedAt?: Date;
  createdAt: Date;
}

export type SupportTicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type SupportTicketType = 'help' | 'bug' | 'enhancement';

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  description: string;
  type: SupportTicketType;
  status: SupportTicketStatus;
  createdAt: Date;
  updatedAt: Date;
  unreadByUser?: boolean;
  unreadByAdmin?: boolean;
}

export interface TicketReply {
  id: string;
  ticketId: string;
  userId: string;
  userEmail: string;
  message: string;
  isAdmin: boolean;
  createdAt: Date;
}