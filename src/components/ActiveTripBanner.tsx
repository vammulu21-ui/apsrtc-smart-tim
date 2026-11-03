import React from 'react';
import { 
  Bus, 
  MapPin, 
  Navigation, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  StopCircle, 
  FileEdit,
  Sparkles
} from 'lucide-react';
import { ActiveTrip } from '../types/tim';
import { soundEffects } from '../services/soundEffects';

interface ActiveTripBannerProps {
  activeTrip: ActiveTrip | null;
  onOpenTripSetup: () => void;
  onOpenTripCorrection: () => void;
  onEndTrip: () => void;
  compact?: boolean;
}

export const ActiveTripBanner: React.FC<ActiveTripBannerProps> = ({
  activeTrip,
  onOpenTripSetup,
  onOpenTripCorrection,
  onEndTrip,
  compact = false
}) => {
  if (!activeTrip || activeTrip.status !== 'ACTIVE') {
    return (
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-amber-300">No Active Trip Initialized</h4>
            <p className="text-slate-400 text-[11px]">Configure trip once to enable simplified 1-click ticketing.</p>
          </div>
        </div>
        <button
          onClick={() => { soundEffects.playKeyClick(); onOpenTripSetup(); }}
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
        >
          Setup Trip Now
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-mono font-bold text-emerald-400 shrink-0">
            {activeTrip.busNumber} • {activeTrip.serviceType.replace('_', ' ')}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-semibold truncate flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
            FROM: <strong>{activeTrip.startingFromStop.name}</strong> (Stg {activeTrip.startingFromStop.stageNumber})
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
          {activeTrip.totalTicketsIssued} Issued (₹{activeTrip.totalRevenue})
        </span>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/40 shadow-lg space-y-2.5">
      {/* Top Banner Row */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-black text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            ACTIVE TRIP #{activeTrip.tripNumber}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
            CONFIGURED
          </span>
        </div>

        {/* Action buttons: Edit Trip (Auth) & End Trip */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { soundEffects.playKeyClick(); onOpenTripCorrection(); }}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
            title="Authorised correction with PIN and audit log"
          >
            <FileEdit className="w-3 h-3 text-amber-400" />
            <span>Correct Trip</span>
          </button>

          <button
            onClick={() => { soundEffects.playKeyClick(); onEndTrip(); }}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white text-[11px] font-bold flex items-center gap-1 border border-rose-500/30 transition-colors cursor-pointer"
            title="End active trip and close trip ledger"
          >
            <StopCircle className="w-3 h-3 text-rose-400" />
            <span>End Trip</span>
          </button>
        </div>
      </div>

      {/* Grid of locked parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Bus & Service</span>
          <span className="font-mono font-bold text-white text-xs block truncate">{activeTrip.busNumber}</span>
          <span className="text-[10px] font-bold text-emerald-400 block truncate">{activeTrip.serviceType.replace('_', ' ')}</span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Route</span>
          <span className="font-bold text-white text-xs block truncate">RT-{activeTrip.routeNumber}</span>
          <span className="text-[10px] text-slate-400 block truncate">{activeTrip.routeName}</span>
        </div>

        <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-500/40">
          <span className="text-[10px] text-emerald-400 uppercase block font-bold">Locked Starting FROM</span>
          <span className="font-bold text-white text-xs block truncate">{activeTrip.startingFromStop.name}</span>
          <span className="text-[10px] text-emerald-300 font-mono block">Stage {activeTrip.startingFromStop.stageNumber}</span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Trip Metrics</span>
          <span className="font-mono font-bold text-white text-xs block">
            {activeTrip.totalTicketsIssued} Tickets
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-400 block">
            ₹{activeTrip.totalRevenue} Collected
          </span>
        </div>
      </div>
    </div>
  );
};
