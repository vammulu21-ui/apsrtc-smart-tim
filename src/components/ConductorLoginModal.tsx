import React, { useState } from 'react';
import { 
  UserCheck, 
  Bus, 
  MapPin, 
  Key, 
  Fingerprint, 
  ShieldCheck, 
  ArrowRight,
  Clock,
  Sparkles,
  X
} from 'lucide-react';
import { ConductorSession, BusServiceType } from '../types/tim';
import { APSRTC_SERVICE_TYPES, DEMO_ROUTES } from '../data/apsrtcData';
import { soundEffects } from '../services/soundEffects';

interface ConductorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: ConductorSession;
  onSaveSession: (session: ConductorSession) => void;
}

export const ConductorLoginModal: React.FC<ConductorLoginModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onSaveSession
}) => {
  const [conductorId, setConductorId] = useState(currentSession.conductorId);
  const [conductorName, setConductorName] = useState(currentSession.conductorName);
  const [depotCode, setDepotCode] = useState(currentSession.depotCode);
  const [busNumber, setBusNumber] = useState(currentSession.busNumber);
  const [routeId, setRouteId] = useState(currentSession.routeId);
  const [serviceType, setServiceType] = useState<BusServiceType>(currentSession.serviceType);
  const [shift, setShift] = useState<'MORNING' | 'EVENING' | 'NIGHT'>(currentSession.shift);
  const [pin, setPin] = useState('1234');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playScannerBeep();
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      soundEffects.playSuccess();

      const updated: ConductorSession = {
        ...currentSession,
        conductorId,
        conductorName,
        depotCode,
        busNumber,
        routeId,
        serviceType,
        shift,
        waybillNumber: `WB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        loginTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      onSaveSession(updated);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 font-sans">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">APSRTC Conductor Shift Sign-In</h3>
              <p className="text-xs text-slate-400">Handheld Electronic TIM Device Auth</p>
            </div>
          </div>
          <button 
            onClick={() => { soundEffects.playKeyClick(); onClose(); }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLoginSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Conductor Staff ID
              </label>
              <input
                type="text"
                value={conductorId}
                onChange={e => setConductorId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Conductor Full Name
              </label>
              <input
                type="text"
                value={conductorName}
                onChange={e => setConductorName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Depot Code
              </label>
              <select
                value={depotCode}
                onChange={e => setDepotCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="GNT-1">GNT-1 (Guntur-1)</option>
                <option value="GNT-2">GNT-2 (Guntur-2)</option>
                <option value="VJA-1">VJA-1 (Vijayawada Auto Nagar)</option>
                <option value="VJA-2">VJA-2 (Governorpet)</option>
                <option value="TPT-1">TPT-1 (Tirupati Central)</option>
                <option value="VSP-1">VSP-1 (Maddilapalem VSP)</option>
                <option value="KNL-1">KNL-1 (Kurnool-1)</option>
                <option value="RJY-1">RJY-1 (Rajahmundry)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Assigned Bus Reg No.
              </label>
              <input
                type="text"
                value={busNumber}
                onChange={e => setBusNumber(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Route selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Select Operating Route
            </label>
            <select
              value={routeId}
              onChange={e => setRouteId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              {DEMO_ROUTES.map(rt => (
                <option key={rt.routeId} value={rt.routeId}>
                  Route {rt.routeNumber}: {rt.name} ({rt.stops.length} Stages)
                </option>
              ))}
            </select>
          </div>

          {/* Service Type Priority Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center justify-between">
              <span>Bus Service Type</span>
              <span className="text-[10px] text-emerald-400 font-semibold">Palle Velugu Prioritized</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {APSRTC_SERVICE_TYPES.map(st => (
                <button
                  type="button"
                  key={st.type}
                  onClick={() => { soundEffects.playKeyClick(); setServiceType(st.type); }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    serviceType === st.type
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{st.name}</span>
                    {st.isPriorityDefault && (
                      <span className="text-[9px] px-1 rounded bg-emerald-500 text-slate-950 font-black">
                        CORE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    ₹{st.baseFare} base • ₹{st.ratePerStage}/stg
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Shift and PIN */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Conductor Shift
              </label>
              <select
                value={shift}
                onChange={e => setShift(e.target.value as unknown as 'MORNING' | 'EVENING' | 'NIGHT')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="MORNING">Morning (06:00 - 14:00)</option>
                <option value="EVENING">Evening (14:00 - 22:00)</option>
                <option value="NIGHT">Night Express (22:00 - 06:00)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                4-Digit Staff PIN / Biometric
              </label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-center tracking-widest text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 cursor-pointer active:scale-98 transition-all mt-3"
          >
            {isVerifying ? (
              <span>Authenticating Conductor Credentials...</span>
            ) : (
              <>
                <Fingerprint className="w-5 h-5" />
                <span>Verify & Start Trip Shift</span>
              </>
            )}
          </button>
        </form>

        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
          <span>APSRTC Waybill Authorization</span>
          <span>Offline Cryptographic Keystore</span>
        </div>
      </div>
    </div>
  );
};
