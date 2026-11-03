import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Navigation, 
  Sparkles,
  Key,
  FileText
} from 'lucide-react';
import { ActiveTrip, BusServiceType, BusStop, RouteData } from '../types/tim';
import { APSRTC_SERVICE_TYPES, DEMO_ROUTES } from '../data/apsrtcData';
import { localDb } from '../services/db';
import { soundEffects } from '../services/soundEffects';

interface TripSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTrip: ActiveTrip | null;
  onTripConfigured: (trip: ActiveTrip) => void;
  isCorrectionMode?: boolean;
  supervisorPin: string;
}

export const TripSetupModal: React.FC<TripSetupModalProps> = ({
  isOpen,
  onClose,
  activeTrip,
  onTripConfigured,
  isCorrectionMode = false,
  supervisorPin
}) => {
  const [busNumber, setBusNumber] = useState(activeTrip?.busNumber || 'AP29Z 4582');
  const [serviceType, setServiceType] = useState<BusServiceType>(activeTrip?.serviceType || 'PALLE_VELUGU');
  const [routeId, setRouteId] = useState(activeTrip?.routeId || DEMO_ROUTES[0].routeId);
  
  // Selected route and stops
  const selectedRoute = DEMO_ROUTES.find(r => r.routeId === routeId) || DEMO_ROUTES[0];
  const [startingStopId, setStartingStopId] = useState<string>(
    activeTrip?.startingFromStop.id || selectedRoute.stops[0].id
  );
  
  const [tripTime, setTripTime] = useState(
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );
  const [tripDate, setTripDate] = useState(
    new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  );

  // Correction Mode authorization state
  const [authPin, setAuthPin] = useState('');
  const [correctionReason, setCorrectionReason] = useState('Change of route due to traffic division');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When route changes, update starting stop default if not valid
  useEffect(() => {
    const route = DEMO_ROUTES.find(r => r.routeId === routeId) || DEMO_ROUTES[0];
    if (!route.stops.some(s => s.id === startingStopId)) {
      setStartingStopId(route.stops[0].id);
    }
  }, [routeId, startingStopId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const startingStop = selectedRoute.stops.find(s => s.id === startingStopId) || selectedRoute.stops[0];

    // If correction mode, verify supervisor or conductor PIN
    if (isCorrectionMode) {
      if (authPin !== supervisorPin && authPin !== '9482' && authPin !== '1234') {
        soundEffects.playErrorBuzz();
        setErrorMsg('Invalid Authorisation PIN. Conductor: 1234 / Supervisor: 9482 required for trip correction.');
        return;
      }

      soundEffects.playSuccess();
      const updated = localDb.correctActiveTrip(
        {
          busNumber,
          serviceType,
          routeId: selectedRoute.routeId,
          routeNumber: selectedRoute.routeNumber,
          routeName: selectedRoute.name,
          startingFromStop: startingStop
        },
        correctionReason,
        'EMP-9482'
      );

      onTripConfigured(updated);
      onClose();
      return;
    }

    // New Trip Setup
    soundEffects.playSuccess();
    const newTripNumber = (activeTrip?.tripNumber || 0) + 1;
    const now = new Date();
    const timestampStr = `${tripDate} ${tripTime}`;

    const newTrip: ActiveTrip = {
      tripId: `TRIP-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      tripNumber: newTripNumber,
      busNumber,
      serviceType,
      routeId: selectedRoute.routeId,
      routeNumber: selectedRoute.routeNumber,
      routeName: selectedRoute.name,
      startingFromStop: startingStop,
      tripStartTimestamp: timestampStr,
      status: 'ACTIVE',
      totalTicketsIssued: 0,
      totalRevenue: 0,
      auditLogs: [
        {
          id: `AUD-${Date.now()}`,
          timestamp: timestampStr,
          action: 'CONFIGURED',
          note: `New trip configured at starting stop: ${startingStop.name}`,
          authorizedByStaffId: 'EMP-9482'
        }
      ]
    };

    localDb.saveActiveTrip(newTrip);
    onTripConfigured(newTrip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 font-sans">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isCorrectionMode ? 'Authorised Trip Correction' : 'Trip Setup (One-Time Configuration)'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                  ACTIVE TRIP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isCorrectionMode 
                  ? 'Update trip parameters with audit logging' 
                  : 'Configure once at beginning of trip. All tickets will lock these parameters.'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => { soundEffects.playKeyClick(); onClose(); }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Conductor Efficiency:</strong> Once configured, consecutive ticket issuing only asks for the passenger's destination stop (TO)!
          </span>
        </div>

        {errorMsg && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-rose-500/20 border border-rose-500 text-xs text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Bus Number & Service Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Bus Registration Number:
              </label>
              <input
                type="text"
                value={busNumber}
                onChange={e => setBusNumber(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Bus Service Type:
              </label>
              <select
                value={serviceType}
                onChange={e => setServiceType(e.target.value as BusServiceType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {APSRTC_SERVICE_TYPES.map(st => (
                  <option key={st.type} value={st.type}>
                    {st.name} ({st.teluguName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Route Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Active Trip Route:
            </label>
            <select
              value={routeId}
              onChange={e => setRouteId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {DEMO_ROUTES.map(rt => (
                <option key={rt.routeId} value={rt.routeId}>
                  Route {rt.routeNumber}: {rt.name} ({rt.stops.length} Stages, {rt.totalDistanceKm} km)
                </option>
              ))}
            </select>
          </div>

          {/* Starting FROM location */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Starting FROM Location (Origin of Trip):
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Locked for entire trip
              </span>
            </div>

            <select
              value={startingStopId}
              onChange={e => setStartingStopId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {selectedRoute.stops.map(stop => (
                <option key={stop.id} value={stop.id}>
                  Stage {stop.stageNumber}: {stop.name} ({stop.teluguName})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              Every passenger boarding ticket during this trip will automatically originate from this location.
            </p>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Trip Start Date:
              </label>
              <div className="flex items-center px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white">
                <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2" />
                <input
                  type="text"
                  value={tripDate}
                  onChange={e => setTripDate(e.target.value)}
                  className="bg-transparent focus:outline-none w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Trip Start Time:
              </label>
              <div className="flex items-center px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white">
                <Clock className="w-3.5 h-3.5 text-slate-400 mr-2" />
                <input
                  type="text"
                  value={tripTime}
                  onChange={e => setTripTime(e.target.value)}
                  className="bg-transparent focus:outline-none w-full"
                />
              </div>
            </div>
          </div>

          {/* Correction Mode Authorization & Reason */}
          {isCorrectionMode && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Authorised Correction Audit Requirement</span>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Correction Reason Note:</label>
                <input
                  type="text"
                  value={correctionReason}
                  onChange={e => setCorrectionReason(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 flex items-center justify-between">
                  <span>Authorisation PIN:</span>
                  <span className="text-[10px] text-slate-500 font-mono">Conductor: 1234 / Sup: 9482</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={authPin}
                  onChange={e => setAuthPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm font-mono text-center tracking-widest text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-98 transition-all mt-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isCorrectionMode ? 'Save Authorised Correction & Audit Log' : 'Save & Start Active Trip'}</span>
          </button>
        </form>

        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
          <span>APSRTC Waybill Trip Control</span>
          <span>Offline Configuration Store</span>
        </div>
      </div>
    </div>
  );
};
