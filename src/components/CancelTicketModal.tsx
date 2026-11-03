import React, { useState } from 'react';
import { 
  Ban, 
  ShieldAlert, 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  X,
  ArrowRight
} from 'lucide-react';
import { PassengerTicket, ConductorSession } from '../types/tim';
import { localDb } from '../services/db';
import { soundEffects } from '../services/soundEffects';

interface CancelTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ConductorSession;
  onTicketCancelled: (ticket: PassengerTicket) => void;
}

export const CancelTicketModal: React.FC<CancelTicketModalProps> = ({
  isOpen,
  onClose,
  session,
  onTicketCancelled
}) => {
  const [ticketSearch, setTicketSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<PassengerTicket | null>(null);
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('Conductor Keying Error (Wrong Stage)');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSearchTicket = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playKeyClick();
    setErrorMsg(null);

    const found = localDb.getTicketById(ticketSearch.trim());
    if (!found) {
      soundEffects.playErrorBuzz();
      setErrorMsg(`Ticket '${ticketSearch}' not found in local database.`);
      setSelectedTicket(null);
      return;
    }

    if (found.paymentStatus === 'CANCELLED') {
      soundEffects.playErrorBuzz();
      setErrorMsg(`Ticket '${found.ticketNumber}' is already CANCELLED at ${found.cancelledAt}.`);
      setSelectedTicket(null);
      return;
    }

    setSelectedTicket(found);
    soundEffects.playSuccess();
  };

  const handleConfirmCancellation = () => {
    if (!selectedTicket) return;
    setErrorMsg(null);

    // Verify Conductor or Supervisor PIN (accepts session.supervisorPin e.g. 9482 or conductor PIN 1234)
    if (pin !== session.supervisorPin && pin !== '1234' && pin !== '9482') {
      soundEffects.playErrorBuzz();
      setErrorMsg('Invalid Authorisation PIN. Please enter conductor PIN (1234) or Supervisor PIN (9482).');
      return;
    }

    soundEffects.playScannerBeep();
    const success = localDb.cancelTicket(selectedTicket.ticketId, reason, session.conductorId);

    if (success) {
      setIsSuccess(true);
      soundEffects.playSuccess();
      const updated = localDb.getTicketById(selectedTicket.ticketId);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedTicket(null);
        setPin('');
        setTicketSearch('');
        if (updated) onTicketCancelled(updated);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 font-sans">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Authorised Ticket Cancellation</h3>
              <p className="text-xs text-slate-400">Void transaction & update trip waybill</p>
            </div>
          </div>
          <button 
            onClick={() => { soundEffects.playKeyClick(); onClose(); }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">Ticket Successfully Cancelled</h4>
              <p className="text-xs text-slate-400 font-mono">Ledger and shift totals have been updated.</p>
            </div>
          ) : (
            <>
              {/* Ticket Search Bar */}
              <form onSubmit={handleSearchTicket} className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Enter Ticket Number or Unique ID:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. PV-839210 or TIM7052..."
                    value={ticketSearch}
                    onChange={e => setTicketSearch(e.target.value)}
                    required
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-rose-500 uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Lookup
                  </button>
                </div>
              </form>

              {/* Selected Ticket Preview Card */}
              {selectedTicket && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <span className="font-mono font-bold text-sm text-white">
                        {selectedTicket.ticketNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {selectedTicket.issueTimestamp}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-base text-rose-400">
                        {selectedTicket.fare.isZeroFare ? '₹0.00' : `₹${selectedTicket.fare.totalFare}`}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {selectedTicket.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 flex justify-between">
                    <span>{selectedTicket.fromStop.name} ➔ {selectedTicket.toStop.name}</span>
                    <span className="font-mono">{selectedTicket.passengers.adult} Adult</span>
                  </div>

                  {/* Reason selector */}
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Cancellation Reason:
                    </label>
                    <select
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                    >
                      <option value="Conductor Keying Error (Wrong Stage)">Conductor Keying Error (Wrong Stage)</option>
                      <option value="Passenger Alighted Prior to Departure">Passenger Alighted Prior to Departure</option>
                      <option value="Duplicate Ticket Issued Accidental">Duplicate Ticket Issued Accidental</option>
                      <option value="Payment Gateway Discrepancy">Payment Gateway Discrepancy</option>
                      <option value="Bus Breakdown / Route Terminated">Bus Breakdown / Route Terminated</option>
                    </select>
                  </div>

                  {/* Authorization PIN */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block flex items-center justify-between">
                      <span>Staff Authorization PIN</span>
                      <span className="text-[10px] text-slate-500 font-mono">Conductor: 1234 / Sup: 9482</span>
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pin}
                      placeholder="Enter 4-digit PIN"
                      onChange={e => setPin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-center tracking-widest text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <button
                    onClick={handleConfirmCancellation}
                    className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 cursor-pointer active:scale-98 transition-all"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Authorize & Void Ticket</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
          <span>APSRTC Audit Trail</span>
          <span>Supervisor Keystore v4.3</span>
        </div>
      </div>
    </div>
  );
};
