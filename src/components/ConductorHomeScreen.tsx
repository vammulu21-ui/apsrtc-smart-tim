import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Sparkles, 
  History, 
  Ban, 
  FileSpreadsheet, 
  Bus, 
  Clock, 
  MapPin, 
  Wifi, 
  WifiOff, 
  User, 
  QrCode, 
  Server, 
  Sliders, 
  ChevronRight, 
  Navigation,
  FileEdit,
  StopCircle,
  PlusCircle
} from 'lucide-react';
import { ConductorSession, DeviceTelemetry, ActiveTrip } from '../types/tim';
import { DEMO_ROUTES } from '../data/apsrtcData';
import { localDb } from '../services/db';
import { soundEffects } from '../services/soundEffects';
import { ActiveTripBanner } from './ActiveTripBanner';

interface ConductorHomeScreenProps {
  session: ConductorSession;
  telemetry: DeviceTelemetry;
  activeTrip: ActiveTrip | null;
  lang: 'en' | 'te';
  onToggleLang: () => void;
  onNavigate: (view: 'ISSUE_PAID' | 'ISSUE_FREE' | 'HISTORY' | 'CANCEL_TICKET' | 'TRIP_SUMMARY' | 'VALIDATE_QR' | 'SYNC' | 'FARE_CHART') => void;
  onOpenLogin: () => void;
  onOpenTripSetup: () => void;
  onOpenTripCorrection: () => void;
  onEndTrip: () => void;
  onToggleNetwork: () => void;
}

export const ConductorHomeScreen: React.FC<ConductorHomeScreenProps> = ({
  session,
  telemetry,
  activeTrip,
  lang,
  onToggleLang,
  onNavigate,
  onOpenLogin,
  onOpenTripSetup,
  onOpenTripCorrection,
  onEndTrip,
  onToggleNetwork
}) => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [stats, setStats] = useState(() => localDb.getShiftStats());

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshStats = () => {
    setStats(localDb.getShiftStats());
  };

  useEffect(() => {
    refreshStats();
  }, [activeTrip]);

  const currentRoute = DEMO_ROUTES.find(r => r.routeId === (activeTrip?.routeId || session.routeId)) || DEMO_ROUTES[0];

  const t = {
    en: {
      depot: 'Depot',
      bus: 'Bus No',
      trip: 'Trip',
      waybill: 'Waybill',
      online: 'ONLINE',
      offline: 'OFFLINE',
      action1Title: 'Issue New Ticket',
      action1Sub: 'Instant destination selection from locked FROM stop',
      action2Title: 'Free Travel Ticket',
      action2Sub: 'Maha Lakshmi / Stree Shakti eligibility pass',
      action3Title: 'Ticket History',
      action3Sub: 'Search, view details & reprint tickets',
      action4Title: 'Cancel Ticket',
      action4Sub: 'Authorised cancellation with supervisor PIN',
      action5Title: 'Trip Summary',
      action5Sub: 'Waybill financial ledger & passenger counts',
      ticketsIssued: 'Shift Tickets',
      cashInHand: 'Cash in Bag',
      shiftTotal: 'Total Collection'
    },
    te: {
      depot: 'డిపో',
      bus: 'బస్సు సంఖ్య',
      trip: 'ట్రిప్',
      waybill: 'వేబిల్లు',
      online: 'ఆన్‌లైన్',
      offline: 'ఆఫ్‌లైన్',
      action1Title: 'కొత్త టికెట్ జారీ (చెల్లింపు)',
      action1Sub: 'లాక్ చేయబడిన స్టేజ్ నుండి గమ్యస్థాన టికెట్',
      action2Title: 'మహిళా ఉచిత ప్రయాణ టికెట్',
      action2Sub: 'మహా లక్ష్మి / స్త్రీ శక్తి పథకం ధృవీకరణ',
      action3Title: 'టికెట్ చరిత్ర & రీప్రింట్',
      action3Sub: 'జారీ చేసిన టిక్కెట్లు మరియు పునఃముద్రణ',
      action4Title: 'టికెట్ రద్దు (ఆథరైజ్డ్)',
      action4Sub: 'సూపర్‌వైజర్ పిన్‌తో టికెట్ క్యాన్సిలేషన్',
      action5Title: 'ట్రిప్ సమ్మరీ & వేబిల్లు',
      action5Sub: 'నగదు నిల్వ, కలెక్షన్ మరియు ప్రయాణికుల లెక్క',
      ticketsIssued: 'మొత్తం టిక్కెట్లు',
      cashInHand: 'చేతిలో ఉన్న నగదు',
      shiftTotal: 'మొత్తం కలెక్షన్'
    }
  }[lang];

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-y-auto p-3 sm:p-4 space-y-3 font-sans">
      
      {/* Handheld TIM Conductor Badge & Live Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs">
          {/* Conductor Login badge */}
          <button 
            onClick={() => { soundEffects.playKeyClick(); onOpenLogin(); }}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="font-bold text-white group-hover:text-emerald-400 transition-colors block text-[11px] leading-tight">
                {session.conductorName}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ID: {session.conductorId}
              </span>
            </div>
          </button>

          {/* Network & Language toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { soundEffects.playKeyClick(); onToggleNetwork(); }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                telemetry.networkMode === 'OFFLINE'
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                  : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
              }`}
              title="Click to toggle Network mode"
            >
              {telemetry.networkMode === 'OFFLINE' ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span>{telemetry.networkMode === 'OFFLINE' ? t.offline : t.online}</span>
            </button>

            <button
              onClick={() => { soundEffects.playKeyClick(); onToggleLang(); }}
              className="px-2 py-1 rounded-xl bg-slate-800 border border-slate-700 text-[11px] font-bold text-emerald-400 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {lang === 'en' ? 'తెలుగు' : 'ENG'}
            </button>
          </div>
        </div>

        {/* Date & Time and Quick Shift Ribbon */}
        <div className="flex items-center justify-between pt-2 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-white">{currentTime}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{currentDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { soundEffects.playKeyClick(); onOpenTripSetup(); }}
              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Navigation className="w-3 h-3 text-emerald-400" />
              <span>Trip Setup</span>
            </button>
          </div>
        </div>
      </div>

      {/* VISIBLE ACTIVE TRIP SECTION */}
      <ActiveTripBanner
        activeTrip={activeTrip}
        onOpenTripSetup={onOpenTripSetup}
        onOpenTripCorrection={onOpenTripCorrection}
        onEndTrip={onEndTrip}
      />

      {/* Primary Shift Quick Stats Ribbon */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.ticketsIssued}</span>
          <span className="text-lg font-black font-mono text-white mt-0.5 block">{stats.totalTickets}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
          <span className="text-[10px] text-emerald-400 uppercase font-semibold block">{t.cashInHand}</span>
          <span className="text-lg font-black font-mono text-emerald-300 mt-0.5 block">₹{stats.totalCash}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40">
          <span className="text-[10px] text-blue-400 uppercase font-semibold block">{t.shiftTotal}</span>
          <span className="text-lg font-black font-mono text-blue-300 mt-0.5 block">₹{stats.totalRevenue}</span>
        </div>
      </div>

      {/* 5 Primary Touch-Friendly Conductor Action Buttons */}
      <div className="space-y-2 pt-1">
        
        {/* 1. ISSUE NEW TICKET (High Priority Primary Green) */}
        <button
          onClick={() => {
            soundEffects.playKeyClick();
            if (!activeTrip || activeTrip.status !== 'ACTIVE') {
              onOpenTripSetup();
            } else {
              onNavigate('ISSUE_PAID');
            }
          }}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-sans text-left shadow-lg shadow-emerald-950/50 border border-emerald-400/40 flex items-center justify-between group active:scale-98 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              <Ticket className="w-7 h-7" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
                <span>1. {t.action1Title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/40 text-emerald-200 border border-white/20">
                  F1
                </span>
              </div>
              <div className="text-xs text-emerald-100 font-medium opacity-90 mt-0.5">
                {activeTrip ? `Locked FROM: ${activeTrip.startingFromStop.name} ➔ Select TO` : t.action1Sub}
              </div>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-emerald-200 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* 2. FREE TRAVEL TICKET */}
        <button
          onClick={() => {
            soundEffects.playKeyClick();
            if (!activeTrip || activeTrip.status !== 'ACTIVE') {
              onOpenTripSetup();
            } else {
              onNavigate('ISSUE_FREE');
            }
          }}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white font-sans text-left shadow-md shadow-teal-950/40 border border-teal-400/30 flex items-center justify-between group active:scale-98 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-black tracking-wide flex items-center gap-2">
                <span>2. {t.action2Title}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                  ZERO FARE
                </span>
              </div>
              <div className="text-xs text-teal-100 opacity-90 mt-0.5">
                {t.action2Sub}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-teal-200 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* 3. TICKET HISTORY */}
        <button
          onClick={() => { soundEffects.playKeyClick(); onNavigate('HISTORY'); }}
          className="w-full p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 text-white font-sans text-left border border-slate-800 hover:border-slate-700 flex items-center justify-between group active:scale-98 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-white group-hover:text-blue-300 transition-colors flex items-center gap-2">
                <span>3. {t.action3Title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {stats.totalTickets} Tkts
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {t.action3Sub}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* 4. CANCEL TICKET */}
        <button
          onClick={() => { soundEffects.playKeyClick(); onNavigate('CANCEL_TICKET'); }}
          className="w-full p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 text-white font-sans text-left border border-slate-800 hover:border-rose-900/50 flex items-center justify-between group active:scale-98 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-white group-hover:text-rose-300 transition-colors flex items-center gap-2">
                <span>4. {t.action4Title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  PIN Auth
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {t.action4Sub}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* 5. TRIP SUMMARY */}
        <button
          onClick={() => { soundEffects.playKeyClick(); onNavigate('TRIP_SUMMARY'); }}
          className="w-full p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 text-white font-sans text-left border border-slate-800 hover:border-purple-900/50 flex items-center justify-between group active:scale-98 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-2">
                <span>5. {t.action5Title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  ₹{stats.totalRevenue}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {t.action5Sub}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Auxiliary Tools */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900">
        <button
          onClick={() => { soundEffects.playKeyClick(); onNavigate('VALIDATE_QR'); }}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-center transition-colors cursor-pointer group"
        >
          <QrCode className="w-4 h-4 text-emerald-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-slate-300 block leading-tight">Inspect QR</span>
        </button>

        <button
          onClick={() => { soundEffects.playKeyClick(); onNavigate('FARE_CHART'); }}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-center transition-colors cursor-pointer group"
        >
          <Sliders className="w-4 h-4 text-amber-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-slate-300 block leading-tight">Fare Chart</span>
        </button>

        <button
          onClick={() => { soundEffects.playKeyClick(); onNavigate('SYNC'); }}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-center transition-colors cursor-pointer group relative"
        >
          <Server className="w-4 h-4 text-blue-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-slate-300 block leading-tight">Sync Hub</span>
          {stats.pendingSyncCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
              {stats.pendingSyncCount}
            </span>
          )}
        </button>
      </div>

    </div>
  );
};
