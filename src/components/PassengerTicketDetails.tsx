import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  ArrowLeft, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  MapPin, 
  Bus, 
  Clock, 
  Calendar, 
  User, 
  Download, 
  Share2, 
  Smartphone,
  Info,
  Sparkles
} from 'lucide-react';
import { PassengerTicket } from '../types/tim';
import { soundEffects } from '../services/soundEffects';

interface PassengerTicketDetailsProps {
  ticket: PassengerTicket;
  onBack: () => void;
}

export const PassengerTicketDetails: React.FC<PassengerTicketDetailsProps> = ({
  ticket,
  onBack
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(ticket.qrPayload, {
      width: 280,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }).then(setQrUrl).catch(console.error);
  }, [ticket]);

  const handleShare = () => {
    soundEffects.playKeyClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `APSRTC Ticket #${ticket.ticketNumber} | Route: ${ticket.routeNumber} (${ticket.fromStop.name} to ${ticket.toStop.name}) | Bus: ${ticket.busNumber} | Total: ₹${ticket.fare.totalFare}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isMahilaFree = ticket.category === 'FREE_MAHILA' || ticket.fare.isZeroFare;

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top Navigation */}
      <div className="sticky top-0 z-20 px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
        <button
          onClick={() => { soundEffects.playKeyClick(); onBack(); }}
          className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Back to TIM</span>
        </button>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          VALID PASSENGER TICKET
        </span>
      </div>

      <div className="max-w-md mx-auto w-full p-4 space-y-4">
        {/* Main Digital Card */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
          {/* Header Banner */}
          <div className="p-5 bg-gradient-to-r from-emerald-900/60 via-slate-900 to-teal-900/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  APSRTC DIGITAL E-TICKET
                </div>
                <div className="text-lg font-black text-white">
                  {ticket.serviceType.replace('_', ' ')}
                </div>
                <div className="text-xs text-slate-400">
                  Bus: <strong className="text-slate-200">{ticket.busNumber}</strong>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-mono">TICKET NO</span>
              <span className="text-base font-black font-mono text-emerald-400">
                {ticket.ticketNumber}
              </span>
            </div>
          </div>

          {/* Scheme Banner if applicable */}
          {isMahilaFree && (
            <div className="px-5 py-3 bg-gradient-to-r from-emerald-950 to-teal-950 border-b border-emerald-800/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-300">
                  AP Govt Maha Lakshmi Concession (Zero Fare)
                </div>
                <div className="text-[11px] text-emerald-400/80 font-mono">
                  Verified Aadhaar: {ticket.aadhaarDetails?.aadhaarNumberMasked || 'XXXX-XXXX-4921'}
                </div>
              </div>
            </div>
          )}

          {/* Journey Route Visualizer */}
          <div className="p-5 space-y-4">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-slate-600 before:to-teal-500">
              {/* Origin */}
              <div className="relative">
                <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </span>
                <div className="text-[11px] uppercase font-bold text-slate-400">
                  BOARDING • STAGE {ticket.fromStop.stageNumber}
                </div>
                <div className="text-base font-bold text-white">
                  {ticket.fromStop.name}
                </div>
                <div className="text-xs text-slate-400">
                  {ticket.fromStop.teluguName}
                </div>
              </div>

              {/* Destination */}
              <div className="relative">
                <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-teal-400 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                </span>
                <div className="text-[11px] uppercase font-bold text-slate-400">
                  DESTINATION • STAGE {ticket.toStop.stageNumber}
                </div>
                <div className="text-base font-bold text-white">
                  {ticket.toStop.name}
                </div>
                <div className="text-xs text-slate-400">
                  {ticket.toStop.teluguName}
                </div>
              </div>
            </div>

            {/* Travel stats grid */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Distance</span>
                <span className="text-sm font-bold text-slate-200">~{ticket.distanceKm} km</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Stages</span>
                <span className="text-sm font-bold text-slate-200">{ticket.stagesTravelled} Stages</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Passengers</span>
                <span className="text-sm font-bold text-slate-200">
                  {ticket.passengers.adult} Adult{ticket.passengers.child > 0 ? `, ${ticket.passengers.child} Child` : ''}
                </span>
              </div>
            </div>

            {/* Verifiable QR Code Box */}
            <div className="text-center p-4 rounded-2xl bg-white border border-slate-300 shadow-md">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Conductor / Flying Squad Inspection QR
              </div>
              {qrUrl ? (
                <img src={qrUrl} alt="Inspection QR" className="w-44 h-44 mx-auto rounded-lg" />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center bg-slate-100 text-xs text-slate-500">
                  Loading QR Code...
                </div>
              )}
              <div className="mt-2 text-[11px] font-mono font-semibold text-slate-700">
                TIM AUTH: {ticket.timDeviceId} • SIG-OK
              </div>
            </div>

            {/* Fare Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Stage Tariff:</span>
                <span>₹{ticket.fare.baseFare + ticket.fare.stageFare}</span>
              </div>
              {ticket.fare.tollTax > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>NHAI Toll Cess:</span>
                  <span>₹{ticket.fare.tollTax}</span>
                </div>
              )}
              {ticket.fare.concessionDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Concession / Scheme Benefit:</span>
                  <span>-₹{ticket.fare.concessionDiscount}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-800 font-bold text-sm">
                <span className="text-white">Amount Paid:</span>
                <span className="text-lg font-black text-emerald-400">
                  {ticket.fare.isZeroFare ? '₹0.00 (Zero-Fare)' : `₹${ticket.fare.totalFare}.00`}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Payment Mode: <strong>{ticket.paymentMethod}</strong></span>
                <span>Issued At: <strong>{ticket.issueTimestamp}</strong></span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-0.5 border-t border-slate-900">
                <span>Trip Ref: <strong className="font-mono text-slate-400">{ticket.tripId || 'TRIP-INIT'}</strong></span>
                <span>Waybill: <strong className="font-mono text-slate-400">{ticket.waybillNumber}</strong></span>
              </div>
            </div>

            {/* Aadhaar and SMS Notification status banner */}
            {ticket.aadhaarDetails && (
              <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-800/40 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-blue-300 font-semibold">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>Aadhaar Demo SMS Notification Dispatched</span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  Sent to: {ticket.aadhaarDetails.mobileNumberMasked}
                </div>
                <div className="text-[10px] text-slate-500">
                  Dispatched at {ticket.aadhaarDetails.smsTimestamp || ticket.issueTimestamp} via APSRTC Demo Gateway.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Share & Copy button */}
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            {copied ? 'Copied Ticket Summary!' : 'Copy Ticket Info'}
          </button>
          <button
            onClick={() => { soundEffects.playKeyClick(); window.print(); }}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Save / Print PDF
          </button>
        </div>
      </div>
    </div>
  );
};
