import React, { useState, useEffect } from 'react';
import { 
  Battery, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Printer, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  User, 
  RefreshCw, 
  Home, 
  Ticket, 
  Sparkles, 
  History, 
  FileSpreadsheet, 
  QrCode
} from 'lucide-react';
import { ConductorSession, DeviceTelemetry } from '../types/tim';
import { soundEffects } from '../services/soundEffects';

export type TIMView = 
  | 'HOME' 
  | 'ISSUE_PAID' 
  | 'ISSUE_FREE' 
  | 'HISTORY' 
  | 'CANCEL_TICKET' 
  | 'TRIP_SUMMARY' 
  | 'VALIDATE_QR' 
  | 'SYNC' 
  | 'DETAILS';

interface TIMChassisProps {
  children: React.ReactNode;
  session: ConductorSession;
  telemetry: DeviceTelemetry;
  activeView: TIMView;
  onChangeView: (view: TIMView) => void;
  onOpenLogin: () => void;
  pendingSyncCount: number;
}

export const TIMChassis: React.FC<TIMChassisProps> = ({
  children,
  session,
  telemetry,
  activeView,
  onChangeView,
  onOpenLogin,
  pendingSyncCount
}) => {
  const [deviceFrameMode, setDeviceFrameMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    soundEffects.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      soundEffects.playKeyClick();
    }
  };

  const handleKeypadPress = (key: string) => {
    soundEffects.playKeyClick();
    if (key === 'F1') onChangeView('ISSUE_PAID');
    else if (key === 'F2') onChangeView('ISSUE_FREE');
    else if (key === 'F3') onChangeView('HISTORY');
    else if (key === 'F4') onChangeView('TRIP_SUMMARY');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-0 md:p-3 select-none">
      
      {/* External Desktop / Dev Toolbar */}
      <header className="w-full max-w-4xl px-4 py-2 flex items-center justify-between text-xs text-slate-400 no-print border-b border-slate-900 md:border-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white tracking-wider flex items-center gap-1.5 font-sans">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            APSRTC SMART TIM
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline font-mono text-slate-400">Electronic Ticket Machine v4.3</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mute Audio */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Toggle Physical Keypad */}
          <button
            onClick={() => { soundEffects.playKeyClick(); setShowKeypad(!showKeypad); }}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showKeypad
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tactile Keypad</span>
          </button>

          {/* Frame Toggle */}
          <button
            onClick={() => { soundEffects.playKeyClick(); setDeviceFrameMode(!deviceFrameMode); }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {deviceFrameMode ? (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fullscreen Mode</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Handheld Chassis</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container: Handheld Device Enclosure */}
      <main className={`w-full transition-all duration-300 flex flex-col ${
        deviceFrameMode
          ? 'max-w-[440px] rounded-[36px] bg-[#161c28] border-[8px] border-[#222938] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden my-auto'
          : 'max-w-4xl h-full flex-1 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden'
      }`}>
        
        {/* Physical Handheld Top Thermal Printer Slot */}
        {deviceFrameMode && (
          <div className="bg-[#0f141f] border-b-2 border-slate-950 px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                APSRTC THERMAL PRINTER
              </span>
            </div>
            {/* Paper output slit */}
            <div className="w-24 h-1.5 rounded-full bg-slate-950 border-b border-slate-800" />
            <div className="text-[10px] font-mono text-slate-500">
              ROLL: {telemetry.paperRollPercentage}%
            </div>
          </div>
        )}

        {/* Handheld Android Device Status Bar */}
        <div className="bg-slate-950 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-300 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{currentTime}</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-semibold">{session.depotCode}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{session.busNumber}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Network State Badge */}
            <span className={`flex items-center gap-1 font-bold ${
              telemetry.networkMode === 'OFFLINE'
                ? 'text-rose-400'
                : telemetry.networkMode === '2G_EDGE'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}>
              {telemetry.networkMode === 'OFFLINE' ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span>{telemetry.networkMode === 'OFFLINE' ? 'OFFLINE' : telemetry.networkMode === '2G_EDGE' ? '2G' : '4G'}</span>
            </span>

            {/* Battery */}
            <span className="flex items-center gap-1 text-slate-200">
              <span>{telemetry.batteryPercentage}%</span>
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            </span>
          </div>
        </div>

        {/* Quick Top Conductor Action Strip */}
        <div className="bg-slate-900/90 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { soundEffects.playKeyClick(); onChangeView('HOME'); }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                activeView === 'HOME'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Return to Conductor Home"
            >
              <Home className="w-4 h-4" />
              <span className="text-[11px] font-bold">Home</span>
            </button>

            <button
              onClick={() => { soundEffects.playKeyClick(); onOpenLogin(); }}
              className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-[11px]"
            >
              <User className="w-3 h-3 text-emerald-400" />
              <span className="font-mono">{session.conductorId}</span>
            </button>
          </div>

          {/* Quick Navigation Pills */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => { soundEffects.playKeyClick(); onChangeView('ISSUE_PAID'); }}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                activeView === 'ISSUE_PAID'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Issue
            </button>

            <button
              onClick={() => { soundEffects.playKeyClick(); onChangeView('ISSUE_FREE'); }}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                activeView === 'ISSUE_FREE'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Free
            </button>

            <button
              onClick={() => { soundEffects.playKeyClick(); onChangeView('HISTORY'); }}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                activeView === 'HISTORY'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              History
            </button>

            <button
              onClick={() => { soundEffects.playKeyClick(); onChangeView('TRIP_SUMMARY'); }}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                activeView === 'TRIP_SUMMARY'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Trip
            </button>

            <button
              onClick={() => { soundEffects.playKeyClick(); onChangeView('SYNC'); }}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                activeView === 'SYNC'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              {pendingSyncCount > 0 && (
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                  {pendingSyncCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Screen Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-[520px]">
          {children}
        </div>

        {/* Tactile Mechanical Keypad (Authentic Handheld Android TIM Style) */}
        {showKeypad && (
          <div className="bg-[#121620] border-t-2 border-slate-900 p-3 select-none">
            {/* Conductor Function Keys */}
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              <button
                onClick={() => handleKeypadPress('F1')}
                className="py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 font-mono text-[11px] font-bold active:scale-95 transition-transform"
              >
                F1 PAID
              </button>
              <button
                onClick={() => handleKeypadPress('F2')}
                className="py-1.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 text-teal-400 border border-teal-800 font-mono text-[11px] font-bold active:scale-95 transition-transform"
              >
                F2 FREE
              </button>
              <button
                onClick={() => handleKeypadPress('F3')}
                className="py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-400 border border-blue-800 font-mono text-[11px] font-bold active:scale-95 transition-transform"
              >
                F3 HIST
              </button>
              <button
                onClick={() => handleKeypadPress('F4')}
                className="py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-400 border border-purple-800 font-mono text-[11px] font-bold active:scale-95 transition-transform"
              >
                F4 TRIP
              </button>
            </div>

            {/* Numeric Rubberized Keypad */}
            <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => soundEffects.playKeyClick()}
                  className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700/80 shadow-inner active:scale-95 transition-transform"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => soundEffects.playKeyClick()}
                className="py-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-800 active:scale-95 transition-transform"
              >
                CLR
              </button>
              <button
                onClick={() => soundEffects.playKeyClick()}
                className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700/80 shadow-inner active:scale-95 transition-transform"
              >
                0
              </button>
              <button
                onClick={() => soundEffects.playPrinterFeed()}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs border border-emerald-500 shadow-md active:scale-95 transition-transform"
              >
                PRINT
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-md py-2.5 text-center text-[11px] text-slate-500 font-sans">
        Andhra Pradesh State Road Transport Corporation • Smart TIM Prototype
      </footer>

    </div>
  );
};
