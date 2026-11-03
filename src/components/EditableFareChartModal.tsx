import React, { useState } from 'react';
import { 
  Sliders, 
  IndianRupee, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  ShieldCheck,
  Key
} from 'lucide-react';
import { EditableFareConfig, BusServiceType } from '../types/tim';
import { getEditableFareConfigs, saveEditableFareConfigs } from '../data/apsrtcData';
import { soundEffects } from '../services/soundEffects';

interface EditableFareChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigsUpdated: () => void;
}

export const EditableFareChartModal: React.FC<EditableFareChartModalProps> = ({
  isOpen,
  onClose,
  onConfigsUpdated
}) => {
  const [configs, setConfigs] = useState<EditableFareConfig[]>(() => getEditableFareConfigs());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [supervisorPinInput, setSupervisorPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    // Accept Supervisor PIN 9482 or default PIN 1234
    if (supervisorPinInput === '9482' || supervisorPinInput === '1234') {
      soundEffects.playSuccess();
      setIsAdminUnlocked(true);
      setSupervisorPinInput('');
    } else {
      soundEffects.playErrorBuzz();
      setPinError('Invalid Supervisor PIN. Use 9482 or 1234 for demo admin access.');
    }
  };

  const handleUpdateField = (
    index: number, 
    field: keyof EditableFareConfig, 
    value: number | boolean
  ) => {
    if (!isAdminUnlocked) return;
    const updated = [...configs];
    updated[index] = { ...updated[index], [field]: value };
    setConfigs(updated);
  };

  const handleSave = () => {
    if (!isAdminUnlocked) {
      soundEffects.playErrorBuzz();
      alert('Supervisor/Admin permission required to modify official tariff matrices.');
      return;
    }
    soundEffects.playSuccess();
    saveEditableFareConfigs(configs);
    setSavedSuccess(true);
    onConfigsUpdated();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetDefaults = () => {
    if (!isAdminUnlocked) {
      soundEffects.playErrorBuzz();
      alert('Supervisor/Admin permission required to reset demo fare charts.');
      return;
    }
    soundEffects.playKeyClick();
    localStorage.removeItem('apsrtc_editable_fare_charts_v1');
    const fresh = getEditableFareConfigs();
    setConfigs(fresh);
    onConfigsUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 font-sans">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">APSRTC Configurable Fare Chart</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DEMO TARIFF
                </span>
              </div>
              <p className="text-xs text-slate-400">Tariff rates per stage, concessions & passenger discounts</p>
            </div>
          </div>
          <button 
            onClick={() => { soundEffects.playKeyClick(); onClose(); }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Disclaimer & Admin Permission Status */}
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] leading-tight">
              Sample APSRTC fare chart. Real-world tariff edits require Central Transport Authority sync.
            </span>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {isAdminUnlocked ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold text-[10px] flex items-center gap-1">
                <Unlock className="w-3 h-3" /> ADMIN EDIT UNLOCKED
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono font-bold text-[10px] flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" /> CONDUCTOR VIEW-ONLY
              </span>
            )}
          </div>
        </div>

        {/* Admin PIN Unlock Form if locked */}
        {!isAdminUnlocked && (
          <form onSubmit={handleUnlockAdmin} className="px-5 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2 text-xs">
            <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Supervisor PIN to edit:</span>
            <input
              type="password"
              placeholder="PIN (9482)"
              maxLength={6}
              value={supervisorPinInput}
              onChange={e => setSupervisorPinInput(e.target.value)}
              className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-center text-white focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] cursor-pointer transition-colors"
            >
              Unlock Edits
            </button>
            {pinError && <span className="text-[10px] text-rose-400 ml-2">{pinError}</span>}
          </form>
        )}

        {/* Table of Services */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Fare chart saved! Real-time ticketing calculations updated.</span>
            </div>
          )}

          <div className="space-y-3">
            {configs.map((cfg, idx) => (
              <div
                key={cfg.serviceType}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{cfg.name}</span>
                    <span className="text-xs text-slate-400">({cfg.teluguName})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className={`text-xs text-emerald-300 flex items-center gap-1.5 ${isAdminUnlocked ? 'cursor-pointer' : 'opacity-80'}`}>
                      <input
                        type="checkbox"
                        disabled={!isAdminUnlocked}
                        checked={cfg.isFreeMahilaEligible}
                        onChange={e => handleUpdateField(idx, 'isFreeMahilaEligible', e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0 disabled:opacity-50"
                      />
                      <span>Mahila Free Pass Eligible</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block text-[10px]">Base Fare (₹):</label>
                    <input
                      type="number"
                      disabled={!isAdminUnlocked}
                      value={cfg.baseFare}
                      onChange={e => handleUpdateField(idx, 'baseFare', Number(e.target.value))}
                      className={`w-full mt-1 px-2.5 py-1.5 rounded-lg border font-mono font-bold ${
                        isAdminUnlocked
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[10px]">Rate / Stage (~6km) ₹:</label>
                    <input
                      type="number"
                      disabled={!isAdminUnlocked}
                      value={cfg.ratePerStage}
                      onChange={e => handleUpdateField(idx, 'ratePerStage', Number(e.target.value))}
                      className={`w-full mt-1 px-2.5 py-1.5 rounded-lg border font-mono font-bold ${
                        isAdminUnlocked
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[10px]">Toll Cess (₹):</label>
                    <input
                      type="number"
                      disabled={!isAdminUnlocked}
                      value={cfg.tollFee}
                      onChange={e => handleUpdateField(idx, 'tollFee', Number(e.target.value))}
                      className={`w-full mt-1 px-2.5 py-1.5 rounded-lg border font-mono font-bold ${
                        isAdminUnlocked
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[10px]">Child Discount %:</label>
                    <input
                      type="number"
                      disabled={!isAdminUnlocked}
                      value={cfg.childDiscountPct}
                      onChange={e => handleUpdateField(idx, 'childDiscountPct', Number(e.target.value))}
                      className={`w-full mt-1 px-2.5 py-1.5 rounded-lg border font-mono font-bold ${
                        isAdminUnlocked
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            disabled={!isAdminUnlocked}
            className={`text-xs flex items-center gap-1.5 transition-colors ${
              isAdminUnlocked ? 'text-slate-400 hover:text-white cursor-pointer' : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!isAdminUnlocked}
            className={`py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all ${
              isAdminUnlocked
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40 cursor-pointer active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply Fare Changes</span>
          </button>
        </div>

      </div>
    </div>
  );
};
