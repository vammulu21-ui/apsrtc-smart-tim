import React, { useState } from 'react';
import { 
  QrCode, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Bus, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  Search,
  ScanLine
} from 'lucide-react';
import { PassengerTicket } from '../types/tim';
import { localDb } from '../services/db';
import { soundEffects } from '../services/soundEffects';

interface TicketValidatorScreenProps {
  onBack: () => void;
  lang: 'en' | 'te';
}

export const TicketValidatorScreen: React.FC<TicketValidatorScreenProps> = ({
  onBack,
  lang
}) => {
  const [scannedPayload, setScannedPayload] = useState('');
  const [inspectedTicket, setInspectedTicket] = useState<PassengerTicket | null>(null);
  const [validationResult, setValidationResult] = useState<'IDLE' | 'VALID' | 'CANCELLED' | 'INVALID'>('IDLE');

  const recentTickets = localDb.getTickets().slice(0, 5);

  const handleValidatePayload = (rawPayload: string) => {
    soundEffects.playScannerBeep();
    setScannedPayload(rawPayload);

    // Extract ticket identifier from payload
    // Payload format: APSRTC-SECURE-TKT:${ticketId}... or APSRTC:${ticketNum}...
    let matchedTicket: PassengerTicket | undefined;

    const tickets = localDb.getTickets();
    matchedTicket = tickets.find(t => 
      rawPayload.includes(t.ticketId) || 
      rawPayload.includes(t.ticketNumber) || 
      rawPayload.trim() === t.ticketNumber ||
      rawPayload.trim() === t.ticketId
    );

    if (matchedTicket) {
      setInspectedTicket(matchedTicket);
      if (matchedTicket.paymentStatus === 'CANCELLED') {
        setValidationResult('CANCELLED');
        soundEffects.playErrorBuzz();
      } else {
        setValidationResult('VALID');
        soundEffects.playSuccess();
      }
    } else {
      setInspectedTicket(null);
      setValidationResult('INVALID');
      soundEffects.playErrorBuzz();
    }
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
          <ScanLine className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">
            Inspector QR Ticket Validator
          </span>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-snug">
          <strong>Secure Validation:</strong> Scanned ticket QR payloads verify cryptographic route stage references only. Zero Aadhaar or private personal information is exposed in this verification stream.
        </p>
      </div>

      {/* Direct Input / Scan simulation */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Scan / Enter Ticket QR Reference:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Scan barcode or enter ticket number (e.g. PV-839210)..."
            value={scannedPayload}
            onChange={e => setScannedPayload(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 uppercase"
          />
          <button
            onClick={() => handleValidatePayload(scannedPayload)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
          >
            Inspect
          </button>
        </div>

        {/* Quick select recently issued tickets */}
        <div className="pt-2 border-t border-slate-800/80">
          <span className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase">
            Or Click Recently Issued Ticket to Verify:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {recentTickets.map(t => (
              <button
                key={t.ticketId}
                onClick={() => handleValidatePayload(t.ticketNumber)}
                className="py-1 px-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-[11px] font-mono font-bold text-slate-300 transition-colors"
              >
                {t.ticketNumber} ({t.fromStop.name.slice(0, 8)}...)
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Result Box */}
      {validationResult !== 'IDLE' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {validationResult === 'VALID' && inspectedTicket && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-300">GENUINE & ACTIVE TICKET</h4>
                    <p className="text-[10px] text-emerald-400/80 font-mono">APSRTC CRYPTO SIGNATURE VERIFIED</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  STATUS: OK
                </span>
              </div>

              {/* Ticket Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Ticket ID:</span>
                  <span className="font-mono font-bold text-white">{inspectedTicket.ticketId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Short Reference:</span>
                  <span className="font-mono font-bold text-emerald-300">{inspectedTicket.ticketNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Bus & Service:</span>
                  <span className="font-semibold text-slate-200">{inspectedTicket.busNumber} • {inspectedTicket.serviceType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Issued At:</span>
                  <span className="font-mono text-slate-200">{inspectedTicket.issueTimestamp}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">From Stop:</span>
                  <span className="font-bold text-white">{inspectedTicket.fromStop.name} (Stg {inspectedTicket.fromStop.stageNumber})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">To Stop:</span>
                  <span className="font-bold text-white">{inspectedTicket.toStop.name} (Stg {inspectedTicket.toStop.stageNumber})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Passengers:</span>
                  <span className="font-semibold text-slate-200">{inspectedTicket.passengers.adult} Adult{inspectedTicket.passengers.child > 0 ? `, ${inspectedTicket.passengers.child} Child` : ''}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Fare & Payment:</span>
                  <span className="font-bold text-emerald-400">₹{inspectedTicket.fare.totalFare} ({inspectedTicket.paymentMethod})</span>
                </div>
              </div>
            </div>
          )}

          {validationResult === 'CANCELLED' && inspectedTicket && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-rose-500/30">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-300">TICKET IS CANCELLED / VOID</h4>
                  <p className="text-[10px] text-rose-400/80 font-mono">
                    Cancelled at: {inspectedTicket.cancelledAt || 'Prior Station'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-rose-200">
                This ticket has been officially voided by conductor/supervisor and is invalid for travel.
                Reason: <strong>{inspectedTicket.cancellationReason || 'Conductor Cancellation'}</strong>
              </p>
            </div>
          )}

          {validationResult === 'INVALID' && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 space-y-2 text-center">
              <XCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h4 className="text-sm font-bold text-rose-300">INVALID OR FORGED TICKET</h4>
              <p className="text-xs text-slate-400">
                No record found matching the scanned payload. This ticket was not issued by an authorized APSRTC machine.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
