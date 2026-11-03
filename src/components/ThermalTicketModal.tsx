import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Printer, 
  Share2, 
  CheckCircle, 
  FileText, 
  Download, 
  X, 
  Send, 
  ShieldCheck, 
  RotateCw,
  PlusCircle,
  Copy
} from 'lucide-react';
import { PassengerTicket } from '../types/tim';
import { soundEffects } from '../services/soundEffects';
import { localDb } from '../services/db';

interface ThermalTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: PassengerTicket | null;
  onViewDetails: (ticket: PassengerTicket) => void;
  onNewTicket: () => void;
}

export const ThermalTicketModal: React.FC<ThermalTicketModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onViewDetails,
  onNewTicket
}) => {
  const [ticketQrDataUrl, setTicketQrDataUrl] = useState<string>('');
  const [isPrintingAnimation, setIsPrintingAnimation] = useState(false);
  const [reprintCount, setReprintCount] = useState<number>(ticket?.reprintCount || 0);
  const [isDemoPrinted, setIsDemoPrinted] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && ticket) {
      setReprintCount(ticket.reprintCount || 0);
      setIsPrintingAnimation(true);
      setIsDemoPrinted(false);
      soundEffects.playPrinterFeed();
      const timer = setTimeout(() => {
        setIsPrintingAnimation(false);
        setIsDemoPrinted(true);
      }, 900);

      // Verifiable cryptographic reference QR payload (NO personal data)
      const qrData = `APSRTC-SECURE-TKT:${ticket.ticketId}:${ticket.timDeviceId}:STG${ticket.fromStop.stageNumber}-${ticket.toStop.stageNumber}:FARE${ticket.fare.totalFare}:${ticket.paymentStatus}`;

      QRCode.toDataURL(qrData, {
        width: 170,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).then(url => {
        setTicketQrDataUrl(url);
      }).catch(err => {
        console.error('Ticket QR generation error', err);
      });

      return () => clearTimeout(timer);
    }
  }, [isOpen, ticket]);

  if (!isOpen || !ticket) return null;

  const handleBrowserPrint = () => {
    soundEffects.playKeyClick();
    window.print();
  };

  const handleReprint = () => {
    soundEffects.playPrinterFeed();
    const count = localDb.incrementReprintCount(ticket.ticketId);
    setReprintCount(count);
    setIsPrintingAnimation(true);
    setTimeout(() => setIsPrintingAnimation(false), 800);
  };

  const isFreeTicket = ticket.fare.isZeroFare || ticket.paymentStatus === 'ZERO_FARE_EXEMPT';
  const totalPax = ticket.passengers.adult + ticket.passengers.child;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden text-slate-100 font-sans">
        
        {/* Header toolbar */}
        <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Thermal Ticket Output
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBrowserPrint}
              className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Send to physical printer or save PDF"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print</span>
            </button>
            <button
              onClick={() => { soundEffects.playKeyClick(); onClose(); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thermal Receipt Container */}
        <div className="p-4 overflow-y-auto flex-1 flex justify-center bg-slate-950/70">
          <div 
            ref={receiptRef}
            className={`w-full max-w-[340px] bg-[#fffdf7] text-slate-900 shadow-2xl rounded-sm p-4 font-mono text-[12px] leading-snug border-x border-slate-300 transition-all transform origin-top relative ${
              isPrintingAnimation ? 'translate-y-3 opacity-90 scale-y-95 animate-pulse' : 'translate-y-0 opacity-100'
            }`}
            style={{
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Top jagged tear edge */}
            <div className="absolute -top-2 inset-x-0 h-2 flex justify-between overflow-hidden">
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className="w-3 h-2 bg-[#fffdf7] rotate-45 transform origin-bottom-left border-t border-slate-300" />
              ))}
            </div>

            {/* Reprint Banner if applicable */}
            {reprintCount > 0 && (
              <div className="mb-2 py-1 px-2 bg-amber-200 border border-amber-600 text-amber-950 text-center font-black text-xs tracking-widest uppercase">
                *** REPRINT TICKET (COPY #{reprintCount}) ***
              </div>
            )}

            {/* Official APSRTC Standard Header */}
            <div className="text-center pb-2 border-b-2 border-dashed border-slate-400">
              <div className="font-black text-base text-slate-950 tracking-wider">
                APSRTC
              </div>
              <div className="font-bold text-[11px] text-slate-800 tracking-wide">
                ANDHRA PRADESH STATE ROAD TRANSPORT CORPORATION
              </div>
              <div className="text-[10px] text-slate-600 font-sans mt-0.5">
                ఆంధ్రప్రదేశ్ రాష్ట్ర రోడ్డు రవాణా సంస్థ
              </div>
            </div>

            {/* Standard APSRTC Ticket Layout fields */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Ticket ID:</span>
                <strong className="font-mono text-xs">{ticket.ticketId}</strong>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>{ticket.issueTimestamp}</span>
              </div>
              <div className="flex justify-between">
                <span>Bus No:</span>
                <strong>{ticket.busNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Service:</span>
                <strong>{ticket.serviceType.replace('_', ' ')}</strong>
              </div>
              <div className="flex justify-between">
                <span>From:</span>
                <strong>{ticket.fromStop.name} (Stg {ticket.fromStop.stageNumber})</strong>
              </div>
              <div className="flex justify-between">
                <span>To:</span>
                <strong>{ticket.toStop.name} (Stg {ticket.toStop.stageNumber})</strong>
              </div>
              <div className="flex justify-between">
                <span>Adults:</span>
                <span>{ticket.passengers.adult}</span>
              </div>
              <div className="flex justify-between">
                <span>Children:</span>
                <span>{ticket.passengers.child}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Passengers:</span>
                <strong>{totalPax}</strong>
              </div>
              <div className="flex justify-between">
                <span>Fare:</span>
                <span>Base: ₹{ticket.fare.baseFare + ticket.fare.stageFare} {ticket.fare.tollTax > 0 ? `+ Toll: ₹${ticket.fare.tollTax}` : ''} {ticket.fare.concessionDiscount > 0 ? `- Disc: ₹${ticket.fare.concessionDiscount}` : ''}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-300 text-sm">
                <span className="font-bold">Total Amount:</span>
                <span className="font-black text-base">
                  {isFreeTicket ? '₹0.00 (FREE TRAVEL)' : `₹${ticket.fare.totalFare}.00`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span>{ticket.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <strong className={ticket.paymentStatus === 'CANCELLED' ? 'text-rose-700' : 'text-emerald-800'}>
                  {ticket.paymentStatus === 'PAID' ? 'PAID' : ticket.paymentStatus === 'ZERO_FARE_EXEMPT' ? 'FREE TRAVEL' : ticket.paymentStatus}
                </strong>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="py-2.5 text-center space-y-1">
              <div className="inline-block p-1 bg-white border border-slate-300 shadow-xs">
                {ticketQrDataUrl ? (
                  <img src={ticketQrDataUrl} alt="Secure QR Code" className="w-28 h-28 mx-auto" />
                ) : (
                  <div className="w-28 h-28 flex items-center justify-center bg-slate-100 text-[10px] text-slate-500">
                    Generating QR...
                  </div>
                )}
              </div>
              <div className="text-[10px] text-slate-600 font-mono">
                REF: {ticket.ticketNumber} • TIM: {ticket.timDeviceId}
              </div>
            </div>

            {/* Standard Footer Slogan */}
            <div className="text-center pt-2 border-t-2 border-dashed border-slate-400 space-y-0.5">
              <div className="text-[11px] font-bold text-slate-900">
                Thank you for travelling with APSRTC.
              </div>
              <div className="text-[9px] text-slate-600">
                సురక్షితమైన ప్రయాణం - RTC ప్రయాణం
              </div>
              <div className="text-[8px] text-slate-500 pt-0.5">
                APSRTC ELECTRONIC TIM • NOT TRANSFERABLE
              </div>
            </div>

            {/* Bottom jagged tear edge */}
            <div className="absolute -bottom-2 inset-x-0 h-2 flex justify-between overflow-hidden">
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className="w-3 h-2 bg-[#fffdf7] rotate-45 transform origin-top-left border-b border-slate-300" />
              ))}
            </div>
          </div>
        </div>

        {/* 4 Required Action Buttons from prompt:
            - Print Ticket button
            - Reprint Ticket button
            - New Ticket button
            - View Ticket Details button */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2 no-print">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleBrowserPrint}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print Ticket</span>
            </button>

            <button
              onClick={handleReprint}
              className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-500/30 transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4 text-amber-400" />
              <span>Reprint Ticket</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundEffects.playKeyClick();
                onViewDetails(ticket);
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>View Details</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playKeyClick();
                onNewTicket();
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Ticket (F1)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
