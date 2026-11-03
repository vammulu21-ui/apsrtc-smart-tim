import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Wifi, 
  WifiOff, 
  ArrowLeft, 
  Server, 
  FileSpreadsheet, 
  Clock, 
  Send,
  Trash2,
  Check
} from 'lucide-react';
import { PassengerTicket, SyncAuditRecord, DeviceTelemetry } from '../types/tim';
import { localDb } from '../services/db';
import { soundEffects } from '../services/soundEffects';

interface SyncDashboardProps {
  onBack: () => void;
  telemetry: DeviceTelemetry;
  onUpdateTelemetry: (updated: DeviceTelemetry) => void;
}

export const SyncDashboard: React.FC<SyncDashboardProps> = ({
  onBack,
  telemetry,
  onUpdateTelemetry
}) => {
  const [tickets, setTickets] = useState<PassengerTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<SyncAuditRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const loadData = () => {
    setTickets(localDb.getTickets());
    setAuditLogs(localDb.getSyncAuditLogs());
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingTickets = tickets.filter(t => !t.syncedToCloud);
  const syncedTickets = tickets.filter(t => t.syncedToCloud);
  const pendingAmount = pendingTickets.reduce((sum, t) => sum + t.fare.totalFare, 0);

  const handleToggleNetwork = (mode: 'OFFLINE' | '2G_EDGE' | '4G_ONLINE') => {
    soundEffects.playKeyClick();
    const updated = { ...telemetry, networkMode: mode };
    onUpdateTelemetry(updated);
    localDb.saveTelemetry(updated);
  };

  const handleBatchSync = () => {
    if (telemetry.networkMode === 'OFFLINE') {
      soundEffects.playErrorBuzz();
      alert('TIM is currently set to OFFLINE mode. Please connect to 2G Edge or 4G LTE to sync with APSRTC Cloud.');
      return;
    }

    if (pendingTickets.length === 0) {
      soundEffects.playKeyClick();
      alert('All transactions are already synchronized with central OPRS servers.');
      return;
    }

    soundEffects.playKeyClick();
    setIsSyncing(true);
    setSyncProgress(15);
    setSyncSuccessMsg(null);

    const step1 = setTimeout(() => setSyncProgress(45), 400);
    const step2 = setTimeout(() => setSyncProgress(80), 800);
    const step3 = setTimeout(() => {
      setSyncProgress(100);
      const syncedCount = localDb.markTicketsAsSynced(pendingTickets.map(t => t.ticketId));

      const auditRecord: SyncAuditRecord = {
        id: `SYNC-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        ticketsUploadedCount: syncedCount,
        amountSynchronized: pendingAmount,
        status: 'SUCCESS',
        networkType: telemetry.networkMode,
        message: `Successfully synchronized ${syncedCount} tickets (₹${pendingAmount}) to Central APSRTC Cloud DB`
      };

      localDb.saveSyncAuditLog(auditRecord);
      
      const updatedTelemetry = {
        ...telemetry,
        lastSyncTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      onUpdateTelemetry(updatedTelemetry);
      localDb.saveTelemetry(updatedTelemetry);

      loadData();
      setIsSyncing(false);
      soundEffects.playSuccess();
      setSyncSuccessMsg(`Synchronized ${syncedCount} tickets to APSRTC Central Server.`);
    }, 1300);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  };

  const handleExportCSV = () => {
    soundEffects.playKeyClick();
    const csvContent = localDb.exportTicketsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `APSRTC_TIM_Waybill_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top Header */}
      <div className="sticky top-0 z-20 px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
        <button
          onClick={() => { soundEffects.playKeyClick(); onBack(); }}
          className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Back to TIM</span>
        </button>
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-slate-200">APSRTC Cloud Sync Hub</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full p-4 space-y-5">
        
        {/* Network Connectivity Simulator */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {telemetry.networkMode === 'OFFLINE' ? (
                  <WifiOff className="w-4 h-4 text-rose-400" />
                ) : (
                  <Wifi className="w-4 h-4 text-emerald-400" />
                )}
                Handheld Network State: <span className="font-mono text-emerald-400">{telemetry.networkMode}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate operating in remote rural valleys (offline) or city corridors (4G).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => handleToggleNetwork('OFFLINE')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                telemetry.networkMode === 'OFFLINE'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <WifiOff className="w-3.5 h-3.5" />
              Offline Mode
            </button>
            <button
              onClick={() => handleToggleNetwork('2G_EDGE')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                telemetry.networkMode === '2G_EDGE'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              2G EDGE (Weak)
            </button>
            <button
              onClick={() => handleToggleNetwork('4G_ONLINE')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                telemetry.networkMode === '4G_ONLINE'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              4G LTE Online
            </button>
          </div>
        </div>

        {/* Sync Summary Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Stored</span>
              <span className="text-xl font-black font-mono text-white">{tickets.length}</span>
              <span className="text-[10px] text-slate-500 block">tickets in local DB</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30">
              <span className="text-[10px] text-amber-400 uppercase font-semibold block">Pending Sync</span>
              <span className="text-xl font-black font-mono text-amber-400">{pendingTickets.length}</span>
              <span className="text-[10px] text-slate-500 block">un-synced (₹{pendingAmount})</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Uploaded</span>
              <span className="text-xl font-black font-mono text-emerald-400">{syncedTickets.length}</span>
              <span className="text-[10px] text-slate-500 block">on cloud server</span>
            </div>
          </div>

          {/* Progress bar if syncing */}
          {isSyncing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-emerald-400">
                <span>Compressing & Uploading Transaction Batch...</span>
                <span>{syncProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            </div>
          )}

          {syncSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {/* Sync Trigger and Export Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleBatchSync}
              disabled={isSyncing || pendingTickets.length === 0}
              className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                pendingTickets.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer shadow-emerald-900/30 active:scale-98'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing ? 'Synchronizing...' : `Batch Sync Now (${pendingTickets.length} pending)`}
              </span>
            </button>

            <button
              onClick={handleExportCSV}
              className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Export Waybill CSV
            </button>
          </div>
        </div>

        {/* Pending Sync Queue List */}
        {pendingTickets.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
              <span>Unsynchronized Local Queue ({pendingTickets.length})</span>
              <span className="text-[10px] text-slate-400 lowercase font-normal">will auto-sync on 4G</span>
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {pendingTickets.map(t => (
                <div 
                  key={t.ticketId}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{t.ticketNumber}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {t.serviceType}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {t.fromStop.name} ➔ {t.toStop.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-200">₹{t.fare.totalFare}</span>
                    <span className="text-[10px] text-amber-400 block font-mono">QUEUED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync Audit History */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Recent Synchronization Audit Log
          </h4>
          {auditLogs.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
              No synchronization events recorded for this shift yet.
            </div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-bold text-slate-200">{log.message}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Log ID: {log.id} • Via: {log.networkType}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono shrink-0">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
