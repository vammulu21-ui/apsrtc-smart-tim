import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Printer, 
  Eye, 
  ArrowLeft, 
  Calendar, 
  IndianRupee, 
  Users, 
  CheckCircle2, 
  Ban, 
  FileText,
  RotateCw,
  Sparkles
} from 'lucide-react';
import { PassengerTicket } from '../types/tim';
import { localDb } from '../services/db';
import { soundEffects } from '../services/soundEffects';

interface TicketHistoryScreenProps {
  onBack: () => void;
  onViewDetails: (ticket: PassengerTicket) => void;
  onReprintTicket: (ticket: PassengerTicket) => void;
  lang: 'en' | 'te';
}

export const TicketHistoryScreen: React.FC<TicketHistoryScreenProps> = ({
  onBack,
  onViewDetails,
  onReprintTicket,
  lang
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'ZERO_FARE' | 'CANCELLED'>('ALL');
  const [tickets, setTickets] = useState<PassengerTicket[]>(() => localDb.getTickets());

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        t.ticketId.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.fromStop.name.toLowerCase().includes(q) ||
        t.toStop.name.toLowerCase().includes(q) ||
        t.routeNumber.includes(q);

      const matchesStatus = 
        filterStatus === 'ALL' ||
        (filterStatus === 'PAID' && t.paymentStatus === 'PAID') ||
        (filterStatus === 'ZERO_FARE' && t.paymentStatus === 'ZERO_FARE_EXEMPT') ||
        (filterStatus === 'CANCELLED' && t.paymentStatus === 'CANCELLED');

      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, filterStatus]);

  const handleReprint = (ticket: PassengerTicket) => {
    soundEffects.playPrinterFeed();
    const newCount = localDb.incrementReprintCount(ticket.ticketId);
    setTickets(localDb.getTickets());
    onReprintTicket({ ...ticket, reprintCount: newCount });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-y-auto p-3 sm:p-4 space-y-3 font-sans">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <button
          onClick={() => { soundEffects.playKeyClick(); onBack(); }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Back to Home</span>
        </button>
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-slate-200">
            Shift Ticket History ({tickets.length})
          </span>
        </div>
      </div>

      {/* Search Input & Status Filter Pills */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Ticket ID, Number, Stop name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {(['ALL', 'PAID', 'ZERO_FARE', 'CANCELLED'] as const).map(st => (
            <button
              key={st}
              onClick={() => { soundEffects.playKeyClick(); setFilterStatus(st); }}
              className={`py-1.5 px-3 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st === 'ALL' ? 'All Tickets' : st === 'PAID' ? 'Paid' : st === 'ZERO_FARE' ? 'Free Passes' : 'Cancelled'}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-2.5 flex-1">
        {filteredTickets.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-300">No matching tickets found</p>
            <p className="text-xs text-slate-500">Try adjusting your search terms or filter.</p>
          </div>
        ) : (
          filteredTickets.map(ticket => {
            const isCancelled = ticket.paymentStatus === 'CANCELLED';
            const isZeroFare = ticket.fare.isZeroFare || ticket.paymentStatus === 'ZERO_FARE_EXEMPT';

            return (
              <div
                key={ticket.ticketId}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCancelled
                    ? 'bg-rose-950/20 border-rose-900/40 opacity-75'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Upper ticket row */}
                <div className="flex items-start justify-between pb-2 border-b border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-white">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                        ({ticket.ticketId})
                      </span>
                      {ticket.reprintCount && ticket.reprintCount > 0 ? (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                          REPRINT x{ticket.reprintCount}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {ticket.issueTimestamp} • RT-{ticket.routeNumber}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-base font-black font-mono block ${
                      isCancelled
                        ? 'text-rose-400 line-through'
                        : isZeroFare
                        ? 'text-emerald-400'
                        : 'text-white'
                    }`}>
                      {isZeroFare ? '₹0.00' : `₹${ticket.fare.totalFare}`}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isCancelled
                        ? 'bg-rose-950 text-rose-300'
                        : isZeroFare
                        ? 'bg-emerald-950 text-emerald-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {ticket.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Journey route details */}
                <div className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-slate-200">{ticket.fromStop.name}</span>
                    <span className="text-slate-500">➔</span>
                    <span className="font-bold text-slate-200">{ticket.toStop.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono shrink-0">
                    {ticket.passengers.adult}A{ticket.passengers.child > 0 ? ` ${ticket.passengers.child}C` : ''} • {ticket.paymentMethod}
                  </div>
                </div>

                {/* Cancellation notice if cancelled */}
                {isCancelled && ticket.cancellationReason && (
                  <div className="text-[11px] text-rose-300 bg-rose-950/40 p-2 rounded-lg font-mono mb-2">
                    Cancelled: {ticket.cancellationReason} (by {ticket.cancelledByStaffId || 'Conductor'}) at {ticket.cancelledAt}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    onClick={() => { soundEffects.playKeyClick(); onViewDetails(ticket); }}
                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleReprint(ticket)}
                    className="py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Reprint</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
