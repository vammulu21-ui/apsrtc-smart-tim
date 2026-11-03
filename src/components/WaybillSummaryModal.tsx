import React from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  IndianRupee, 
  Users, 
  Bus, 
  CheckCircle, 
  X,
  CreditCard,
  Banknote,
  Sparkles
} from 'lucide-react';
import { ConductorSession } from '../types/tim';
import { localDb } from '../services/db';
import { soundEffects } from '../services/soundEffects';

interface WaybillSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ConductorSession;
  currentStage?: number;
}

export const WaybillSummaryModal: React.FC<WaybillSummaryModalProps> = ({
  isOpen,
  onClose,
  session,
  currentStage = 1
}) => {
  if (!isOpen) return null;

  const stats = localDb.getShiftStats();
  const tickets = localDb.getTickets().filter(t => t.waybillNumber === session.waybillNumber);

  const handlePrintSummary = () => {
    soundEffects.playPrinterFeed();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 font-sans">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Conductor Trip Waybill Ledger</h3>
              <p className="text-xs text-slate-400 font-mono">Waybill #{session.waybillNumber}</p>
            </div>
          </div>
          <button 
            onClick={() => { soundEffects.playKeyClick(); onClose(); }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block">Conductor:</span>
              <span className="font-bold text-slate-200">{session.conductorName} ({session.conductorId})</span>
            </div>
            <div>
              <span className="text-slate-400 block">Bus & Depot:</span>
              <span className="font-bold text-slate-200">{session.busNumber} • {session.depotCode}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Service Type:</span>
              <span className="font-bold text-emerald-400">{session.serviceType.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Current Bus Stage:</span>
              <span className="font-mono font-bold text-amber-400">STAGE {currentStage}</span>
            </div>
          </div>

          {/* Collection breakdown */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold block flex items-center justify-center gap-1">
                <Banknote className="w-3 h-3" /> Cash in Hand
              </span>
              <span className="text-xl font-black font-mono text-white mt-1 block">
                ₹{stats.totalCash}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-[10px] text-blue-400 uppercase font-semibold block flex items-center justify-center gap-1">
                <CreditCard className="w-3 h-3" /> Digital UPI
              </span>
              <span className="text-xl font-black font-mono text-white mt-1 block">
                ₹{stats.totalUpi}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-[10px] text-purple-400 uppercase font-semibold block">
                Total Collection
              </span>
              <span className="text-xl font-black font-mono text-purple-300 mt-1 block">
                ₹{stats.totalRevenue}
              </span>
            </div>
          </div>

          {/* Passenger demographics */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Shift Passenger Count Summary</span>
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Total Pax</span>
                <span className="font-mono font-bold text-white text-base">{stats.totalPassengers}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Adults</span>
                <span className="font-mono font-bold text-slate-200 text-base">{stats.totalAdults}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Children</span>
                <span className="font-mono font-bold text-slate-200 text-base">{stats.totalChildren}</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60">
                <span className="text-[10px] text-emerald-400 uppercase block">Zero-Fare</span>
                <span className="font-mono font-bold text-emerald-400 text-base">{stats.totalZeroFarePassengers}</span>
              </div>
            </div>
          </div>

          {/* Recent Tickets in Shift */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Issued Tickets in Waybill ({tickets.length})
            </h4>
            {tickets.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
                No tickets issued yet for this waybill.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tickets.slice(0, 10).map(t => (
                  <div
                    key={t.ticketId}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-white">{t.ticketNumber}</span>
                      <span className="text-slate-400 text-[11px] ml-2">
                        {t.fromStop.name} ➔ {t.toStop.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400">
                        {t.fare.isZeroFare ? '₹0 (Mahila)' : `₹${t.fare.totalFare}`}
                      </span>
                      <span className="text-[10px] text-slate-500 block">{t.paymentMethod}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
          <button
            onClick={handlePrintSummary}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Print Shift Closing Report
          </button>
          <button
            onClick={() => { soundEffects.playKeyClick(); onClose(); }}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
